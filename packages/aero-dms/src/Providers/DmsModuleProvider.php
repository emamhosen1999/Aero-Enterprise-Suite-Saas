<?php

namespace Aero\Dms\Providers;

use Aero\Core\Providers\AbstractModuleProvider;
use Aero\Core\Contracts\ModuleRegistry;
use Aero\Core\Services\DashboardWidgetRegistry;
use Aero\DMS\Widgets\RecentDocumentsWidget;
use Aero\DMS\Widgets\StorageUsageWidget;
use Aero\DMS\Widgets\PendingApprovalsWidget;
use Aero\DMS\Widgets\SharedWithMeWidget;

class DmsModuleProvider extends AbstractModuleProvider
{
    protected string $moduleCode = 'dms';
    protected string $moduleName = 'Document Management';
    protected string $moduleDescription = 'Complete document management system with version control, approval workflows, and secure document storage';
    protected string $moduleVersion = '1.0.0';
    protected int $modulePriority = 18;
    protected array $dependencies = ['core'];
    protected array $authors = [
        ['name' => 'Aero Team', 'email' => 'dev@aero.com'],
    ];

    /**
     * Register the module with the application.
     */
    public function register(): void
    {
        parent::register();
        
        // Register with ModuleRegistry
        $this->app->make(ModuleRegistry::class)->register($this);
        
        // Register module services
        $this->registerServices();
    }

    /**
     * Bootstrap the module services.
     */
    public function boot(): void
    {
        parent::boot();
        
        // Routes are loaded by parent::boot() via AbstractModuleProvider::loadRoutes()
        // which applies proper domain isolation middleware.
        
        // Load module migrations
        $this->loadMigrationsFrom(__DIR__ . '/../../database/migrations');
        
        // Load module views (if any)
        // $this->loadViewsFrom(__DIR__.'/../../resources/views', 'dms');
        
        // Register dashboard widgets
        $this->registerDashboardWidgets();
        
        // Publish module assets
        $this->publishes([
            __DIR__ . '/../../config/module.php' => config_path('modules/dms.php'),
        ], 'dms-config');
    }

    /**
     * Register DMS dashboard widgets.
     */
    protected function registerDashboardWidgets(): void
    {
        $registry = $this->app->make(DashboardWidgetRegistry::class);
        
        $registry->registerMany([
            new RecentDocumentsWidget(),
            new StorageUsageWidget(),
            new PendingApprovalsWidget(),
            new SharedWithMeWidget(),
        ]);
    }

    /**
     * Get module navigation items.
     */
    protected function getNavigationItems(): array
    {
        return [
            [
                'label' => 'Dashboard',
                'route' => 'tenant.dms.dashboard',
                'icon' => 'ChartBarIcon',
                'order' => 1,
            ],
            [
                'label' => 'Documents',
                'route' => 'tenant.dms.documents',
                'icon' => 'DocumentTextIcon',
                'order' => 2,
            ],
            [
                'label' => 'Folders',
                'route' => 'tenant.dms.folders',
                'icon' => 'FolderIcon',
                'order' => 3,
            ],
            [
                'label' => 'Templates',
                'route' => 'tenant.dms.templates',
                'icon' => 'DocumentDuplicateIcon',
                'order' => 4,
            ],
        ];
    }

    /**
     * Get module hierarchy definition.
     */
    protected function getModuleHierarchy(): array
    {
        return [
            'submodules' => [
                [
                    'code' => 'document_management',
                    'name' => 'Document Management',
                    'description' => 'Core document management features',
                    'components' => [
                        [
                            'code' => 'documents',
                            'name' => 'Documents',
                            'description' => 'Document CRUD operations',
                            'actions' => ['view', 'create', 'edit', 'delete', 'upload', 'download', 'preview', 'share', 'version'],
                        ],
                        [
                            'code' => 'folders',
                            'name' => 'Folders',
                            'description' => 'Folder organization',
                            'actions' => ['view', 'create', 'edit', 'delete', 'move', 'share'],
                        ],
                        [
                            'code' => 'categories',
                            'name' => 'Categories',
                            'description' => 'Document categorization',
                            'actions' => ['view', 'create', 'edit', 'delete'],
                        ],
                    ],
                ],
                [
                    'code' => 'version_control',
                    'name' => 'Version Control',
                    'description' => 'Document version management',
                    'components' => [
                        [
                            'code' => 'versions',
                            'name' => 'Document Versions',
                            'description' => 'Version history and management',
                            'actions' => ['view', 'create', 'restore', 'compare', 'download'],
                        ],
                    ],
                ],
                [
                    'code' => 'approval_workflow',
                    'name' => 'Approval Workflow',
                    'description' => 'Document approval processes',
                    'components' => [
                        [
                            'code' => 'approvals',
                            'name' => 'Document Approvals',
                            'description' => 'Approval workflow management',
                            'actions' => ['view', 'approve', 'reject', 'request'],
                        ],
                        [
                            'code' => 'workflows',
                            'name' => 'Workflows',
                            'description' => 'Workflow configuration',
                            'actions' => ['view', 'create', 'edit', 'delete'],
                        ],
                    ],
                ],
                [
                    'code' => 'templates',
                    'name' => 'Document Templates',
                    'description' => 'Template management',
                    'components' => [
                        [
                            'code' => 'templates',
                            'name' => 'Templates',
                            'description' => 'Document template management',
                            'actions' => ['view', 'create', 'edit', 'delete', 'use'],
                        ],
                    ],
                ],
                [
                    'code' => 'security',
                    'name' => 'Security & Access',
                    'description' => 'Document security and access control',
                    'components' => [
                        [
                            'code' => 'access_control',
                            'name' => 'Access Control',
                            'description' => 'Manage document permissions',
                            'actions' => ['view', 'grant', 'revoke'],
                        ],
                        [
                            'code' => 'audit_logs',
                            'name' => 'Audit Logs',
                            'description' => 'Document access and activity logs',
                            'actions' => ['view', 'export'],
                        ],
                        [
                            'code' => 'signatures',
                            'name' => 'Digital Signatures',
                            'description' => 'Document signing',
                            'actions' => ['view', 'sign', 'verify'],
                        ],
                    ],
                ],
            ],
        ];
    }

    /**
     * Register module-specific services.
     */
    protected function registerServices(): void
    {
        // Register DMS service
        $this->app->singleton(\Aero\Dms\Services\DMSService::class);
    }
}
