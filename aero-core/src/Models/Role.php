<?php

namespace Aero\Core\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Custom Role model extending Spatie's Role
 *
 * Adds the moduleAccess relationship for the Role-Module Access system.
 * 
 * @property int $id
 * @property string $name
 * @property string $guard_name
 * @property string|null $display_name
 * @property string|null $description
 * @property bool $is_protected
 * @property string $scope
 */
class Role extends SpatieRole
{
    protected $fillable = [
        'name',
        'guard_name',
        'display_name',
        'description',
        'is_protected',
        'scope',
    ];

    protected $casts = [
        'is_protected' => 'boolean',
    ];

    /**
     * Get all module access entries for this role.
     */
    public function moduleAccess(): HasMany
    {
        return $this->hasMany(RoleModuleAccess::class, 'role_id');
    }

    /**
     * Check if role has full access (is protected/super admin)
     */
    public function hasFullAccess(): bool
    {
        return $this->is_protected ?? false;
    }

    /**
     * Get accessible module IDs for this role
     */
    public function getAccessibleModuleIds(): array
    {
        return $this->moduleAccess()
            ->whereNotNull('module_id')
            ->whereNull('sub_module_id')
            ->pluck('module_id')
            ->unique()
            ->toArray();
    }

    /**
     * Get accessible modules with their hierarchy
     */
    public function getAccessibleModules(): Collection
    {
        if ($this->hasFullAccess()) {
            return Module::where('is_active', true)->get();
        }

        $moduleIds = $this->getAccessibleModuleIds();
        return Module::whereIn('id', $moduleIds)
            ->where('is_active', true)
            ->orderBy('priority')
            ->get();
    }

    /**
     * Check if role has access to a specific module
     */
    public function hasModuleAccess(string $moduleCode): bool
    {
        if ($this->hasFullAccess()) {
            return true;
        }

        $module = Module::where('code', $moduleCode)->first();
        if (!$module) {
            return false;
        }

        return $this->moduleAccess()
            ->where('module_id', $module->id)
            ->exists();
    }

    /**
     * Check if role has access to a specific action
     */
    public function hasActionAccess(string $moduleCode, string $subModuleCode, string $componentCode, string $actionCode): bool
    {
        if ($this->hasFullAccess()) {
            return true;
        }

        // Get the module hierarchy IDs
        $module = Module::where('code', $moduleCode)->first();
        if (!$module) return false;

        $subModule = SubModule::where('module_id', $module->id)
            ->where('code', $subModuleCode)
            ->first();
        if (!$subModule) return false;

        $component = ModuleComponent::where('sub_module_id', $subModule->id)
            ->where('code', $componentCode)
            ->first();
        if (!$component) return false;

        $action = ModuleComponentAction::where('module_component_id', $component->id)
            ->where('code', $actionCode)
            ->first();
        if (!$action) return false;

        // Check if role has access at any level (cascading)
        return $this->moduleAccess()
            ->where(function ($query) use ($module, $subModule, $component, $action) {
                // Module level access
                $query->where(function ($q) use ($module) {
                    $q->where('module_id', $module->id)
                      ->whereNull('sub_module_id')
                      ->whereNull('component_id')
                      ->whereNull('action_id');
                })
                // SubModule level access
                ->orWhere(function ($q) use ($module, $subModule) {
                    $q->where('module_id', $module->id)
                      ->where('sub_module_id', $subModule->id)
                      ->whereNull('component_id')
                      ->whereNull('action_id');
                })
                // Component level access
                ->orWhere(function ($q) use ($module, $subModule, $component) {
                    $q->where('module_id', $module->id)
                      ->where('sub_module_id', $subModule->id)
                      ->where('component_id', $component->id)
                      ->whereNull('action_id');
                })
                // Specific action access
                ->orWhere(function ($q) use ($module, $subModule, $component, $action) {
                    $q->where('module_id', $module->id)
                      ->where('sub_module_id', $subModule->id)
                      ->where('component_id', $component->id)
                      ->where('action_id', $action->id);
                });
            })
            ->exists();
    }

    /**
     * Get access scope for a specific module
     */
    public function getModuleAccessScope(string $moduleCode): ?string
    {
        if ($this->hasFullAccess()) {
            return 'all';
        }

        $module = Module::where('code', $moduleCode)->first();
        if (!$module) {
            return null;
        }

        $access = $this->moduleAccess()
            ->where('module_id', $module->id)
            ->first();

        return $access?->access_scope;
    }
}
