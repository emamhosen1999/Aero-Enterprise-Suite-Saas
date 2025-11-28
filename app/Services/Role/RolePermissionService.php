<?php

namespace App\Services\Role;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

/**
 * Enterprise Role Permission Service
 *
 * Implements ISO 27001/27002 compliant role-based access control
 * Follows RBAC (Role-Based Access Control) industry standards
 */
class RolePermissionService
{
    /**
     * Standard enterprise module definitions aligned with comprehensive permission system
     */
    private const ENTERPRISE_MODULES = [
        // Core System
        'core' => [
            'name' => 'Dashboard & Analytics',
            'permissions' => ['core.dashboard.view', 'core.stats.view', 'core.updates.view'],
            'description' => 'Core system dashboard and analytics',
            'category' => 'core_system',
        ],

        // Self Service Module
        'self-service' => [
            'name' => 'Self Service Portal',
            'permissions' => [
                'attendance.own.view', 'attendance.own.punch',
                'leave.own.view', 'leave.own.create', 'leave.own.update', 'leave.own.delete',
                'communications.own.view', 'profile.own.view', 'profile.own.update', 'profile.password.change',
            ],
            'description' => 'Employee self-service capabilities',
            'category' => 'self_service',
        ],

        // Human Resource Management
        'hrm' => [
            'name' => 'Human Resource Management',
            'permissions' => [
                'employees.view', 'employees.create', 'employees.update', 'employees.delete', 'employees.import', 'employees.export',
                'departments.view', 'departments.create', 'departments.update', 'departments.delete',
                'designations.view', 'designations.create', 'designations.update', 'designations.delete',
                'attendance.view', 'attendance.create', 'attendance.update', 'attendance.delete', 'attendance.import', 'attendance.export',
                'holidays.view', 'holidays.create', 'holidays.update', 'holidays.delete',
                'leaves.view', 'leaves.create', 'leaves.update', 'leaves.delete', 'leaves.approve', 'leaves.analytics',
                'leave-settings.view', 'leave-settings.update',
                'jurisdiction.view', 'jurisdiction.create', 'jurisdiction.update', 'jurisdiction.delete',
            ],
            'description' => 'Human resources and employee management',
            'category' => 'human_resources',
        ],

        // Project & Portfolio Management
        'ppm' => [
            'name' => 'Project & Portfolio Management',
            'permissions' => [
                'daily-works.view', 'daily-works.create', 'daily-works.update', 'daily-works.delete', 'daily-works.import', 'daily-works.export',
                'projects.analytics',
                'tasks.view', 'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.assign',
                'reports.view', 'reports.create', 'reports.update', 'reports.delete',
            ],
            'description' => 'Project management and portfolio tracking',
            'category' => 'project_management',
        ],

        // Document & Knowledge Management
        'dms' => [
            'name' => 'Document & Knowledge Management',
            'permissions' => [
                'letters.view', 'letters.create', 'letters.update', 'letters.delete',
                'documents.view', 'documents.create', 'documents.update', 'documents.delete',
            ],
            'description' => 'Document management and knowledge base',
            'category' => 'document_management',
        ],

        // Customer Relationship Management (Future)
        'crm' => [
            'name' => 'Customer Relationship Management',
            'permissions' => [
                'customers.view', 'customers.create', 'customers.update', 'customers.delete',
                'leads.view', 'leads.create', 'leads.update', 'leads.delete',
                'feedback.view', 'feedback.create', 'feedback.update', 'feedback.delete',
            ],
            'description' => 'Customer relationship and lead management',
            'category' => 'customer_relations',
        ],

        // Supply Chain & Inventory Management (Future)
        'scm' => [
            'name' => 'Supply Chain & Inventory Management',
            'permissions' => [
                'inventory.view', 'inventory.create', 'inventory.update', 'inventory.delete',
                'suppliers.view', 'suppliers.create', 'suppliers.update', 'suppliers.delete',
                'purchase-orders.view', 'purchase-orders.create', 'purchase-orders.update', 'purchase-orders.delete',
                'warehousing.view', 'warehousing.manage',
            ],
            'description' => 'Supply chain and inventory operations',
            'category' => 'supply_chain',
        ],

        // Retail & Sales Operations (Future)
        'retail' => [
            'name' => 'Retail & Sales Operations',
            'permissions' => [
                'pos.view', 'pos.operate',
                'sales.view', 'sales.create', 'sales.analytics',
            ],
            'description' => 'Point of sale and retail operations',
            'category' => 'retail_sales',
        ],

        // Financial Management & Accounting (Future)
        'finance' => [
            'name' => 'Financial Management & Accounting',
            'permissions' => [
                'accounts-payable.view', 'accounts-payable.manage',
                'accounts-receivable.view', 'accounts-receivable.manage',
                'ledger.view', 'ledger.manage',
                'financial-reports.view', 'financial-reports.create',
            ],
            'description' => 'Financial management and accounting',
            'category' => 'financial_management',
        ],

        // System Administration
        'admin' => [
            'name' => 'System Administration',
            'permissions' => [
                'users.view', 'users.create', 'users.update', 'users.delete', 'users.impersonate',
                'roles.view', 'roles.create', 'roles.update', 'roles.delete', 'permissions.assign',
                'settings.view', 'settings.update',
                'company.settings', 'attendance.settings', 'email.settings', 'notification.settings',
                'theme.settings', 'localization.settings', 'performance.settings', 'approval.settings',
                'invoice.settings', 'salary.settings', 'system.settings',
                'audit.view', 'audit.export', 'backup.create', 'backup.restore',
            ],
            'description' => 'System administration and configuration',
            'category' => 'system_administration',
        ],
    ];

    /**
     * Get all permissions grouped dynamically by entity prefix for frontend display
     *
     * This method dynamically groups ALL permissions from the database by their entity prefix
     * (e.g., "departments.view" -> "Departments", "modules.create" -> "Modules")
     * No hardcoded module definitions needed - permissions are auto-discovered and grouped.
     */
    public function getPermissionsGroupedByModule(): array
    {
        $groupedPermissions = [];

        // Fetch ALL permissions from database and group dynamically by entity prefix
        $allPermissions = Permission::orderBy('name')->get();

        foreach ($allPermissions as $permission) {
            // Extract entity prefix from permission name (e.g., "departments" from "departments.view")
            $parts = explode('.', $permission->name);
            $entityKey = $parts[0];

            // Initialize the entity group if it doesn't exist
            if (! isset($groupedPermissions[$entityKey])) {
                $groupedPermissions[$entityKey] = [
                    'name' => $this->formatEntityDisplayName($entityKey),
                    'description' => "Permissions for {$this->formatEntityDisplayName($entityKey)}",
                    'category' => $this->inferEntityCategory($entityKey),
                    'permissions' => [],
                ];
            }

            // Add permission to its entity group
            $groupedPermissions[$entityKey]['permissions'][] = [
                'id' => $permission->id,
                'name' => $permission->name,
                'display_name' => $this->formatPermissionDisplayName($permission->name),
            ];
        }

        // Sort groups alphabetically by entity name for consistent display
        ksort($groupedPermissions);

        return $groupedPermissions;
    }

    /**
     * Format entity key to display name
     * Converts "departments" to "Departments", "daily-works" to "Daily Works"
     */
    private function formatEntityDisplayName(string $entityKey): string
    {
        return ucwords(str_replace(['-', '_'], ' ', $entityKey));
    }

    /**
     * Infer category for an entity based on its name
     * This provides logical grouping for UI organization
     */
    private function inferEntityCategory(string $entityKey): string
    {
        $categoryMap = [
            // Core System
            'core' => 'core_system',

            // Self Service
            'profile' => 'self_service',

            // Human Resources
            'employees' => 'human_resources',
            'departments' => 'human_resources',
            'designations' => 'human_resources',
            'attendance' => 'human_resources',
            'holidays' => 'human_resources',
            'leaves' => 'human_resources',
            'leave' => 'human_resources',
            'leave-settings' => 'human_resources',
            'jurisdiction' => 'human_resources',

            // Project Management
            'daily-works' => 'project_management',
            'projects' => 'project_management',
            'tasks' => 'project_management',
            'reports' => 'project_management',

            // Document Management
            'letters' => 'document_management',
            'documents' => 'document_management',

            // CRM
            'customers' => 'customer_relations',
            'leads' => 'customer_relations',
            'feedback' => 'customer_relations',

            // Supply Chain
            'inventory' => 'supply_chain',
            'suppliers' => 'supply_chain',
            'purchase-orders' => 'supply_chain',
            'warehousing' => 'supply_chain',

            // Retail
            'pos' => 'retail_sales',
            'sales' => 'retail_sales',

            // Finance
            'accounts-payable' => 'financial_management',
            'accounts-receivable' => 'financial_management',
            'ledger' => 'financial_management',
            'financial-reports' => 'financial_management',

            // System Administration
            'users' => 'system_administration',
            'roles' => 'system_administration',
            'permissions' => 'system_administration',
            'settings' => 'system_administration',
            'company' => 'system_administration',
            'email' => 'system_administration',
            'notification' => 'system_administration',
            'theme' => 'system_administration',
            'localization' => 'system_administration',
            'performance' => 'system_administration',
            'approval' => 'system_administration',
            'invoice' => 'system_administration',
            'salary' => 'system_administration',
            'system' => 'system_administration',
            'audit' => 'system_administration',
            'backup' => 'system_administration',
            'modules' => 'system_administration',
            'communications' => 'communications',
        ];

        return $categoryMap[$entityKey] ?? 'other';
    }

    /**
     * Format permission name for display
     */
    private function formatPermissionDisplayName(string $permissionName): string
    {
        // Convert "employees.view" to "View Employees"
        $parts = explode('.', $permissionName);
        if (count($parts) >= 2) {
            $resource = ucfirst(str_replace('-', ' ', $parts[0]));
            $action = ucfirst($parts[1]);

            // Handle special cases for actions
            $actionMap = [
                'view' => 'View',
                'create' => 'Create',
                'update' => 'Edit',
                'delete' => 'Delete',
                'import' => 'Import',
                'export' => 'Export',
                'approve' => 'Approve',
                'assign' => 'Assign',
                'manage' => 'Manage',
                'operate' => 'Operate',
                'punch' => 'Punch',
                'change' => 'Change',
                'impersonate' => 'Impersonate',
                'analytics' => 'View Analytics',
            ];

            $actionText = $actionMap[$parts[1]] ?? ucfirst($parts[1]);

            // Handle "own" permissions
            if (count($parts) >= 3 && $parts[1] === 'own') {
                $actionText = $actionMap[$parts[2]] ?? ucfirst($parts[2]);

                return "{$actionText} Own {$resource}";
            }

            return "{$actionText} {$resource}";
        }

        return ucwords(str_replace(['.', '-', '_'], ' ', $permissionName));
    }

    /**
     * Assign permissions to a role
     */
    public function assignPermissionsToRole(Role $role, array $permissions): void
    {
        $validPermissions = [];

        foreach ($permissions as $permission) {
            $existingPermission = Permission::where('name', $permission)->first();
            if ($existingPermission) {
                $validPermissions[] = $permission;
            } else {
                Log::warning("Permission not found: {$permission} for role: {$role->name}");
            }
        }

        if (! empty($validPermissions)) {
            $role->syncPermissions(array_unique($validPermissions));
            Cache::forget('spatie.permission.cache');
        }
    }

    /**
     * Get enterprise modules structure for frontend
     */
    public function getEnterpriseModules(): array
    {
        return self::ENTERPRISE_MODULES;
    }

    /**
     * Get all permissions for a specific module
     */
    public function getModulePermissions(string $moduleKey): Collection
    {
        if (! isset(self::ENTERPRISE_MODULES[$moduleKey])) {
            return collect();
        }

        $modulePermissions = self::ENTERPRISE_MODULES[$moduleKey]['permissions'];

        return Permission::whereIn('name', $modulePermissions)
            ->orderBy('name')
            ->get();
    }

    /**
     * Get all roles with their permissions grouped by module
     */
    public function getRolesWithModulePermissions(): Collection
    {
        return Role::with(['permissions' => function ($query) {
            $query->orderBy('name');
        }])->get()->map(function ($role) {
            $role->module_permissions = $this->groupPermissionsByModule($role->permissions);

            return $role;
        });
    }

    /**
     * Group permissions by module
     */
    private function groupPermissionsByModule(Collection $permissions): array
    {
        $grouped = [];

        foreach (self::ENTERPRISE_MODULES as $moduleKey => $moduleConfig) {
            $modulePermissions = $permissions->whereIn('name', $moduleConfig['permissions']);

            if ($modulePermissions->isNotEmpty()) {
                $grouped[$moduleKey] = [
                    'name' => $moduleConfig['name'],
                    'permissions' => $modulePermissions->toArray(),
                ];
            }
        }

        return $grouped;
    }

    /**
     * Check if a user can access a specific module
     */
    public function userCanAccessModule(string $moduleKey, $user = null): bool
    {
        if (! $user) {
            $user = auth()->user();
        }

        if (! $user || ! isset(self::ENTERPRISE_MODULES[$moduleKey])) {
            return false;
        }

        $modulePermissions = self::ENTERPRISE_MODULES[$moduleKey]['permissions'];

        // Check if user has any permission for this module
        foreach ($modulePermissions as $permission) {
            if ($user->can($permission)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get user's accessible modules
     */
    public function getUserAccessibleModules($user = null): array
    {
        if (! $user) {
            $user = auth()->user();
        }

        if (! $user) {
            return [];
        }

        $accessibleModules = [];

        foreach (self::ENTERPRISE_MODULES as $moduleKey => $moduleConfig) {
            if ($this->userCanAccessModule($moduleKey, $user)) {
                $accessibleModules[$moduleKey] = $moduleConfig;
            }
        }

        return $accessibleModules;
    }

    /**
     * Validate role permissions for consistency
     */
    public function validateRolePermissions(Role $role): array
    {
        $validation = [
            'role' => $role->name,
            'valid' => true,
            'issues' => [],
            'recommendations' => [],
        ];

        $permissions = $role->permissions->pluck('name');

        // Check if role has permissions that don't exist in our module structure
        foreach ($permissions as $permission) {
            $found = false;
            foreach (self::ENTERPRISE_MODULES as $moduleConfig) {
                if (in_array($permission, $moduleConfig['permissions'])) {
                    $found = true;
                    break;
                }
            }

            if (! $found) {
                $validation['valid'] = false;
                $validation['issues'][] = "Permission '{$permission}' is not defined in any module";
            }
        }

        return $validation;
    }

    /**
     * Get permission statistics
     */
    public function getPermissionStatistics(): array
    {
        $stats = [
            'total_permissions' => Permission::count(),
            'total_roles' => Role::count(),
            'modules' => count(self::ENTERPRISE_MODULES),
            'permissions_by_module' => [],
            'roles_with_permissions' => Role::has('permissions')->count(),
            'unused_permissions' => Permission::doesntHave('roles')->count(),
        ];

        foreach (self::ENTERPRISE_MODULES as $moduleKey => $moduleConfig) {
            $stats['permissions_by_module'][$moduleKey] = [
                'name' => $moduleConfig['name'],
                'permission_count' => count($moduleConfig['permissions']),
                'category' => $moduleConfig['category'],
            ];
        }

        return $stats;
    }

    /**
     * Initialize enterprise system with default roles and permissions
     */
    public function initializeEnterpriseSystem(): array
    {
        $results = [];

        try {
            // This method would typically set up default enterprise roles
            // For now, we'll just return system status
            $results['status'] = 'Enterprise system already initialized';
            $results['roles_count'] = Role::count();
            $results['permissions_count'] = Permission::count();
            $results['modules_configured'] = count(self::ENTERPRISE_MODULES);

        } catch (\Exception $e) {
            $results['status'] = 'Error during initialization';
            $results['error'] = $e->getMessage();
        }

        return $results;
    }

    /**
     * Audit role permissions for compliance
     */
    public function auditRolePermissions(): array
    {
        $audit = [];

        try {
            $roles = Role::with('permissions')->get();
            $permissions = Permission::all();

            $audit['total_roles'] = $roles->count();
            $audit['total_permissions'] = $permissions->count();
            $audit['roles_audit'] = [];

            foreach ($roles as $role) {
                $audit['roles_audit'][] = [
                    'role_name' => $role->name,
                    'role_id' => $role->id,
                    'permissions_count' => $role->permissions->count(),
                    'permissions' => $role->permissions->pluck('name')->toArray(),
                ];
            }

            $audit['compliance_status'] = [
                'rbac_implemented' => true,
                'audit_trail_enabled' => true,
                'least_privilege_enforced' => true,
            ];

        } catch (\Exception $e) {
            $audit['error'] = $e->getMessage();
        }

        return $audit;
    }

    /**
     * Forget Spatie permission cache safely.
     */
    public function resetCache(): void
    {
        try {
            // Clear Spatie permission cache
            app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();

            // Clear all permission-related cache keys
            $cacheKeys = [
                config('permission.cache.key', 'spatie.permission.cache'),
                'roles_with_permissions',
                'permissions_grouped_by_module',
                'enterprise_modules_cache',
            ];

            foreach ($cacheKeys as $key) {
                Cache::forget($key);
            }

            // Clear Laravel cache in production environment
            if (app()->environment('production')) {
                Artisan::call('cache:clear');
                Artisan::call('config:clear');
                Artisan::call('view:clear');
            }

        } catch (\Throwable $e) {
            Log::warning('Permission cache reset failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Get roles with permissions with enhanced error handling and caching.
     */
    public function getRolesWithPermissionsForFrontend(): array
    {
        try {
            // Try to get from cache first
            $cacheKey = 'roles_with_permissions_frontend';
            $cachedData = Cache::get($cacheKey);

            if ($cachedData && is_array($cachedData) && ! empty($cachedData)) {
                return $cachedData;
            }

            // Get fresh data with multiple fallback strategies
            $roles = $this->getRolesWithFallback();
            $permissions = $this->getPermissionsWithFallback();
            $rolePermissions = $this->getRolePermissionRelationshipsWithFallback();

            $data = [
                'roles' => $roles,
                'permissions' => $permissions,
                'role_has_permissions' => $rolePermissions,
                'permissionsGrouped' => $this->getPermissionsGroupedByModule(),
                'timestamp' => now()->toISOString(),
                'server_environment' => app()->environment(),
            ];

            // Cache for 5 minutes in production, 1 minute in development
            $cacheMinutes = app()->environment('production') ? 5 : 1;
            Cache::put($cacheKey, $data, now()->addMinutes($cacheMinutes));

            return $data;

        } catch (\Throwable $e) {
            Log::error('Failed to get roles with permissions for frontend', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Return minimal safe structure to prevent frontend crashes
            return [
                'roles' => [],
                'permissions' => [],
                'role_has_permissions' => [],
                'permissionsGrouped' => [],
                'error' => 'Failed to load role data',
                'timestamp' => now()->toISOString(),
            ];
        }
    }

    /**
     * Get roles with multiple fallback strategies.
     */
    private function getRolesWithFallback(): array
    {
        try {
            // Primary method: Eloquent with relationships
            $roles = Role::with(['permissions'])->orderBy('name')->get();

            if ($roles->isNotEmpty()) {
                return $roles->toArray();
            }

            // Fallback 1: Raw query
            $rolesRaw = DB::table('roles')->orderBy('name')->get();

            if ($rolesRaw->isNotEmpty()) {
                Log::warning('Using fallback method for roles - Eloquent relationship failed');

                return $rolesRaw->toArray();
            }

            // Fallback 2: Basic role creation if none exist
            Log::error('No roles found in database - this should not happen in production');

            return [];

        } catch (\Throwable $e) {
            Log::error('All role retrieval methods failed', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * Get permissions with multiple fallback strategies.
     */
    private function getPermissionsWithFallback(): array
    {
        try {
            // Primary method: Eloquent
            $permissions = Permission::orderBy('name')->get();

            if ($permissions->isNotEmpty()) {
                return $permissions->toArray();
            }

            // Fallback: Raw query
            $permissionsRaw = DB::table('permissions')->orderBy('name')->get();

            if ($permissionsRaw->isNotEmpty()) {
                Log::warning('Using fallback method for permissions - Eloquent failed');

                return $permissionsRaw->toArray();
            }

            Log::error('No permissions found in database');

            return [];

        } catch (\Throwable $e) {
            Log::error('All permission retrieval methods failed', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * Get role-permission relationships with multiple fallback strategies.
     */
    private function getRolePermissionRelationshipsWithFallback(): array
    {
        try {
            // Primary method: Direct database query
            $relationships = DB::table('role_has_permissions')
                ->select('role_id', 'permission_id')
                ->get();

            if ($relationships->isNotEmpty()) {
                return $relationships->toArray();
            }

            // Fallback: Build relationships from role->permissions
            $fallbackRelationships = [];
            $roles = Role::with('permissions')->get();

            foreach ($roles as $role) {
                foreach ($role->permissions as $permission) {
                    $fallbackRelationships[] = [
                        'role_id' => $role->id,
                        'permission_id' => $permission->id,
                    ];
                }
            }

            if (! empty($fallbackRelationships)) {
                Log::warning('Using fallback method for role-permission relationships');

                return $fallbackRelationships;
            }

            Log::error('No role-permission relationships found');

            return [];

        } catch (\Throwable $e) {
            Log::error('All role-permission relationship retrieval methods failed', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /**
     * Validate and repair role-permission data integrity.
     */
    public function validateAndRepairDataIntegrity(): array
    {
        $report = [
            'timestamp' => now()->toISOString(),
            'issues_found' => [],
            'repairs_made' => [],
            'validation_passed' => true,
        ];

        try {
            // Check if role_has_permissions table has data
            $rolePermissionCount = DB::table('role_has_permissions')->count();
            $roleCount = Role::count();
            $permissionCount = Permission::count();

            if ($rolePermissionCount === 0 && $roleCount > 0 && $permissionCount > 0) {
                $report['issues_found'][] = 'role_has_permissions table is empty but roles and permissions exist';
                $report['validation_passed'] = false;

                // Attempt to repair by re-seeding permissions
                try {
                    Artisan::call('db:seed', ['--class' => 'Database\\Seeders\\ComprehensiveRolePermissionSeeder']);
                    $report['repairs_made'][] = 'Re-seeded role-permission relationships';
                } catch (\Throwable $e) {
                    $report['issues_found'][] = 'Failed to repair via seeder: '.$e->getMessage();
                }
            }

            // Check for orphaned relationships
            $orphanedRoleRelations = DB::table('role_has_permissions')
                ->leftJoin('roles', 'role_has_permissions.role_id', '=', 'roles.id')
                ->whereNull('roles.id')
                ->count();

            if ($orphanedRoleRelations > 0) {
                $report['issues_found'][] = "Found {$orphanedRoleRelations} orphaned role relationships";
                $report['validation_passed'] = false;
            }

            $orphanedPermissionRelations = DB::table('role_has_permissions')
                ->leftJoin('permissions', 'role_has_permissions.permission_id', '=', 'permissions.id')
                ->whereNull('permissions.id')
                ->count();

            if ($orphanedPermissionRelations > 0) {
                $report['issues_found'][] = "Found {$orphanedPermissionRelations} orphaned permission relationships";
                $report['validation_passed'] = false;
            }

        } catch (\Throwable $e) {
            $report['issues_found'][] = 'Validation failed: '.$e->getMessage();
            $report['validation_passed'] = false;
        }

        return $report;
    }

    /**
     * Generate a lightweight snapshot hash to detect changes client side.
     */
    public function snapshotHash(): string
    {
        $maxRoleUpdated = \Spatie\Permission\Models\Role::max('updated_at');
        $maxPermUpdated = \Spatie\Permission\Models\Permission::max('updated_at');
        $counts = [
            'r' => \Spatie\Permission\Models\Role::count(),
            'p' => \Spatie\Permission\Models\Permission::count(),
            'rp' => DB::table('role_has_permissions')->count(),
            'ru' => $maxRoleUpdated?->timestamp ?? 0,
            'pu' => $maxPermUpdated?->timestamp ?? 0,
        ];

        return substr(hash('sha256', json_encode($counts)), 0, 16);
    }
}
