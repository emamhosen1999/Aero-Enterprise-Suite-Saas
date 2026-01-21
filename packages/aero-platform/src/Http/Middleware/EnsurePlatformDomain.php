<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePlatformDomain
{
    /**
     * Allow access only when the current domain context is platform.
     *
     * This middleware ensures routes are only accessible from the platform domain
     * (e.g., aeos365.test), not from admin subdomain (admin.aeos365.test) or
     * tenant subdomains (tenant1.aeos365.test).
     *
     * Used by:
     * - Platform functional routes (registration, auth, webhooks)
     * - CMS public page rendering
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! IdentifyDomainContext::isPlatform($request)) {
            abort(404);
        }

        return $next($request);
    }
}
