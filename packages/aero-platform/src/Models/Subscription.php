<?php

namespace Aero\Platform\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * EOS365 Subscription Model
 *
 * Represents a tenant's subscription to a plan.
 * Tracks billing cycle, payment status, and validity period.
 *
 * @property string $id UUID primary key
 * @property string $tenant_id Foreign key to tenants table
 * @property string $plan_id Foreign key to plans table
 * @property string $amount Charged amount (DECIMAL for precision)
 * @property string $status Subscription status: active, cancelled, past_due
 * @property \Carbon\Carbon $starts_at Subscription start date
 * @property \Carbon\Carbon|null $ends_at Subscription end date
 * @property string|null $payment_ref_id External payment gateway reference (Stripe/Paddle)
 */
class Subscription extends Model
{
    /** @use HasFactory<\Database\Factories\SubscriptionFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    /**
     * Subscription status constants.
     */
    public const STATUS_ACTIVE = 'active';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_PAST_DUE = 'past_due';

    public const STATUS_TRIALING = 'trialing';

    public const STATUS_EXPIRED = 'expired';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'tenant_id',
        'plan_id',
        'billing_cycle',
        'amount',
        'discount_amount',
        'currency',
        'status',
        'trial_starts_at',
        'trial_ends_at',
        'starts_at',
        'ends_at',
        'cancelled_at',
        'cancellation_reason',
        'payment_method',
        'payment_ref_id',
        'metadata',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'trial_starts_at' => 'datetime',
            'trial_ends_at' => 'datetime',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    /**
     * Get the tenant that owns this subscription.
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the plan associated with this subscription.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope to filter active subscriptions.
     *
     * A subscription is considered active when:
     * 1. Status is 'active'
     * 2. ends_at is in the future (or null for lifetime subscriptions)
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE)
            ->where(function (Builder $q) {
                $q->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            });
    }

    /**
     * Scope to filter subscriptions currently in trial.
     */
    public function scopeTrialing(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_TRIALING)
            ->where('trial_ends_at', '>', now());
    }

    /**
     * Scope to filter cancelled subscriptions.
     */
    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    /**
     * Scope to filter past due subscriptions.
     */
    public function scopePastDue(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PAST_DUE);
    }

    /**
     * Scope to filter expired subscriptions.
     */
    public function scopeExpired(Builder $query): Builder
    {
        return $query->where('ends_at', '<', now());
    }

    /**
     * Scope to filter by billing cycle.
     */
    public function scopeBillingCycle(Builder $query, string $cycle): Builder
    {
        return $query->where('billing_cycle', $cycle);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Check if the subscription is currently active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE
            && ($this->ends_at === null || $this->ends_at->isFuture());
    }

    /**
     * Check if the subscription is currently in trial.
     */
    public function isTrialing(): bool
    {
        return $this->status === self::STATUS_TRIALING
            && $this->trial_ends_at?->isFuture();
    }

    /**
     * Check if the subscription has expired.
     */
    public function isExpired(): bool
    {
        return $this->ends_at?->isPast() ?? false;
    }

    /**
     * Check if the subscription is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Check if the subscription is past due on payment.
     */
    public function isPastDue(): bool
    {
        return $this->status === self::STATUS_PAST_DUE;
    }

    /**
     * Get the number of days remaining in the subscription.
     */
    public function daysRemaining(): int
    {
        if ($this->ends_at === null) {
            return PHP_INT_MAX; // Lifetime subscription
        }

        return max(0, now()->diffInDays($this->ends_at, false));
    }

    /**
     * Cancel the subscription.
     */
    public function cancel(?string $reason = null): bool
    {
        return $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);
    }

    /**
     * Renew the subscription for another billing cycle.
     */
    public function renew(): bool
    {
        $duration = $this->plan->duration_in_months ?? 1;

        return $this->update([
            'status' => self::STATUS_ACTIVE,
            'starts_at' => now(),
            'ends_at' => now()->addMonths($duration),
            'cancelled_at' => null,
            'cancellation_reason' => null,
        ]);
    }
}
