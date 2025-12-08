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
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! IdentifyDomainContext::isPlatform($request)) {
            abort(404);
        }

        return $next($request);
    }
}
