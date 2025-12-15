<?php

namespace Aero\Platform\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureInstallationVerified
{
    public function handle(Request $request, Closure $next)
    {
        if (! session('installation_verified')) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            return redirect()->route('installation.secret');
        }

        return $next($request);
    }
}
