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
            // 1. Admin routes (admin.platform.com) - uses central DB
            $this->mapAdminRoutes();

            // 2. Platform routes (platform.com) - public pages, registration only
            $this->mapPlatformRoutes();

            // 3. Tenant routes (*.platform.com except admin) - uses tenant DB
            $this->mapTenantRoutes();
        });
    }

    /**
     * Admin routes for admin.platform.com
     * Uses central/platform database
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
     * Platform routes for platform.com (no subdomain)
     * Public pages + registration (NO login here - redirect to register)
     */
    protected function mapPlatformRoutes(): void
    {
        if (! file_exists(base_path('routes/platform.php'))) {
            return;
        }

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
     * Tenant routes for *.platform.com (except admin)
     * Uses tenant database
     *
     * NOTE: We don't add a domain constraint here because tenant domains
     * are dynamic. The PreventAccessFromCentralDomains middleware blocks
     * access from central domains at runtime.
     */
    protected function mapTenantRoutes(): void
    {
        if (! file_exists(base_path('routes/tenant.php'))) {
            return;
        }

        // Get central domains to check against
        $centralDomains = config('tenancy.central_domains', []);

        // Only register tenant routes if we're NOT on a central domain
        // This check happens at route registration time
        $currentHost = request()->getHost();

        // Skip loading tenant routes if current request is from central domain
        if (in_array($currentHost, $centralDomains, true)) {
            return;
        }

        // Tenant routes with tenancy middleware
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
