<?php

namespace Aero\Platform\Models;

use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Permission\Models\Role as SpatieRole;

/**
 * Custom Role model extending Spatie's Role
 *
 * Adds the moduleAccess relationship for the Role-Module Access system.
 */
class Role extends SpatieRole
{
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
        return $this->is_protected;
    }

    /**
     * Get accessible module IDs for this role
     */
    public function getAccessibleModuleIds(): array
    {
        return app(\App\Services\Module\RoleModuleAccessService::class)
            ->getAccessibleModuleIds($this);
    }
}
