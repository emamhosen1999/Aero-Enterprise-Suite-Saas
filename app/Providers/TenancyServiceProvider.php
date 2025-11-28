<?php

declare(strict_types=1);

namespace App\Providers;

use App\Http\Middleware\IdentifyDomainContext;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Stancl\JobPipeline\JobPipeline;
use Stancl\Tenancy\Events;
use Stancl\Tenancy\Jobs;
use Stancl\Tenancy\Listeners;
use Stancl\Tenancy\Middleware;

class TenancyServiceProvider extends ServiceProvider
{
    // By default, no namespace is used to support the callable array syntax.
    public static string $controllerNamespace = '';

    public function events()
    {
        return [
            // Tenant events
            Events\CreatingTenant::class => [],
            Events\TenantCreated::class => [
                JobPipeline::make([
                    Jobs\CreateDatabase::class,
                    Jobs\MigrateDatabase::class,
                    // Jobs\SeedDatabase::class,

                    // Your own jobs to prepare the tenant.
                    // Provision API keys, create S3 buckets, anything you want!

                ])->send(function (Events\TenantCreated $event) {
                    return $event->tenant;
                })->shouldBeQueued(false), // `false` by default, but you probably want to make this `true` for production.
            ],
            Events\SavingTenant::class => [],
            Events\TenantSaved::class => [],
            Events\UpdatingTenant::class => [],
            Events\TenantUpdated::class => [],
            Events\DeletingTenant::class => [],
            Events\TenantDeleted::class => [
                JobPipeline::make([
                    Jobs\DeleteDatabase::class,
                ])->send(function (Events\TenantDeleted $event) {
                    return $event->tenant;
                })->shouldBeQueued(false), // `false` by default, but you probably want to make this `true` for production.
            ],

            // Domain events
            Events\CreatingDomain::class => [],
            Events\DomainCreated::class => [],
            Events\SavingDomain::class => [],
            Events\DomainSaved::class => [],
            Events\UpdatingDomain::class => [],
            Events\DomainUpdated::class => [],
            Events\DeletingDomain::class => [],
            Events\DomainDeleted::class => [],

            // Database events
            Events\DatabaseCreated::class => [],
            Events\DatabaseMigrated::class => [],
            Events\DatabaseSeeded::class => [],
            Events\DatabaseRolledBack::class => [],
            Events\DatabaseDeleted::class => [],

            // Tenancy events
            Events\InitializingTenancy::class => [],
            Events\TenancyInitialized::class => [
                Listeners\BootstrapTenancy::class,
            ],

            Events\EndingTenancy::class => [],
            Events\TenancyEnded::class => [
                Listeners\RevertToCentralContext::class,
            ],

            Events\BootstrappingTenancy::class => [],
            Events\TenancyBootstrapped::class => [],
            Events\RevertingToCentralContext::class => [],
            Events\RevertedToCentralContext::class => [],

            // Resource syncing
            Events\SyncedResourceSaved::class => [
                Listeners\UpdateSyncedResource::class,
            ],

            // Fired only when a synced resource is changed in a different DB than the origin DB (to avoid infinite loops)
            Events\SyncedResourceChangedInForeignDatabase::class => [],
        ];
    }

    public function register()
    {
        //
    }

    public function boot()
    {
        $this->bootEvents();
        $this->mapRoutes();

        $this->makeTenancyMiddlewareHighestPriority();
    }

    protected function bootEvents()
    {
        foreach ($this->events() as $event => $listeners) {
            foreach ($listeners as $listener) {
                if ($listener instanceof JobPipeline) {
                    $listener = $listener->toListener();
                }

                Event::listen($event, $listener);
            }
        }
    }

    protected function mapRoutes()
    {
        $this->app->booted(function () {
            // Map admin routes (admin.platform.com)
            $this->mapAdminRoutes();

            // Map platform routes (platform.com) - landing, registration
            $this->mapPlatformRoutes();

            // Map tenant routes ({tenant}.platform.com)
            $this->mapTenantRoutes();
        });
    }

    /**
     * Map admin panel routes for admin.platform.com
     *
     * Admin routes are bound to a specific domain for security.
     */
    protected function mapAdminRoutes(): void
    {
        if (! file_exists(base_path('routes/admin.php'))) {
            return;
        }

        $adminDomain = env('ADMIN_DOMAIN', 'admin.localhost');

        Route::domain($adminDomain)
            ->middleware([
                'web',
                IdentifyDomainContext::class,
            ])
            ->namespace(static::$controllerNamespace)
            ->group(base_path('routes/admin.php'));
    }

    /**
     * Map platform/public routes for platform.com (landing, registration)
     *
     * Platform routes are loaded without domain constraint - they work on any central domain.
     * The web.php routes already handle the landing page, but platform.php adds
     * registration and other platform-specific routes.
     */
    protected function mapPlatformRoutes(): void
    {
        if (! file_exists(base_path('routes/platform.php'))) {
            return;
        }

        // Load platform routes without domain constraint
        // These will work on any central domain (localhost, 127.0.0.1, platform.com, etc.)
        Route::middleware([
            'web',
            IdentifyDomainContext::class,
        ])
            ->namespace(static::$controllerNamespace)
            ->group(base_path('routes/platform.php'));
    }

    /**
     * Map tenant routes for {tenant}.platform.com
     *
     * Note: Tenant routes are NOT registered with a domain constraint.
     * Instead, they use InitializeTenancyByDomain middleware which will:
     * 1. Look up the domain in the domains table
     * 2. Initialize the tenant if found
     * 3. PreventAccessFromCentralDomains will block access from central domains
     *
     * This means for central domains, these routes won't work anyway.
     * We don't call this method - tenant routes are included via tenant.php directly.
     */
    protected function mapTenantRoutes(): void
    {
        // Tenant routes are now loaded via RouteServiceProvider or directly
        // They only work when InitializeTenancyByDomain successfully identifies a tenant
        // For central domains, PreventAccessFromCentralDomains will block access

        // Don't register tenant routes here to avoid conflicts with web.php
        // The routes/tenant.php file is included directly and protected by middleware
    }

    /**
     * Get central domains excluding the admin domain.
     *
     * @return array<string>
     */
    protected function getCentralDomainsWithoutAdmin(): array
    {
        $centralDomains = config('tenancy.central_domains', []);
        $adminDomain = env('ADMIN_DOMAIN', 'admin.localhost');

        return array_filter($centralDomains, function ($domain) use ($adminDomain) {
            return strtolower($domain) !== strtolower($adminDomain);
        });
    }

    protected function makeTenancyMiddlewareHighestPriority()
    {
        $tenancyMiddleware = [
            // Even higher priority than the initialization middleware
            Middleware\PreventAccessFromCentralDomains::class,

            Middleware\InitializeTenancyByDomain::class,
            Middleware\InitializeTenancyBySubdomain::class,
            Middleware\InitializeTenancyByDomainOrSubdomain::class,
            Middleware\InitializeTenancyByPath::class,
            Middleware\InitializeTenancyByRequestData::class,
        ];

        foreach (array_reverse($tenancyMiddleware) as $middleware) {
            $this->app[\Illuminate\Contracts\Http\Kernel::class]->prependToMiddlewarePriority($middleware);
        }
    }
}
