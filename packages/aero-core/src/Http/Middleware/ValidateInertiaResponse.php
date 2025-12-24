<?php

namespace Aero\Core\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Validate Inertia Response Middleware
 *
 * Ensures that Inertia requests receive appropriate response types:
 * - GET requests should return Inertia responses (HTML with page data)
 * - POST/PUT/PATCH/DELETE requests should return redirects (or validation errors)
 * - Never return plain JSON for Inertia requests
 *
 * This middleware logs violations to help identify non-compliant controllers.
 */
class ValidateInertiaResponse
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Only validate actual Inertia requests
        if (! $this->isInertiaRequest($request)) {
            return $response;
        }

        // Validate response type based on HTTP method
        $this->validateResponseType($request, $response);

        return $response;
    }

    /**
     * Check if request is an Inertia request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function isInertiaRequest(Request $request): bool
    {
        return $request->header('X-Inertia') !== null;
    }

    /**
     * Validate that response type is appropriate for Inertia.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  mixed  $response
     * @return void
     */
    protected function validateResponseType(Request $request, $response): void
    {
        $method = $request->method();
        $url = $request->fullUrl();

        // For mutation requests (POST/PUT/PATCH/DELETE)
        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            $this->validateMutationResponse($request, $response, $method, $url);
        }

        // For GET requests
        if ($method === 'GET') {
            $this->validateGetResponse($request, $response, $url);
        }
    }

    /**
     * Validate response for mutation requests (POST/PUT/PATCH/DELETE).
     *
     * These should return redirects, not JSON (except for validation errors).
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  mixed  $response
     * @param  string  $method
     * @param  string  $url
     * @return void
     */
    protected function validateMutationResponse(Request $request, $response, string $method, string $url): void
    {
        // Check if response is JSON
        if ($response instanceof JsonResponse) {
            // Get JSON content to check if it's validation errors
            $content = $response->getData(true);

            // Validation errors are acceptable (422 status)
            if ($response->status() === 422 && isset($content['errors'])) {
                return;
            }

            // Any other JSON response is non-compliant
            Log::warning('Inertia Compliance Violation: JSON response for mutation request', [
                'method' => $method,
                'url' => $url,
                'status' => $response->status(),
                'route' => $request->route()?->getName(),
                'controller' => $request->route()?->getActionName(),
                'response_type' => 'JsonResponse',
                'recommendation' => 'Return redirect()->route() instead of response()->json()',
            ]);

            return;
        }

        // Check if response is a redirect (which is correct)
        if ($this->isRedirectResponse($response)) {
            // This is correct - no warning needed
            return;
        }

        // Check if response is an Inertia response (unusual for mutations)
        if ($this->isInertiaResponse($response)) {
            Log::info('Inertia Response on mutation request', [
                'method' => $method,
                'url' => $url,
                'route' => $request->route()?->getName(),
                'note' => 'Typically mutations should redirect, but Inertia responses are acceptable for validation errors',
            ]);

            return;
        }

        // Any other response type is suspicious
        Log::warning('Inertia Compliance: Unexpected response type for mutation', [
            'method' => $method,
            'url' => $url,
            'response_type' => get_class($response),
            'status' => method_exists($response, 'status') ? $response->status() : 'unknown',
        ]);
    }

    /**
     * Validate response for GET requests.
     *
     * These should return Inertia responses (HTML with page data).
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  mixed  $response
     * @param  string  $url
     * @return void
     */
    protected function validateGetResponse(Request $request, $response, string $url): void
    {
        // Redirects are acceptable for GET (e.g., auth middleware redirects)
        if ($this->isRedirectResponse($response)) {
            return;
        }

        // Inertia response is correct for GET
        if ($this->isInertiaResponse($response)) {
            return;
        }

        // JSON response on GET Inertia request is usually wrong
        if ($response instanceof JsonResponse) {
            Log::warning('Inertia Compliance Violation: JSON response for GET request', [
                'url' => $url,
                'route' => $request->route()?->getName(),
                'controller' => $request->route()?->getActionName(),
                'recommendation' => 'Return Inertia::render() instead of response()->json()',
            ]);

            return;
        }

        // Log any other unexpected response types
        if (! $this->isInertiaResponse($response)) {
            Log::info('Inertia GET request with non-Inertia response', [
                'url' => $url,
                'response_type' => get_class($response),
                'status' => method_exists($response, 'status') ? $response->status() : 'unknown',
            ]);
        }
    }

    /**
     * Check if response is a redirect.
     *
     * @param  mixed  $response
     * @return bool
     */
    protected function isRedirectResponse($response): bool
    {
        return $response instanceof \Illuminate\Http\RedirectResponse ||
               (method_exists($response, 'isRedirection') && $response->isRedirection());
    }

    /**
     * Check if response is an Inertia response.
     *
     * @param  mixed  $response
     * @return bool
     */
    protected function isInertiaResponse($response): bool
    {
        // Inertia responses have X-Inertia header
        if (method_exists($response, 'headers')) {
            return $response->headers->get('X-Inertia') !== null;
        }

        return false;
    }
}
