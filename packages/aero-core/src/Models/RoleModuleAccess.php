<?php

namespace Aero\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Models\Role;

/**
 * Role Module Access Model
 *
 * Maps roles directly to module hierarchy elements (modules, submodules, components, actions).
 * Replaces the permission-based system with a simpler, visual hierarchy-based access control.
 *
 * Access is granted at ONE level only - higher levels cascade down:
 * - module_id set → Full access to module and all children
 * - sub_module_id set → Access to submodule and all its components/actions
 * - component_id set → Access to component and all its actions
 * - action_id set → Access to only that specific action
 *
 * @property int $id
 * @property int $role_id
 * @property int|null $module_id
 * @property int|null $sub_module_id
 * @property int|null $component_id
 * @property int|null $action_id
 * @property string $access_scope
 */
class RoleModuleAccess extends Model
{
    protected $table = 'role_module_access';

    protected $fillable = [
        'role_id',
        'module_id',
        'sub_module_id',
        'component_id',
        'action_id',
        'access_scope',
    ];

    protected $casts = [
        'role_id' => 'integer',
        'module_id' => 'integer',
        'sub_module_id' => 'integer',
        'component_id' => 'integer',
        'action_id' => 'integer',
    ];

    // Access scope constants
    public const SCOPE_ALL = 'all';

    public const SCOPE_OWN = 'own';

    public const SCOPE_TEAM = 'team';

    public const SCOPE_DEPARTMENT = 'department';

    // Access scopes array for dropdowns
    public const ACCESS_SCOPES = [
        self::SCOPE_ALL => 'Full Access',
        self::SCOPE_OWN => 'Own Only',
        self::SCOPE_TEAM => 'Team',
        self::SCOPE_DEPARTMENT => 'Department',
    ];

    /**
     * Get the role that owns this access entry.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the module (if access is at module level).
     */
    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    /**
     * Get the submodule (if access is at submodule level).
     */
    public function subModule(): BelongsTo
    {
        return $this->belongsTo(SubModule::class, 'sub_module_id');
    }

    /**
     * Get the component (if access is at component level).
     */
    public function component(): BelongsTo
    {
        return $this->belongsTo(ModuleComponent::class, 'component_id');
    }

    /**
     * Get the action (if access is at action level).
     */
    public function action(): BelongsTo
    {
        return $this->belongsTo(ModuleComponentAction::class, 'action_id');
    }

    /**
     * Determine the access level of this entry.
     */
    public function getAccessLevelAttribute(): string
    {
        if ($this->action_id) {
            return 'action';
        }
        if ($this->component_id) {
            return 'component';
        }
        if ($this->sub_module_id) {
            return 'sub_module';
        }
        if ($this->module_id) {
            return 'module';
        }

        return 'none';
    }

    /**
     * Check if this entry grants module-level access.
     */
    public function isModuleLevel(): bool
    {
        return $this->module_id && ! $this->sub_module_id && ! $this->component_id && ! $this->action_id;
    }

    /**
     * Check if this entry grants submodule-level access.
     */
    public function isSubModuleLevel(): bool
    {
        return $this->sub_module_id && ! $this->component_id && ! $this->action_id;
    }

    /**
     * Check if this entry grants component-level access.
     */
    public function isComponentLevel(): bool
    {
        return $this->component_id && ! $this->action_id;
    }

    /**
     * Check if this entry grants action-level access.
     */
    public function isActionLevel(): bool
    {
        return (bool) $this->action_id;
    }
}
