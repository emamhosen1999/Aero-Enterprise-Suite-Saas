<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdminDomain
{
    /**
     * Allow access only when the current domain context is admin.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! IdentifyDomainContext::isAdmin($request)) {
            abort(404);
        }

        return $next($request);
    }
}
