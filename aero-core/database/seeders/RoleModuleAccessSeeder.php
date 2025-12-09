<?php

namespace Aero\Core\Database\Seeders;

use Aero\Core\Models\Module;
use Aero\Core\Models\ModuleComponent;
use Aero\Core\Models\ModuleComponentAction;
use Aero\Core\Models\Role;
use Aero\Core\Models\RoleModuleAccess;
use Aero\Core\Models\SubModule;
use Illuminate\Database\Seeder;

/**
 * Role Module Access Seeder
 *
 * Seeds default module access for predefined roles.
 * Assigns appropriate access levels based on role type.
 */
class RoleModuleAccessSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define role configurations
        $roleConfigs = [
            'super-admin' => [
                'name' => 'Super Administrator',
                'description' => 'Full system access',
                'is_protected' => true,
                'access_level' => 'all', // Full access to all modules
            ],
            'admin' => [
                'name' => 'Administrator',
                'description' => 'System administrator with most privileges',
                'is_protected' => true,
                'access_level' => 'most', // Access to most modules
            ],
            'manager' => [
                'name' => 'Manager',
                'description' => 'Department manager with team oversight',
                'is_protected' => false,
                'access_level' => 'department', // Limited to department scope
            ],
            'user' => [
                'name' => 'User',
                'description' => 'Standard user with basic access',
                'is_protected' => false,
                'access_level' => 'basic', // Basic modules only
            ],
        ];

        foreach ($roleConfigs as $code => $config) {
            $role = $this->createRole($code, $config);
            $this->assignModuleAccess($role, $config['access_level']);
        }

        $this->command?->info("✅ Role module access seeded for " . count($roleConfigs) . " roles");
    }

    /**
     * Create or update a role.
     */
    protected function createRole(string $code, array $config): Role
    {
        return Role::firstOrCreate(
            ['name' => $code, 'guard_name' => 'web']
        );
    }

    /**
     * Assign module access to a role.
     */
    protected function assignModuleAccess(Role $role, string $accessLevel): void
    {
        // Clear existing access
        RoleModuleAccess::where('role_id', $role->id)->delete();

        switch ($accessLevel) {
            case 'all':
                $this->grantFullAccess($role);
                break;
            
            case 'most':
                $this->grantAdminAccess($role);
                break;
            
            case 'department':
                $this->grantManagerAccess($role);
                break;
            
            case 'basic':
                $this->grantUserAccess($role);
                break;
        }
    }

    /**
     * Grant full access to all modules (Super Admin).
     */
    protected function grantFullAccess(Role $role): void
    {
        $modules = Module::where('is_active', true)->get();

        foreach ($modules as $module) {
            RoleModuleAccess::create([
                'role_id' => $role->id,
                'module_id' => $module->id,
                'access_scope' => 'all',
            ]);
        }
    }

    /**
     * Grant admin access (all core modules).
     */
    protected function grantAdminAccess(Role $role): void
    {
        // Grant full access to core modules
        $coreModules = Module::where('is_core', true)
            ->where('is_active', true)
            ->get();

        foreach ($coreModules as $module) {
            RoleModuleAccess::create([
                'role_id' => $role->id,
                'module_id' => $module->id,
                'access_scope' => 'all',
            ]);
        }
    }

    /**
     * Grant manager access (department scope).
     */
    protected function grantManagerAccess(Role $role): void
    {
        // User management with department scope
        $this->grantModuleAccess($role, 'user_management', 'department');
        
        // Dashboard
        $this->grantModuleAccess($role, 'dashboard', 'all');
        
        // Roles (view only)
        $this->grantSubModuleAccess($role, 'roles_permissions', 'roles', ['view']);
    }

    /**
     * Grant basic user access.
     */
    protected function grantUserAccess(Role $role): void
    {
        // Dashboard (view only)
        $this->grantModuleAccess($role, 'dashboard', 'own');
        
        // User profile (own only)
        $this->grantSubModuleAccess($role, 'user_management', 'users', ['view', 'edit'], 'own', ['user_profile']);
        
        // Settings (view own)
        $this->grantModuleAccess($role, 'settings', 'own');
    }

    /**
     * Grant access to a module.
     */
    protected function grantModuleAccess(Role $role, string $moduleCode, string $scope = 'all'): void
    {
        $module = Module::where('code', $moduleCode)->first();
        
        if ($module) {
            RoleModuleAccess::create([
                'role_id' => $role->id,
                'module_id' => $module->id,
                'access_scope' => $scope,
            ]);
        }
    }

    /**
     * Grant access to a submodule with specific actions.
     */
    protected function grantSubModuleAccess(
        Role $role, 
        string $moduleCode, 
        string $subModuleCode, 
        array $actions = [], 
        string $scope = 'all',
        array $componentCodes = []
    ): void {
        $module = Module::where('code', $moduleCode)->first();
        if (!$module) return;

        $subModule = SubModule::where('module_id', $module->id)
            ->where('code', $subModuleCode)
            ->first();
        if (!$subModule) return;

        if (empty($actions)) {
            // Grant full submodule access
            RoleModuleAccess::create([
                'role_id' => $role->id,
                'module_id' => $module->id,
                'sub_module_id' => $subModule->id,
                'access_scope' => $scope,
            ]);
            return;
        }

        // Grant specific action access
        $components = ModuleComponent::where('sub_module_id', $subModule->id);
        
        if (!empty($componentCodes)) {
            $components->whereIn('code', $componentCodes);
        }
        
        $components = $components->get();

        foreach ($components as $component) {
            $componentActions = ModuleComponentAction::where('module_component_id', $component->id)
                ->whereIn('code', $actions)
                ->get();

            foreach ($componentActions as $action) {
                RoleModuleAccess::create([
                    'role_id' => $role->id,
                    'module_id' => $module->id,
                    'sub_module_id' => $subModule->id,
                    'component_id' => $component->id,
                    'action_id' => $action->id,
                    'access_scope' => $scope,
                ]);
            }
        }
    }
}
