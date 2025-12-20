<?php

namespace Aero\Rfi\Providers;

use Aero\Core\Providers\AbstractModuleProvider;
use Aero\Core\Services\NavigationRegistry;
use Aero\Core\Services\UserRelationshipRegistry;
use Aero\Rfi\Models\DailyWork;
use Aero\Rfi\Models\Objection;
use Aero\Rfi\Models\WorkLocation;
use Aero\Rfi\Policies\DailyWorkPolicy;
use Aero\Rfi\Policies\ObjectionPolicy;
use Aero\Rfi\Policies\WorkLocationPolicy;
use Illuminate\Support\Facades\Gate;

/**
 * RFI Module Provider
 *
 * Provides RFI (Request for Inspection) management functionality including
 * daily works, objections, and work locations.
 *
 * All module metadata is read from config/module.php (single source of truth).
 * This provider only contains module-specific services, policies, and relationships.
 */
class RfiModuleProvider extends AbstractModuleProvider
{
    /**
     * Module code - the only required property.
     * All other metadata is read from config/module.php.
     */
    protected string $moduleCode = 'rfi';

    /**
     * Get the module path.
     */
    protected function getModulePath(string $path = ''): string
    {
        $basePath = dirname(__DIR__, 2);

        return $path ? $basePath.'/'.$path : $basePath;
    }

    /**
     * Override parent loadRoutes to prevent duplicate route registration.
     * Routes are registered by AeroRfiServiceProvider with proper middleware.
     */
    protected function loadRoutes(): void
    {
        // Do nothing - routes handled by AeroRfiServiceProvider
    }

    /**
     * Register module services.
     */
    protected function registerServices(): void
    {
        // Register main RFI service
        $this->app->singleton('rfi', function ($app) {
            return new \Aero\Rfi\Services\RfiService;
        });

        // Register specific services
        $this->app->singleton('rfi.daily-work', function ($app) {
            return new \Aero\Rfi\Services\DailyWorkService;
        });

        $this->app->singleton('rfi.objection', function ($app) {
            return new \Aero\Rfi\Services\ObjectionService;
        });

        // Merge RFI-specific configuration
        $rfiConfigPath = $this->getModulePath('config/rfi.php');
        if (file_exists($rfiConfigPath)) {
            $this->mergeConfigFrom($rfiConfigPath, 'rfi');
        }
    }

    /**
     * Boot RFI module.
     */
    protected function bootModule(): void
    {
        // Register policies
        $this->registerPolicies();

        // Register User model relationships dynamically
        $this->registerUserRelationships();

        // Register navigation items for auto-discovery
        $this->registerNavigation();
    }

    /**
     * Register User model relationships via UserRelationshipRegistry.
     * This allows the core User model to be extended without hard dependencies.
     */
    protected function registerUserRelationships(): void
    {
        if (! $this->app->bound(UserRelationshipRegistry::class)) {
            return;
        }

        $registry = $this->app->make(UserRelationshipRegistry::class);

        // Register daily works where user is incharge
        $registry->registerRelationship('dailyWorksAsIncharge', function ($user) {
            return $user->hasMany(DailyWork::class, 'incharge_user_id');
        });

        // Register daily works where user is assigned
        $registry->registerRelationship('dailyWorksAsAssigned', function ($user) {
            return $user->hasMany(DailyWork::class, 'assigned_user_id');
        });

        // Register objections created by user
        $registry->registerRelationship('objections', function ($user) {
            return $user->hasMany(Objection::class, 'created_by');
        });

        // Register work locations where user is incharge
        $registry->registerRelationship('workLocations', function ($user) {
            return $user->hasMany(WorkLocation::class, 'incharge_user_id');
        });

        // Register scopes for user queries
        $registry->registerScope('withRfiRelations', function ($query) {
            return $query->with([
                'dailyWorksAsIncharge',
                'dailyWorksAsAssigned',
                'workLocations',
            ]);
        });

        // Register computed accessors
        $registry->registerAccessor('daily_works_count', function ($user) {
            return $user->dailyWorksAsIncharge()->count() + $user->dailyWorksAsAssigned()->count();
        });

        $registry->registerAccessor('active_objections_count', function ($user) {
            return $user->objections()->whereIn('status', ['draft', 'submitted', 'under_review'])->count();
        });
    }

    /**
     * Register RFI navigation items with NavigationRegistry.
     * Navigation is derived from config/module.php submodules for consistency.
     */
    protected function registerNavigation(): void
    {
        if (! $this->app->bound(NavigationRegistry::class)) {
            return;
        }

        $navRegistry = $this->app->make(NavigationRegistry::class);
        $config = $this->getModuleConfig();
        $modulePriority = $this->getModulePriority();

        // Build navigation children from config submodules
        $submoduleNav = [];
        foreach ($config['submodules'] ?? [] as $submodule) {
            $submoduleCode = $submodule['code'] ?? '';
            $submoduleIcon = $submodule['icon'] ?? null;

            // Build component children for this submodule
            $componentNav = [];
            foreach ($submodule['components'] ?? [] as $component) {
                // Only include components with routes (pages)
                if (empty($component['route'])) {
                    continue;
                }

                $componentNav[] = [
                    'name' => $component['name'] ?? ucfirst($component['code'] ?? ''),
                    'path' => $component['route'] ?? '',
                    'icon' => $component['icon'] ?? $submoduleIcon,
                    'access' => $this->moduleCode.'.'.$submoduleCode.'.'.($component['code'] ?? ''),
                    'type' => $component['type'] ?? 'page',
                ];
            }

            $submoduleNav[] = [
                'name' => $submodule['name'] ?? ucfirst($submoduleCode),
                'path' => $submodule['route'] ?? '',
                'icon' => $submoduleIcon,
                'access' => $this->moduleCode.'.'.$submoduleCode,
                'priority' => $submodule['priority'] ?? 100,
                'children' => $componentNav,
            ];
        }

        // Sort submodules by priority
        usort($submoduleNav, fn ($a, $b) => ($a['priority'] ?? 100) <=> ($b['priority'] ?? 100));

        // Register main RFI navigation with module as parent wrapper
        // Scope: 'tenant' - RFI is for tenant users only
        $navRegistry->register($this->moduleCode, [
            [
                'name' => $config['name'] ?? 'RFI Management',
                'icon' => $config['icon'] ?? 'ClipboardDocumentCheckIcon',
                'access' => $this->moduleCode,
                'priority' => $modulePriority,
                'children' => $submoduleNav,
            ],
        ], $modulePriority, 'tenant');
    }

    /**
     * Register policies.
     */
    protected function registerPolicies(): void
    {
        $policies = [
            DailyWork::class => DailyWorkPolicy::class,
            Objection::class => ObjectionPolicy::class,
            WorkLocation::class => WorkLocationPolicy::class,
        ];

        foreach ($policies as $model => $policy) {
            if (class_exists($policy)) {
                Gate::policy($model, $policy);
            }
        }
    }

    /**
     * Register this module with the ModuleRegistry.
     */
    public function register(): void
    {
        parent::register();

        // Register this module with the registry
        if ($this->app->bound(\Aero\Core\Services\ModuleRegistry::class)) {
            $registry = $this->app->make(\Aero\Core\Services\ModuleRegistry::class);
            $registry->register($this);
        }
    }
}
