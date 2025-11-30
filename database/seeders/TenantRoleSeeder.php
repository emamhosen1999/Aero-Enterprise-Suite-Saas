<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Tenant Role Seeder
 *
 * Seeds default roles and permissions for tenant application.
 * This seeder should be run when a new tenant is provisioned.
 *
 * Follows ISO 27001/27002 compliant role-based access control.
 */
class TenantRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $guard = config('auth.defaults.guard', 'web');

        // Create permissions first
        $this->seedPermissions($guard);

        // Create roles and assign permissions
        $this->seedRoles($guard);

        if ($this->command) {
            $this->command->info('✅ Tenant roles and permissions seeded successfully.');
        }
    }

    /**
     * Seed tenant-level permissions grouped by module.
     *
     * @return array<string, array<string, string>>
     */
    protected function permissionGroups(): array
    {
        return [
            // Core / Self-Service
            'core' => [
                'dashboard.view' => 'Access the main dashboard',
                'profile.view' => 'View own profile',
                'profile.update' => 'Update own profile',
                'notifications.view' => 'View notifications',
            ],

            // User & Team Management
            'users' => [
                'view' => 'View team members',
                'create' => 'Create new team members',
                'update' => 'Update team member details',
                'delete' => 'Remove team members',
                'invite' => 'Send team invitations',
                'assign-roles' => 'Assign roles to team members',
            ],

            // HRM Module
            'employees' => [
                'view' => 'View employee records',
                'create' => 'Create employee records',
                'update' => 'Update employee records',
                'delete' => 'Delete employee records',
                'import' => 'Import employee data',
                'export' => 'Export employee data',
            ],
            'attendance' => [
                'view' => 'View attendance records',
                'manage' => 'Manage attendance records',
                'own.view' => 'View own attendance',
                'own.punch' => 'Record own attendance punch',
            ],
            'leave' => [
                'view' => 'View all leave requests',
                'manage' => 'Manage leave requests',
                'approve' => 'Approve or reject leave requests',
                'own.view' => 'View own leave requests',
                'own.create' => 'Submit own leave requests',
            ],
            'departments' => [
                'view' => 'View departments',
                'create' => 'Create departments',
                'update' => 'Update departments',
                'delete' => 'Delete departments',
            ],
            'payroll' => [
                'view' => 'View payroll information',
                'manage' => 'Manage payroll processing',
                'own.view' => 'View own payroll/salary',
            ],

            // CRM Module
            'contacts' => [
                'view' => 'View contacts',
                'create' => 'Create contacts',
                'update' => 'Update contacts',
                'delete' => 'Delete contacts',
                'import' => 'Import contacts',
                'export' => 'Export contacts',
            ],
            'leads' => [
                'view' => 'View leads',
                'create' => 'Create leads',
                'update' => 'Update leads',
                'delete' => 'Delete leads',
                'convert' => 'Convert leads to contacts',
            ],
            'deals' => [
                'view' => 'View deals/opportunities',
                'create' => 'Create deals',
                'update' => 'Update deals',
                'delete' => 'Delete deals',
            ],
            'interactions' => [
                'view' => 'View customer interactions',
                'create' => 'Log customer interactions',
                'update' => 'Update interactions',
                'delete' => 'Delete interactions',
            ],

            // Settings & Administration
            'settings' => [
                'view' => 'View organization settings',
                'update' => 'Update organization settings',
            ],
            'roles' => [
                'view' => 'View roles and permissions',
                'manage' => 'Manage roles and permissions',
            ],
            'audit' => [
                'logs.view' => 'View audit logs',
            ],
        ];
    }

    /**
     * Seed all permissions from permission groups.
     */
    protected function seedPermissions(string $guard): void
    {
        foreach ($this->permissionGroups() as $namespace => $actions) {
            foreach ($actions as $action => $description) {
                $permission = sprintf('%s.%s', $namespace, $action);

                Permission::firstOrCreate([
                    'name' => $permission,
                    'guard_name' => $guard,
                ], [
                    'description' => $description,
                ]);
            }
        }
    }

    /**
     * Define tenant roles with their permission assignments.
     *
     * @return array<string, array{name: string, description: string, permissions: array<string>}>
     */
    protected function roleDefinitions(): array
    {
        return [
            'admin' => [
                'name' => 'Admin',
                'description' => 'Full access to all tenant features and settings',
                'permissions' => ['*'], // Will receive all permissions
            ],
            'hr-manager' => [
                'name' => 'HR Manager',
                'description' => 'Manages HR operations, employees, attendance, and leave',
                'permissions' => [
                    // Core access
                    'core.dashboard.view', 'core.profile.view', 'core.profile.update', 'core.notifications.view',
                    // User management (limited)
                    'users.view',
                    // Full HRM access
                    'employees.view', 'employees.create', 'employees.update', 'employees.delete',
                    'employees.import', 'employees.export',
                    'attendance.view', 'attendance.manage', 'attendance.own.view', 'attendance.own.punch',
                    'leave.view', 'leave.manage', 'leave.approve', 'leave.own.view', 'leave.own.create',
                    'departments.view', 'departments.create', 'departments.update', 'departments.delete',
                    'payroll.view', 'payroll.manage', 'payroll.own.view',
                ],
            ],
            'crm-agent' => [
                'name' => 'CRM Agent',
                'description' => 'Manages customer relationships, leads, and deals',
                'permissions' => [
                    // Core access
                    'core.dashboard.view', 'core.profile.view', 'core.profile.update', 'core.notifications.view',
                    // Self-service HRM
                    'attendance.own.view', 'attendance.own.punch',
                    'leave.own.view', 'leave.own.create',
                    'payroll.own.view',
                    // Full CRM access
                    'contacts.view', 'contacts.create', 'contacts.update', 'contacts.delete',
                    'contacts.import', 'contacts.export',
                    'leads.view', 'leads.create', 'leads.update', 'leads.delete', 'leads.convert',
                    'deals.view', 'deals.create', 'deals.update', 'deals.delete',
                    'interactions.view', 'interactions.create', 'interactions.update', 'interactions.delete',
                ],
            ],
            'employee' => [
                'name' => 'Employee',
                'description' => 'Basic employee access with self-service capabilities',
                'permissions' => [
                    // Core access
                    'core.dashboard.view', 'core.profile.view', 'core.profile.update', 'core.notifications.view',
                    // Self-service only
                    'attendance.own.view', 'attendance.own.punch',
                    'leave.own.view', 'leave.own.create',
                    'payroll.own.view',
                ],
            ],
        ];
    }

    /**
     * Seed roles and assign their permissions.
     */
    protected function seedRoles(string $guard): void
    {
        $allPermissions = Permission::where('guard_name', $guard)->pluck('name')->toArray();

        foreach ($this->roleDefinitions() as $key => $roleData) {
            $role = Role::firstOrCreate([
                'name' => $roleData['name'],
                'guard_name' => $guard,
            ], [
                'description' => $roleData['description'],
            ]);

            // Assign permissions
            if ($roleData['permissions'] === ['*']) {
                // Admin gets all permissions
                $role->syncPermissions($allPermissions);
            } else {
                // Filter only existing permissions to avoid errors
                $validPermissions = array_intersect($roleData['permissions'], $allPermissions);
                $role->syncPermissions($validPermissions);
            }
        }
    }
}
