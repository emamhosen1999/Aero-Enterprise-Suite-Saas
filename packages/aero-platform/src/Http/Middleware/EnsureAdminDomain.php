<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Aero\Core\Traits\ParsesHostDomain;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminDomain
{
    use ParsesHostDomain;

    /**
     * Allow access only when the current domain context is admin.
     *
     * Uses direct host detection to check if request is from admin subdomain.
     * Falls back to checking the domain_context attribute if already set by
     * IdentifyDomainContext middleware.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // First check if IdentifyDomainContext already set the context
        if ($request->attributes->has('domain_context')) {
            if (! IdentifyDomainContext::isAdmin($request)) {
                abort(404);
            }

            return $next($request);
        }

        // Fallback: Direct host detection using ParsesHostDomain trait
        if (! $this->isHostAdminDomain($request->getHost())) {
            abort(404);
        }

        return $next($request);
    }
}
