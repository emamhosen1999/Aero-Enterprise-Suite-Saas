<?php

declare(strict_types=1);

namespace Aero\HRM\Http\Middleware;

use Aero\HRM\Exceptions\UserNotOnboardedException;
use Aero\HRM\Services\EmployeeResolutionService;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure User Is Employee Middleware
 *
 * Guards all HRM routes to ensure the authenticated user is onboarded as an Employee.
 * This enforces the domain rule: HRM features are accessible only to Employees.
 *
 * Usage:
 * - Apply to route groups: Route::middleware(['auth', 'employee'])
 * - Exempt onboarding routes
 * - Provides graceful error handling with actionable messages
 */
class EnsureUserIsEmployee
{
    public function __construct(
        private EmployeeResolutionService $employeeResolver
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (! $request->user()) {
            return $this->handleUnauthenticated($request);
        }

        try {
            // Resolve Employee from authenticated user
            $employee = $this->employeeResolver->resolveFromUserId(
                $request->user()->id,
                withRelations: true
            );

            // Attach Employee to request for easy access in controllers
            $request->attributes->add(['employee' => $employee]);

            // Also make it available via helper method
            $request->macro('employee', fn () => $employee);

            // Check if employee is active
            if ($employee->status !== 'active') {
                return $this->handleInactiveEmployee($request, $employee);
            }

            return $next($request);
        } catch (UserNotOnboardedException $e) {
            return $this->handleNotOnboarded($request, $e);
        } catch (\Throwable $e) {
            return $this->handleUnexpectedError($request, $e);
        }
    }

    /**
     * Handle unauthenticated access
     */
    private function handleUnauthenticated(Request $request): Response
    {
        if ($request->expectsJson()) {
            return new JsonResponse([
                'message' => 'Unauthenticated',
                'error_code' => 'unauthenticated',
            ], 401);
        }

        return new RedirectResponse(route('login'));
    }

    /**
     * Handle not onboarded user
     */
    private function handleNotOnboarded(Request $request, UserNotOnboardedException $e): Response
    {
        Log::warning('User attempted to access HRM features without Employee record', [
            'user_id' => $request->user()?->id,
            'route' => $request->route()?->getName(),
            'url' => $request->fullUrl(),
        ]);

        if ($request->expectsJson()) {
            return new JsonResponse($e->getErrorData(), $e->getStatusCode());
        }

        // For web requests, redirect to onboarding notice page
        return (new RedirectResponse(route('hrm.onboarding.required')))
            ->with('error', $e->getMessage());
    }

    /**
     * Handle inactive employee
     */
    private function handleInactiveEmployee(Request $request, $employee): Response
    {
        Log::warning('Inactive employee attempted to access HRM features', [
            'employee_id' => $employee->id,
            'user_id' => $request->user()->id,
            'status' => $employee->status,
            'route' => $request->route()?->getName(),
        ]);

        if ($request->expectsJson()) {
            return new JsonResponse([
                'message' => 'Your employee account is inactive. Contact HR for assistance.',
                'error_code' => 'employee_inactive',
                'employee_status' => $employee->status,
            ], 403);
        }

        return (new RedirectResponse(route('hrm.account.inactive')))
            ->with('error', 'Your employee account is inactive. Contact HR for assistance.');
    }

    /**
     * Handle unexpected errors
     */
    private function handleUnexpectedError(Request $request, \Throwable $e): Response
    {
        Log::error('Unexpected error in EnsureUserIsEmployee middleware', [
            'user_id' => $request->user()?->id,
            'route' => $request->route()?->getName(),
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);

        if ($request->expectsJson()) {
            return new JsonResponse([
                'message' => 'An error occurred while verifying employee access',
                'error_code' => 'internal_error',
            ], 500);
        }

        return (new RedirectResponse(route('dashboard')))
            ->with('error', 'An error occurred. Please try again or contact support.');
    }
}
