<?php

namespace Aero\Platform\Traits;

use Illuminate\Database\Eloquent\Builder;
use Stancl\Tenancy\Contracts\Tenant;

/**
 * Tenant Scoped Trait
 *
 * Automatically scope all queries to the current tenant.
 * Use this trait on models that should be tenant-isolated.
 */
trait TenantScoped
{
    /**
     * Boot the trait.
     */
    protected static function bootTenantScoped(): void
    {
        // Only apply tenant scoping if we're in a tenant context
        if (! tenancy()->initialized) {
            return;
        }

        // Automatically add tenant_id when creating
        static::creating(function ($model) {
            if (tenancy()->initialized && ! $model->getAttribute('tenant_id')) {
                $model->setAttribute('tenant_id', tenant('id'));
            }
        });

        // Automatically scope all queries to current tenant
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (tenancy()->initialized) {
                $builder->where($builder->getQuery()->from.'.tenant_id', tenant('id'));
            }
        });
    }

    /**
     * Get the tenant relationship.
     */
    public function tenant()
    {
        return $this->belongsTo(config('tenancy.tenant_model', \App\Models\Tenant::class), 'tenant_id');
    }

    /**
     * Scope query without tenant restriction (admin use).
     */
    public function scopeWithoutTenantRestriction(Builder $query): Builder
    {
        return $query->withoutGlobalScope('tenant');
    }
}
