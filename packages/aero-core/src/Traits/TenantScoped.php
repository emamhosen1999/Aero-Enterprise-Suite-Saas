<?php

namespace Aero\Core\Traits;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Builder;

/**
 * Tenant Scoped Trait
 *
 * Automatically scope all queries to the current tenant.
 * Use this trait on models that should be tenant-isolated.
 * This trait is only active when stancl/tenancy is installed and initialized.
 */
trait TenantScoped
{
    /**
     * Boot the trait.
     */
    protected static function bootTenantScoped(): void
    {
        // Check if tenancy is available (stancl/tenancy package installed)
        if (! function_exists('tenancy')) {
            return;
        }

        // Only apply tenant scoping if we're in a tenant context
        if (! tenancy()->initialized) {
            return;
        }

        // Automatically add tenant_id when creating
        static::creating(function ($model) {
            if (function_exists('tenancy') && tenancy()->initialized && ! $model->getAttribute('tenant_id')) {
                $model->setAttribute('tenant_id', tenant('id'));
            }
        });

        // Automatically scope all queries to current tenant
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (function_exists('tenancy') && tenancy()->initialized) {
                $builder->where($builder->getQuery()->from.'.tenant_id', tenant('id'));
            }
        });
    }

    /**
     * Get the tenant relationship.
     */
    public function tenant()
    {
        $tenantModel = config('tenancy.tenant_model', Tenant::class);

        return $this->belongsTo($tenantModel, 'tenant_id');
    }

    /**
     * Scope query without tenant restriction (admin use).
     */
    public function scopeWithoutTenantRestriction(Builder $query): Builder
    {
        return $query->withoutGlobalScope('tenant');
    }
}
