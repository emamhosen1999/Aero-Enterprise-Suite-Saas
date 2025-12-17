<?php

declare(strict_types=1);

namespace Aero\Platform\Providers;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Stancl\JobPipeline\JobPipeline;
use Stancl\Tenancy\Events;
use Stancl\Tenancy\Jobs;
use Stancl\Tenancy\Listeners;
use Stancl\Tenancy\Middleware;

/**
 * Tenancy Bootstrap Service Provider
 *
 * Registers the event listeners required for stancl/tenancy to function properly.
 * This includes:
 * - BootstrapTenancy listener for TenancyInitialized event (switches DB connection)
 * - RevertToCentralContext listener for TenancyEnded event
 *
 * CRITICAL: Without this provider, tenancy initialization will NOT switch
 * the database connection to the tenant database!
 */
class TenancyBootstrapServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->bootEvents();
        $this->makeTenancyMiddlewareHighestPriority();
    }

    /**
     * Get the events and listeners for tenancy.
     *
     * @return array<class-string, array<int, class-string|JobPipeline>>
     */
    public function events(): array
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

            // CRITICAL: Tenancy initialization events
            // These listeners switch the database connection when tenancy is initialized
            Events\InitializingTenancy::class => [],
            Events\TenancyInitialized::class => [
                Listeners\BootstrapTenancy::class,  // Runs bootstrappers (DB switch, cache, etc.)
            ],

            Events\EndingTenancy::class => [],
            Events\TenancyEnded::class => [
                Listeners\RevertToCentralContext::class,  // Reverts DB connection to central
            ],

            Events\BootstrappingTenancy::class => [],
            Events\TenancyBootstrapped::class => [],
            Events\RevertingToCentralContext::class => [],
            Events\RevertedToCentralContext::class => [],

            // Resource syncing
            Events\SyncedResourceSaved::class => [
                Listeners\UpdateSyncedResource::class,
            ],

            Events\SyncedResourceChangedInForeignDatabase::class => [],
        ];
    }

    /**
     * Register event listeners for tenancy events.
     */
    protected function bootEvents(): void
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

    /**
     * Jobs to run when a tenant is created.
     *
     * DISABLED: Our ProvisionTenant job handles database creation and migration
     * manually using dispatchSync(). This prevents duplicate database operations
     * and allows for proper async provisioning with status tracking.
     *
     * @return array<int, class-string>
     */
    protected function tenantCreatedJobs(): array
    {
        return [];
    }

    /**
     * Jobs to run when a tenant is deleted.
     *
     * @return array<int, class-string>
     */
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
     * Make tenancy middleware the highest priority.
     *
     * This ensures tenancy is initialized before any other middleware runs.
     */
    protected function makeTenancyMiddlewareHighestPriority(): void
    {
        $tenancyMiddleware = [
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
