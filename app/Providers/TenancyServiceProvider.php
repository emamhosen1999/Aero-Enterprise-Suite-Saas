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
        $tenantCreatedListeners = [];

        if ($jobs = $this->tenantCreatedJobs()) {
            $tenantCreatedListeners[] = JobPipeline::make($jobs)
                ->send(function (Events\TenantCreated $event) {
                    return $event->tenant;
                })
                ->shouldBeQueued(false);
        }

        $tenantDeletedListeners = [];

        if ($jobs = $this->tenantDeletedJobs()) {
            $tenantDeletedListeners[] = JobPipeline::make($jobs)
                ->send(function (Events\TenantDeleted $event) {
                    return $event->tenant;
                })
                ->shouldBeQueued(false);
        }

        return [
            // Tenant events
            Events\CreatingTenant::class => [],
            Events\TenantCreated::class => $tenantCreatedListeners,
            Events\SavingTenant::class => [],
            Events\TenantSaved::class => [],
            Events\UpdatingTenant::class => [],
            Events\TenantUpdated::class => [],
            Events\DeletingTenant::class => [],
            Events\TenantDeleted::class => $tenantDeletedListeners,

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
            // IMPORTANT: Order matters! More specific routes first.
            
            // 1. Map admin routes (admin.aero-enterprise-suite-saas.com)
            $this->mapAdminRoutes();

            // 2. Map platform routes (aero-enterprise-suite-saas.com) - with domain constraint
            $this->mapPlatformRoutes();

            // 3. Map tenant routes (*.aero-enterprise-suite-saas.com) - catches all other subdomains
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

        $adminDomain = env('ADMIN_DOMAIN', 'admin.aero-enterprise-suite-saas.com');

        Route::domain($adminDomain)
            ->middleware([
                'web',
                IdentifyDomainContext::class,
            ])
            ->namespace(static::$controllerNamespace)
            ->group(base_path('routes/admin.php'));
    }

    /**
     * Map platform/public routes for the main domain (landing, registration)
     *
     * Platform routes are bound to the central domain only.
     * This prevents them from matching on tenant subdomains.
     */
    protected function mapPlatformRoutes(): void
    {
        if (! file_exists(base_path('routes/platform.php'))) {
            return;
        }

        // Get all central domains (main domain, localhost, etc.)
        $centralDomains = $this->getCentralDomainsWithoutAdmin();

        foreach ($centralDomains as $domain) {
            if (empty($domain)) {
                continue;
            }

            Route::domain($domain)
                ->middleware([
                    'web',
                    IdentifyDomainContext::class,
                ])
                ->namespace(static::$controllerNamespace)
                ->group(base_path('routes/platform.php'));
        }
    }

    /**
     * Map tenant routes for tenant subdomains ({tenant}.platform.com)
     *
     * Tenant routes use InitializeTenancyByDomain middleware which will:
     * 1. Look up the domain in the domains table
     * 2. Initialize the tenant if found
     * 3. PreventAccessFromCentralDomains will block access from central domains
     */
    protected function mapTenantRoutes(): void
    {
        if (! file_exists(base_path('routes/tenant.php'))) {
            return;
        }

        // Tenant routes are loaded without domain constraint.
        // The InitializeTenancyByDomain middleware inside tenant.php
        // will identify the tenant from the domain and initialize the connection.
        // PreventAccessFromCentralDomains middleware blocks central domain access.
        Route::middleware('web')
            ->namespace(static::$controllerNamespace)
            ->group(base_path('routes/tenant.php'));
    }

    protected function tenantCreatedJobs(): array
    {
        if ($this->app->runningUnitTests()) {
            return [];
        }

        return [
            Jobs\CreateDatabase::class,
            Jobs\MigrateDatabase::class,
            Jobs\SeedDatabase::class,
        ];
    }

    protected function tenantDeletedJobs(): array
    {
        if ($this->app->runningUnitTests()) {
            return [];
        }

        return [
            Jobs\DeleteDatabase::class,
        ];
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
