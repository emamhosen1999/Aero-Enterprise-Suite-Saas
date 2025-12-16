<?php

namespace Aero\Platform\Models;

use Aero\Platform\Models\Module;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * EOS365 Plan Model
 *
 * Represents a subscription plan (e.g., 'Gold Monthly', 'Enterprise Yearly').
 * Uses DECIMAL for price to ensure financial precision.
 *
 * @property string $id UUID primary key
 * @property string $slug Unique identifier for code reference
 * @property string $name Display name
 * @property string $monthly_price Monthly price in decimal format
 * @property int $duration_in_months Billing cycle: 1=Monthly, 12=Yearly
 * @property int $max_users Maximum allowed users (0 = unlimited)
 * @property int $max_storage_gb Storage quota in GB
 */
class Plan extends Model
{
    /** @use HasFactory<\Aero\Platform\Database\Factories\PlanFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * The connection name for the model.
     * Plans are stored in the landlord database, not tenant databases.
     *
     * @var string
     */
    protected $connection = 'mysql';

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): \Aero\Platform\Database\Factories\PlanFactory
    {
        return \Aero\Platform\Database\Factories\PlanFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'description',
        'monthly_price',
        'yearly_price',
        'setup_fee',
        'currency',
        'features',
        'limits',
        'trial_days',
        'sort_order',
        'is_active',
        'is_featured',
        'duration_in_months',
        'max_users',
        'max_storage_gb',
        // Stripe integration
        'stripe_monthly_price_id',
        'stripe_yearly_price_id',
        'stripe_product_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * Note: Using decimal:2 for price columns ensures proper
     * financial calculations without floating point errors.
     */
    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'yearly_price' => 'decimal:2',
            'setup_fee' => 'decimal:2',
            'features' => 'array',
            'limits' => 'array',
            'trial_days' => 'integer',
            'sort_order' => 'integer',
            'is_active' => 'boolean',
            'is_featured' => 'boolean',
            'duration_in_months' => 'integer',
            'max_users' => 'integer',
            'max_storage_gb' => 'integer',
        ];
    }

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    /**
     * Get all subscriptions for this plan.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get all tenants subscribed to this plan.
     */
    public function tenants(): HasManyThrough
    {
        return $this->hasManyThrough(
            Tenant::class,
            Subscription::class,
            'plan_id',      // Foreign key on subscriptions table
            'id',           // Foreign key on tenants table
            'id',           // Local key on plans table
            'tenant_id'     // Local key on subscriptions table
        );
    }

    /**
     * Get all modules included in this plan.
     */
    public function modules(): BelongsToMany
    {
        return $this->belongsToMany(Module::class, 'plan_module')
            ->withPivot('limits', 'is_enabled')
            ->withTimestamps()
            ->wherePivot('is_enabled', true);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope to filter only active plans.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter featured plans.
     */
    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to order plans by sort_order.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Scope to filter monthly plans.
     */
    public function scopeMonthly(Builder $query): Builder
    {
        return $query->where('duration_in_months', 1);
    }

    /**
     * Scope to filter yearly plans.
     */
    public function scopeYearly(Builder $query): Builder
    {
        return $query->where('duration_in_months', 12);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Check if users are unlimited for this plan.
     */
    public function hasUnlimitedUsers(): bool
    {
        return $this->max_users === 0;
    }

    /**
     * Get the effective price based on duration.
     */
    public function getEffectivePrice(): string
    {
        return $this->duration_in_months === 12
            ? $this->yearly_price
            : $this->monthly_price;
    }

    /**
     * Calculate monthly equivalent price for yearly plans.
     */
    public function getMonthlyEquivalent(): string
    {
        if ($this->duration_in_months === 12) {
            return number_format((float) $this->yearly_price / 12, 2);
        }

        return $this->monthly_price;
    }
}
