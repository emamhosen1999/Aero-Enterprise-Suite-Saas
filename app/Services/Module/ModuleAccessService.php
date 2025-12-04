<?php

namespace App\Services\Module;

use App\Models\Module;
use App\Models\ModuleComponent;
use App\Models\ModuleComponentAction;
use App\Models\ModulePermission;
use App\Models\SubModule;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

/**
 * Module Access Service
 *
 * Handles checking user access to modules based on:
 * 1. Super Admin Bypass - Platform/Tenant Super Admins have special access
 * 2. Plan Access - Is the module/submodule/component/action in the tenant's subscription plan?
 * 3. Permission Match - Does the user have the required permissions?
 *
 * Access Formula: User Access = Super Admin Bypass OR (Plan Access ∩ Permission Match)
 *
 * Compliance: Section 7 - Access Control Logic
 */
class ModuleAccessService
{
    /**
     * Check if user is platform super administrator.
     */
    protected function isPlatformSuperAdmin(User $user): bool
    {
        return $user->hasRole('Super Administrator');
    }

    /**
     * Check if user is tenant super administrator.
     */
    protected function isTenantSuperAdmin(User $user): bool
    {
        return $user->hasRole('tenant_super_administrator');
    }

    /**
     * Check if user can access a module.
     *
     * @return array{allowed: bool, reason: string, message: string}
     */
    public function canAccessModule(User $user, string $moduleCode): array
    {
        // EXCEPTION: Super Administrator bypasses everything
        if ($this->isPlatformSuperAdmin($user)) {
            return ['allowed' => true, 'reason' => 'platform_super_admin', 'message' => 'Platform Super Admin access.'];
        }

        // Step 1: Check plan access
        if (! $this->isPlanAllowed($user, 'module', $moduleCode)) {
            return [
                'allowed' => false,
                'reason' => 'plan_restriction',
                'message' => "Module '{$moduleCode}' is not included in your subscription plan.",
            ];
        }

        // Step 2: Check permissions
        $module = Module::where('code', $moduleCode)->first();
        if (! $module) {
            return [
                'allowed' => false,
                'reason' => 'not_found',
                'message' => "Module '{$moduleCode}' does not exist.",
            ];
        }

        // EXCEPTION: tenant_super_administrator bypasses permission checks (but NOT subscription)
        if ($this->isTenantSuperAdmin($user)) {
            return ['allowed' => true, 'reason' => 'tenant_super_admin', 'message' => 'Tenant Super Admin access.'];
        }

        // Get required permissions for this module
        $requiredPermissions = ModulePermission::where('module_id', $module->id)
            ->whereNull('sub_module_id')
            ->whereNull('component_id')
            ->whereNull('module_component_action_id')
            ->where('is_required', true)
            ->with('permission')
            ->get()
            ->pluck('permission.name')
            ->filter()
            ->toArray();

        // If no required permissions, allow access
        if (empty($requiredPermissions)) {
            return ['allowed' => true, 'reason' => 'success', 'message' => 'Access granted.'];
        }

        // Check if user has ANY of the required permissions (OR logic within level)
        $hasPermission = $user->hasAnyPermission($requiredPermissions);

        if (! $hasPermission) {
            return [
                'allowed' => false,
                'reason' => 'insufficient_permissions',
                'message' => "You don't have the required permissions to access this module.",
            ];
        }

        return ['allowed' => true, 'reason' => 'success', 'message' => 'Access granted.'];
    }

    /**
     * Check if user can access a submodule.
     *
     * @return array{allowed: bool, reason: string, message: string}
     */
    public function canAccessSubModule(User $user, string $moduleCode, string $subModuleCode): array
    {
        // EXCEPTION: Super Administrator bypasses everything
        if ($this->isPlatformSuperAdmin($user)) {
            return ['allowed' => true, 'reason' => 'platform_super_admin', 'message' => 'Platform Super Admin access.'];
        }

        // First check module access
        $moduleCheck = $this->canAccessModule($user, $moduleCode);
        if (! $moduleCheck['allowed']) {
            return $moduleCheck;
        }

        // Check plan access for submodule
        if (! $this->isPlanAllowed($user, 'submodule', $moduleCode, $subModuleCode)) {
            return [
                'allowed' => false,
                'reason' => 'plan_restriction',
                'message' => "Feature '{$subModuleCode}' is not included in your subscription plan.",
            ];
        }

        // EXCEPTION: tenant_super_administrator bypasses permission checks (but NOT subscription)
        if ($this->isTenantSuperAdmin($user)) {
            return ['allowed' => true, 'reason' => 'tenant_super_admin', 'message' => 'Tenant Super Admin access.'];
        }

        // Check submodule permissions
        $subModule = SubModule::whereHas('module', fn ($q) => $q->where('code', $moduleCode))
            ->where('code', $subModuleCode)
            ->first();

        if (! $subModule) {
            return [
                'allowed' => false,
                'reason' => 'not_found',
                'message' => "Feature '{$subModuleCode}' does not exist.",
            ];
        }

        // Get required permissions for this submodule
        $requiredPermissions = ModulePermission::where('sub_module_id', $subModule->id)
            ->whereNull('component_id')
            ->whereNull('module_component_action_id')
            ->where('is_required', true)
            ->with('permission')
            ->get()
            ->pluck('permission.name')
            ->filter()
            ->toArray();

        if (empty($requiredPermissions)) {
            return ['allowed' => true, 'reason' => 'success', 'message' => 'Access granted.'];
        }

        $hasPermission = $user->hasAnyPermission($requiredPermissions);

        if (! $hasPermission) {
            return [
                'allowed' => false,
                'reason' => 'insufficient_permissions',
                'message' => "You don't have the required permissions to access this feature.",
            ];
        }

        return ['allowed' => true, 'reason' => 'success', 'message' => 'Access granted.'];
    }

    /**
     * Check if user can access a component.
     *
     * @return array{allowed: bool, reason: string, message: string}
     */
    public function canAccessComponent(User $user, string $moduleCode, string $subModuleCode, string $componentCode): array
    {
        // EXCEPTION: Super Administrator bypasses everything
        if ($this->isPlatformSuperAdmin($user)) {
            return ['allowed' => true, 'reason' => 'platform_super_admin', 'message' => 'Platform Super Admin access.'];
        }

        // First check submodule access
        $subModuleCheck = $this->canAccessSubModule($user, $moduleCode, $subModuleCode);
        if (! $subModuleCheck['allowed']) {
            return $subModuleCheck;
        }

        // Check plan access for component
        if (! $this->isPlanAllowed($user, 'component', $moduleCode, $subModuleCode, $componentCode)) {
            return [
                'allowed' => false,
                'reason' => 'plan_restriction',
                'message' => 'This component is not included in your subscription plan.',
            ];
        }

        // EXCEPTION: tenant_super_administrator bypasses permission checks (but NOT subscription)
        if ($this->isTenantSuperAdmin($user)) {
            return ['allowed' => true, 'reason' => 'tenant_super_admin', 'message' => 'Tenant Super Admin access.'];
        }

        // Check component permissions
        $component = ModuleComponent::whereHas('subModule', function ($q) use ($moduleCode, $subModuleCode) {
            $q->whereHas('module', fn ($mq) => $mq->where('code', $moduleCode))
                ->where('code', $subModuleCode);
        })
            ->where('code', $componentCode)
            ->first();

        if (! $component) {
            return [
                'allowed' => false,
                'reason' => 'not_found',
                'message' => "Component '{$componentCode}' does not exist.",
            ];
        }

        // Get required permissions for this component
        $requiredPermissions = ModulePermission::where('component_id', $component->id)
            ->whereNull('module_component_action_id')
            ->where('is_required', true)
            ->with('permission')
            ->get()
            ->pluck('permission.name')
            ->filter()
            ->toArray();

        if (empty($requiredPermissions)) {
            return ['allowed' => true, 'reason' => 'success', 'message' => 'Access granted.'];
        }

        $hasPermission = $user->hasAnyPermission($requiredPermissions);

        if (! $hasPermission) {
            return [
                'allowed' => false,
                'reason' => 'insufficient_permissions',
                'message' => "You don't have the required permissions to access this component.",
            ];
        }

        return ['allowed' => true, 'reason' => 'success', 'message' => 'Access granted.'];
    }

    /**
     * Check if user can perform an action.
     *
     * @return array{allowed: bool, reason: string, message: string}
     */
    public function canPerformAction(
        User $user,
        string $moduleCode,
        string $subModuleCode,
        string $componentCode,
        string $actionCode
    ): array {
        // EXCEPTION: Super Administrator bypasses everything
        if ($this->isPlatformSuperAdmin($user)) {
            return ['allowed' => true, 'reason' => 'platform_super_admin', 'message' => 'Platform Super Admin access.'];
        }

        // First check component access
        $componentCheck = $this->canAccessComponent($user, $moduleCode, $subModuleCode, $componentCode);
        if (! $componentCheck['allowed']) {
            return $componentCheck;
        }

        // Get the action
        $action = ModuleComponentAction::whereHas('component', function ($q) use ($moduleCode, $subModuleCode, $componentCode) {
            $q->whereHas('subModule', function ($sq) use ($moduleCode, $subModuleCode) {
                $sq->whereHas('module', fn ($mq) => $mq->where('code', $moduleCode))
                    ->where('code', $subModuleCode);
            })
                ->where('code', $componentCode);
        })
            ->where('code', $actionCode)
            ->first();

        if (! $action) {
            return [
                'allowed' => false,
                'reason' => 'not_found',
                'message' => "Action '{$actionCode}' does not exist.",
            ];
        }

        // EXCEPTION: tenant_super_administrator bypasses permission checks
        if ($this->isTenantSuperAdmin($user)) {
            return ['allowed' => true, 'reason' => 'tenant_super_admin', 'message' => 'Tenant Super Admin access.'];
        }

        // Get required permissions for this action
        $requiredPermissions = ModulePermission::where('module_component_action_id', $action->id)
            ->where('is_required', true)
            ->with('permission')
            ->get()
            ->pluck('permission.name')
            ->filter()
            ->toArray();

        if (empty($requiredPermissions)) {
            return ['allowed' => true, 'reason' => 'success', 'message' => 'Access granted.'];
        }

        $hasPermission = $user->hasAnyPermission($requiredPermissions);

        if (! $hasPermission) {
            return [
                'allowed' => false,
                'reason' => 'insufficient_permissions',
                'message' => "You don't have the required permissions to perform this action.",
            ];
        }

        return ['allowed' => true, 'reason' => 'success', 'message' => 'Access granted.'];
    }

    /**
     * Check if the tenant's plan allows access to a specific item.
     *
     * @param  string  $type  Type: module, submodule, component, action
     */
    protected function isPlanAllowed(
        User $user,
        string $type,
        string $moduleCode,
        ?string $subModuleCode = null,
        ?string $componentCode = null
    ): bool {
        // Get tenant's active modules from subscription
        $cacheKey = "tenant_modules_access:{$user->tenant_id}";

        $activeModuleCodes = Cache::remember($cacheKey, 300, function () use ($user) {
            if (! $user->tenant_id) {
                return [];
            }

            $tenant = \App\Models\Tenant::find($user->tenant_id);
            if (! $tenant) {
                return [];
            }

            $subscription = $tenant->currentSubscription;
            if (! $subscription || ! $subscription->plan) {
                // No subscription - only core modules
                return Module::where('is_core', true)
                    ->where('is_active', true)
                    ->pluck('code')
                    ->toArray();
            }

            // Get modules from subscription plan
            return $subscription->plan
                ->modules()
                ->where('is_active', true)
                ->pluck('modules.code')
                ->toArray();
        });

        // Check if module is allowed
        if (! in_array($moduleCode, $activeModuleCodes)) {
            return false;
        }

        // For now, if module is allowed, all its children are allowed
        // In the future, plan_module pivot can include submodule/component restrictions
        return true;
    }

    /**
     * Get all accessible modules for a user (respecting both plan and permissions).
     */
    public function getAccessibleModules(User $user): array
    {
        $cacheKey = "user_accessible_modules:{$user->id}";

        return Cache::remember($cacheKey, 300, function () use ($user) {
            $modules = Module::active()->ordered()->get();
            $accessible = [];

            foreach ($modules as $module) {
                $check = $this->canAccessModule($user, $module->code);
                if ($check['allowed']) {
                    $accessible[] = [
                        'id' => $module->id,
                        'code' => $module->code,
                        'name' => $module->name,
                        'icon' => $module->icon,
                        'route_prefix' => $module->route_prefix,
                    ];
                }
            }

            return $accessible;
        });
    }

    /**
     * Clear user access cache.
     */
    public function clearUserCache(User $user): void
    {
        Cache::forget("user_accessible_modules:{$user->id}");
        Cache::forget("tenant_modules_access:{$user->tenant_id}");
    }
}
