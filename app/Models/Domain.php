<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Stancl\Tenancy\Database\Models\Domain as BaseDomain;

/**
 * EOS365 Domain Model
 *
 * Represents a domain (or subdomain) mapped to a tenant.
 * The domain column is indexed for fast middleware lookups.
 *
 * @property int $id
 * @property string $domain The fully qualified domain name
 * @property string $tenant_id Foreign key to tenants table
 * @property bool $is_primary Whether this is the primary domain for the tenant
 */
class Domain extends BaseDomain
{
    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'domain',
        'tenant_id',
        'is_primary',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
        ];
    }

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    /**
     * Get the tenant that owns this domain.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope to filter only primary domains.
     */
    public function scopePrimary(Builder $query): Builder
    {
        return $query->where('is_primary', true);
    }

    /**
     * Scope to find domain by exact match.
     */
    public function scopeByDomain(Builder $query, string $domain): Builder
    {
        return $query->where('domain', $domain);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Check if this is the primary domain.
     */
    public function isPrimary(): bool
    {
        return $this->is_primary === true;
    }

    /**
     * Make this domain the primary one (and unset others).
     */
    public function makePrimary(): bool
    {
        // Unset other primary domains for this tenant
        static::where('tenant_id', $this->tenant_id)
            ->where('id', '!=', $this->id)
            ->update(['is_primary' => false]);

        return $this->update(['is_primary' => true]);
    }
}
