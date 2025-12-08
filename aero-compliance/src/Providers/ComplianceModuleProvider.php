<?php

namespace Aero\Compliance\Providers;

use Aero\Core\Providers\AbstractModuleProvider;

/**
 * Compliance Module Provider
 *
 * Provides compliance management functionality including regulatory compliance,
 * audit trails, and compliance reporting.
 */
class ComplianceModuleProvider extends AbstractModuleProvider
{
    protected string $moduleCode = 'compliance';
    protected string $moduleName = 'Compliance Management';
    protected string $moduleDescription = 'Complete compliance management system with regulatory tracking, audit trails, and compliance reporting';
    protected string $moduleVersion = '1.0.0';
    protected string $moduleCategory = 'business';
    protected string $moduleIcon = 'ShieldCheckIcon';
    protected int $modulePriority = 17;
    protected bool $enabled = true;
    protected ?string $minimumPlan = 'enterprise';
    protected array $dependencies = ['core'];

    protected array $navigationItems = [
        [
            'code' => 'compliance_dashboard',
            'name' => 'Compliance Dashboard',
            'icon' => 'ShieldCheckIcon',
            'route' => 'compliance.dashboard',
            'priority' => 1,
        ],
        [
            'code' => 'compliance_requirements',
            'name' => 'Requirements',
            'icon' => 'DocumentCheckIcon',
            'route' => 'compliance.requirements.index',
            'priority' => 2,
        ],
        [
            'code' => 'compliance_audits',
            'name' => 'Audits',
            'icon' => 'ClipboardDocumentCheckIcon',
            'route' => 'compliance.audits.index',
            'priority' => 3,
        ],
        [
            'code' => 'compliance_policies',
            'name' => 'Policies',
            'icon' => 'DocumentTextIcon',
            'route' => 'compliance.policies.index',
            'priority' => 4,
        ],
    ];

    protected array $moduleHierarchy = [
        'code' => 'compliance',
        'name' => 'Compliance Management',
        'description' => 'Regulatory compliance and audit management',
        'icon' => 'ShieldCheckIcon',
        'priority' => 17,
        'is_active' => true,
        'requires_subscription' => true,
        'route_prefix' => 'compliance',
        'sub_modules' => [
            [
                'code' => 'regulatory_requirements',
                'name' => 'Regulatory Requirements',
                'description' => 'Manage regulatory requirements',
                'icon' => 'DocumentCheckIcon',
                'priority' => 1,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'requirements_list',
                        'name' => 'Requirements List',
                        'description' => 'View and manage regulatory requirements',
                        'route_name' => 'compliance.requirements.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Requirements', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Requirement', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Requirement', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Requirement', 'is_active' => true],
                            ['code' => 'assess', 'name' => 'Assess Compliance', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'audit_management',
                'name' => 'Audit Management',
                'description' => 'Manage compliance audits',
                'icon' => 'ClipboardDocumentCheckIcon',
                'priority' => 2,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'audit_list',
                        'name' => 'Audit List',
                        'description' => 'View and manage audits',
                        'route_name' => 'compliance.audits.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Audits', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Audit', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Audit', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Audit', 'is_active' => true],
                            ['code' => 'schedule', 'name' => 'Schedule Audit', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'compliance_policies',
                'name' => 'Compliance Policies',
                'description' => 'Manage compliance policies',
                'icon' => 'DocumentTextIcon',
                'priority' => 3,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'policy_list',
                        'name' => 'Policy List',
                        'description' => 'View and manage policies',
                        'route_name' => 'compliance.policies.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Policies', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Policy', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Policy', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Policy', 'is_active' => true],
                            ['code' => 'publish', 'name' => 'Publish Policy', 'is_active' => true],
                        ],
                    ],
                ],
            ],
            [
                'code' => 'jurisdictions',
                'name' => 'Jurisdictions',
                'description' => 'Manage jurisdictions and regulatory bodies',
                'icon' => 'GlobeAltIcon',
                'priority' => 4,
                'is_active' => true,
                'components' => [
                    [
                        'code' => 'jurisdiction_list',
                        'name' => 'Jurisdiction List',
                        'description' => 'View and manage jurisdictions',
                        'route_name' => 'compliance.jurisdictions.index',
                        'priority' => 1,
                        'is_active' => true,
                        'actions' => [
                            ['code' => 'view', 'name' => 'View Jurisdictions', 'is_active' => true],
                            ['code' => 'create', 'name' => 'Create Jurisdiction', 'is_active' => true],
                            ['code' => 'edit', 'name' => 'Edit Jurisdiction', 'is_active' => true],
                            ['code' => 'delete', 'name' => 'Delete Jurisdiction', 'is_active' => true],
                        ],
                    ],
                ],
            ],
        ],
    ];

    protected function getModulePath(string $path = ''): string
    {
        $basePath = dirname(__DIR__, 2);
        return $path ? $basePath . '/' . $path : $basePath;
    }

    protected function registerServices(): void
    {
        // Register Compliance-specific services here when needed
    }

    protected function bootModule(): void
    {
        // Register module-specific middleware, policies, etc.
    }

    public function register(): void
    {
        parent::register();
        $registry = $this->app->make(\Aero\Core\Services\ModuleRegistry::class);
        $registry->register($this);
    }
}
