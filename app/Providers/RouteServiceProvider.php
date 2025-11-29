<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/dashboard';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // IMPORTANT: Do NOT load web.php or other module routes here!
        // Routes are loaded by TenancyServiceProvider with proper domain constraints:
        // - platform.php → central domain (aero-enterprise-suite-saas.com)
        // - admin.php → admin domain (admin.aero-enterprise-suite-saas.com)
        // - tenant.php → tenant subdomains (*.aero-enterprise-suite-saas.com)
        //
        // Loading routes here without domain constraints causes conflicts.

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));
        });
    }
}
