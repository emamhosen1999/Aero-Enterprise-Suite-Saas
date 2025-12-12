<?php

namespace Aero\Platform\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Custom Role model extending Spatie's Role
 *
 * Adds the moduleAccess relationship for the Role-Module Access system.
 * Platform version for landlord users.
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
}
