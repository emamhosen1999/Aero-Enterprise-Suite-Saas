<?php

namespace Aero\Platform\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Models\Permission;

/**
 * Module Permission Requirement Model
 *
 * Links modules, sub-modules, and components to their required permissions.
 * Supports complex permission logic (required, any-of, all-of).
 *
 * This table exists ONLY in tenant databases (per-tenant permission mappings).
 * Uses tenant connection when tenancy is active.
 */
class ModulePermission extends Model
{
    use HasFactory;

    protected $table = 'module_permissions';

    /**
     * Get the database connection for the model.
     * Uses tenant connection when tenancy is initialized.
     */
    public function getConnectionName(): ?string
    {
        if (function_exists('tenancy') && tenancy()->initialized) {
            return 'tenant';
        }

        return $this->connection;
    }

    protected $fillable = [
        'module_id',
        'sub_module_id',
        'component_id',
        'permission_id',
        'requirement_type',
        'requirement_group',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // Requirement type constants
    public const TYPE_REQUIRED = 'required';

    public const TYPE_ANY = 'any';

    public const TYPE_ALL = 'all';

    public function module(): BelongsTo
    {
        return $this->belongsTo(Module::class);
    }

    public function subModule(): BelongsTo
    {
        return $this->belongsTo(SubModule::class);
    }

    public function component(): BelongsTo
    {
        return $this->belongsTo(ModuleComponent::class, 'component_id');
    }

    public function permission(): BelongsTo
    {
        return $this->belongsTo(Permission::class);
    }

    /**
     * Scope to get active requirements only
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get requirements for a specific module
     */
    public function scopeForModule($query, int $moduleId)
    {
        return $query->where('module_id', $moduleId)
            ->whereNull('sub_module_id')
            ->whereNull('component_id');
    }

    /**
     * Scope to get requirements for a specific sub-module
     */
    public function scopeForSubModule($query, int $subModuleId)
    {
        return $query->where('sub_module_id', $subModuleId)
            ->whereNull('component_id');
    }

    /**
     * Scope to get requirements for a specific component
     */
    public function scopeForComponent($query, int $componentId)
    {
        return $query->where('component_id', $componentId);
    }
}
