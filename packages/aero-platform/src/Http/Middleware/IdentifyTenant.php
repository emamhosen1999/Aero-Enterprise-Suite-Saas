<?php

namespace Aero\Platform\Http\Middleware;

use Aero\Platform\Models\Tenant;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class IdentifyTenant
{
    protected array $reserved = ['admin', 'www', 'api'];

    public function handle(Request $request, Closure $next)
    {
        $host      = $request->getHost();
        $base      = config('app.base_domain');
        $subdomain = str_replace('.' . $base, '', $host);

        if (!$subdomain || $subdomain === $host) {
            throw new NotFoundHttpException();
        }

        if (in_array($subdomain, $this->reserved)) {
            throw new NotFoundHttpException();
        }

        $tenant = Tenant::where('subdomain', $subdomain)->first();

        if (!$tenant) {
            abort(404, 'Tenant not found.');
        }

        app()->instance('tenant', $tenant);
        config(['database.connections.tenant.database' => $tenant->database]);

        return $next($request);
    }
}