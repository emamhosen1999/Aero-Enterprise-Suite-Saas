<?php

namespace Aero\Platform\Http\Middleware;

use Aero\Platform\Services\Billing\MeteredBillingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TrackApiUsage
{
    public function __construct(
        protected MeteredBillingService $billingService
    ) {}

    /**
     * Handle an incoming request and track API usage.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only track for authenticated tenant requests
        $tenant = tenant();

        if (! $tenant) {
            return $response;
        }

        // Only track successful API responses
        if (! $response->isSuccessful()) {
            return $response;
        }

        // Track API call
        $this->billingService->incrementUsage(
            $tenant,
            MeteredBillingService::METRIC_API_CALLS,
            1.0,
            auth()->user(),
        );

        return $response;
    }
}
