<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Aero\Platform\Services\PlanEntitlementService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Check Plan Entitlements Middleware
 *
 * Enforces plan limits before processing requests.
 * Apply to routes that create resources subject to plan limits.
 */
class CheckPlanEntitlements
{
    public function __construct(
        protected PlanEntitlementService $entitlementService
    ) {}

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $limit = 'users'): Response
    {
        $tenantId = $request->user()?->tenant_id;

        if (! $tenantId) {
            return $next($request);
        }

        match ($limit) {
            'users' => $this->checkUserLimit($tenantId),
            'storage' => $this->checkStorageLimit($tenantId),
            default => null,
        };

        return $next($request);
    }

    /**
     * Check user limit.
     */
    protected function checkUserLimit(string $tenantId): void
    {
        if ($this->entitlementService->hasReachedUserLimit($tenantId)) {
            $remaining = $this->entitlementService->getRemainingUserSlots($tenantId);

            abort(403, sprintf(
                'User limit reached for your plan. Please upgrade to add more users. Remaining slots: %d',
                $remaining ?? 0
            ));
        }
    }

    /**
     * Check storage limit.
     */
    protected function checkStorageLimit(string $tenantId): void
    {
        if ($this->entitlementService->hasReachedStorageLimit($tenantId)) {
            abort(403, 'Storage limit reached for your plan. Please upgrade to add more storage.');
        }
    }
}
