<?php

namespace Aero\Platform\Models;

use Illuminate\Database\Eloquent\Casts\AsArrayObject;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Cashier\Billable;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

/**
 * EOS365 Tenant Model
 *
 * Represents a tenant (customer organization) in the multi-tenant SaaS platform.
 * Uses UUID primary key to prevent enumeration attacks.
 *
 * This model extends Stancl\Tenancy's base Tenant and implements:
 * - TenantWithDatabase: Enables automatic database creation/deletion
 * - HasDomains trait: Provides domain management functionality
 * - Billable trait: Enables Laravel Cashier for Stripe subscriptions
 *
 * @property string $id UUID primary key
 * @property \ArrayObject $data Flexible metadata storage (owner_name, address, etc.)
 * @property string $status Tenant status: pending, active, suspended, archived
 * @property bool $maintenance_mode Whether tenant is in maintenance mode
 * @property \Carbon\Carbon|null $trial_ends_at Trial period end date
 * @property string|null $plan_id Foreign key to plans table
 * @property string|null $stripe_id Stripe Customer ID
 * @property string|null $pm_type Payment method type (card, etc.)
 * @property string|null $pm_last_four Last 4 digits of payment method
 */
class Tenant extends BaseTenant implements TenantWithDatabase
{
    use Billable, HasDatabase, HasDomains, HasFactory, SoftDeletes;

    /**
     * Tenant status constants.
     */
    public const STATUS_PENDING = 'pending';

    public const STATUS_PROVISIONING = 'provisioning';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_FAILED = 'failed';

    public const STATUS_SUSPENDED = 'suspended';

    public const STATUS_ARCHIVED = 'archived';

    /**
     * Provisioning step constants.
     */
    public const STEP_CREATING_DB = 'creating_db';

    public const STEP_MIGRATING = 'migrating';

    public const STEP_SEEDING = 'seeding';

    public const STEP_CREATING_ADMIN = 'creating_admin';

    /**
     * Registration step constants for tracking incomplete registrations.
     */
    public const REG_STEP_ACCOUNT_TYPE = 'account_type';

    public const REG_STEP_DETAILS = 'details';

    public const REG_STEP_ADMIN = 'admin';

    public const REG_STEP_VERIFY_EMAIL = 'verify_email';

    public const REG_STEP_VERIFY_PHONE = 'verify_phone';

    public const REG_STEP_PLAN = 'plan';

    public const REG_STEP_PAYMENT = 'payment';

    /**
     * Custom columns that are stored directly on the tenants table
     * (not in the JSON 'data' column).
     *
     * IMPORTANT: Any attribute listed here will be stored in its own
     * database column instead of being serialized into the 'data' JSON column.
     * This is crucial for:
     * - Indexing and query performance
     * - Foreign key relationships (plan_id)
     * - Filtering in database queries
     */
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'type',
            'subdomain',
            'email',
            'phone',
            'plan_id',           // FK to plans table
            'subscription_plan', // billing cycle: monthly/yearly
            'modules',
            'trial_ends_at',
            'subscription_ends_at',
            'status',
            'provisioning_step', // Async provisioning: creating_db, migrating, seeding, creating_admin
            'admin_data',        // Temporary admin credentials during provisioning
            'maintenance_mode',
            // Admin verification columns (legacy - kept for backward compatibility)
            'admin_email_verified_at',
            'admin_phone_verified_at',
            'admin_email_verification_code',
            'admin_email_verification_sent_at',
            'admin_phone_verification_code',
            'admin_phone_verification_sent_at',
            // Company verification columns (new - for verifying company contact info)
            'company_email_verified_at',
            'company_phone_verified_at',
            'company_email_verification_code',
            'company_email_verification_sent_at',
            'company_phone_verification_code',
            'company_phone_verification_sent_at',
            'registration_step',  // Track which step user left from for resume functionality
            // Stripe Cashier columns
            'stripe_id',
            'pm_type',
            'pm_last_four',
            'stripe_trial_ends_at',
        ];
    }

    /**
     * The attributes that should be cast.
     *
     * Using AsArrayObject for 'data' allows partial updates without
     * overwriting the entire JSON structure.
     */
    protected function casts(): array
    {
        return [
            'data' => AsArrayObject::class,
            'modules' => AsArrayObject::class,
            'admin_data' => AsArrayObject::class,
            'trial_ends_at' => 'datetime',
            'subscription_ends_at' => 'datetime',
            'stripe_trial_ends_at' => 'datetime',
            'maintenance_mode' => 'boolean',
            'admin_email_verified_at' => 'datetime',
            'admin_phone_verified_at' => 'datetime',
            'admin_email_verification_sent_at' => 'datetime',
            'admin_phone_verification_sent_at' => 'datetime',
            'company_email_verified_at' => 'datetime',
            'company_phone_verified_at' => 'datetime',
            'company_email_verification_sent_at' => 'datetime',
            'company_phone_verification_sent_at' => 'datetime',
        ];
    }

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

    /**
     * Get all domains associated with this tenant.
     */
    public function domains(): HasMany
    {
        return $this->hasMany(Domain::class);
    }

    /**
     * Get the primary domain for this tenant.
     */
    public function primaryDomain(): ?Domain
    {
        return $this->domains()->where('is_primary', true)->first();
    }

    /**
     * Get the subscription plan for this tenant.
     */
    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Get all subscriptions for this tenant.
     */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /**
     * Get the current (most recent active) subscription.
     *
     * Uses latestOfMany() to efficiently fetch only one record
     * that matches the active status criteria.
     */
    public function currentSubscription(): HasOne
    {
        return $this->hasOne(Subscription::class)
            ->ofMany(
                ['created_at' => 'max'],
                fn ($query) => $query->where('status', 'active')
            );
    }

    /**
     * Alias for currentSubscription() for backward compatibility.
     */
    public function activeSubscription(): HasOne
    {
        return $this->currentSubscription();
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope to filter only active tenants.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to filter tenants currently in trial.
     */
    public function scopeOnTrial($query)
    {
        return $query->where('status', 'pending')
            ->whereNotNull('trial_ends_at')
            ->where('trial_ends_at', '>', now());
    }

    /**
     * Scope to filter suspended tenants.
     */
    public function scopeSuspended($query)
    {
        return $query->where('status', 'suspended');
    }

    /**
     * Scope to filter tenants currently provisioning.
     */
    public function scopeProvisioning($query)
    {
        return $query->where('status', self::STATUS_PROVISIONING);
    }

    /**
     * Scope to filter failed tenants.
     */
    public function scopeFailed($query)
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Check if the tenant is currently active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if the tenant is currently provisioning.
     */
    public function isProvisioning(): bool
    {
        return $this->status === self::STATUS_PROVISIONING;
    }

    /**
     * Check if the tenant provisioning has failed.
     */
    public function hasFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Check if the tenant is on trial.
     */
    public function isOnTrial(): bool
    {
        return $this->trial_ends_at?->isFuture() ?? false;
    }

    /**
     * Check if the tenant's trial has expired.
     */
    public function hasTrialExpired(): bool
    {
        return $this->trial_ends_at?->isPast() ?? false;
    }

    /**
     * Check if the tenant is in maintenance mode.
     */
    public function isInMaintenance(): bool
    {
        return $this->maintenance_mode === true;
    }

    /**
     * Get the owner information from the data column.
     *
     * Owner info is stored in data JSON to avoid schema changes
     * when adding new owner fields.
     *
     * @return array{name?: string, email?: string, phone?: string}
     */
    public function getOwnerAttribute(): array
    {
        return [
            'name' => $this->data['owner_name'] ?? null,
            'email' => $this->data['owner_email'] ?? null,
            'phone' => $this->data['owner_phone'] ?? null,
        ];
    }

    /**
     * Activate the tenant (change status from pending/provisioning to active).
     * Clears admin_data after successful activation.
     */
    public function activate(): bool
    {
        return $this->update([
            'status' => self::STATUS_ACTIVE,
            'provisioning_step' => null,
            'admin_data' => null,
        ]);
    }

    /**
     * Start the provisioning process.
     *
     * @param  string  $step  Initial provisioning step
     */
    public function startProvisioning(string $step = self::STEP_CREATING_DB): bool
    {
        return $this->update([
            'status' => self::STATUS_PROVISIONING,
            'provisioning_step' => $step,
        ]);
    }

    /**
     * Update the current provisioning step.
     */
    public function updateProvisioningStep(string $step): bool
    {
        return $this->update(['provisioning_step' => $step]);
    }

    /**
     * Mark provisioning as failed.
     *
     * @param  string|null  $reason  Failure reason to store in data column
     */
    public function markProvisioningFailed(?string $reason = null): bool
    {
        if ($reason) {
            $data = $this->data ?? new \ArrayObject;
            $data['provisioning_error'] = $reason;
            $data['provisioning_failed_at'] = now()->toIso8601String();
            $this->data = $data;
        }
        $this->status = self::STATUS_FAILED;

        return $this->save();
    }

    /**
     * Clear admin data after admin user has been created.
     * Important for security - credentials should not persist.
     */
    public function clearAdminData(): bool
    {
        return $this->update(['admin_data' => null]);
    }

    /**
     * Check if the tenant has an active subscription that includes a specific module.
     *
     * This is the core gating method used by CheckModuleAccess middleware.
     * Returns true if:
     * 1. Tenant has an active subscription (within date range)
     * 2. The subscription's plan includes the specified module
     *
     * @param  string  $moduleName  Module code e.g., 'hrm', 'crm'
     */
    public function hasActiveSubscription(string $moduleName): bool
    {
        // Check 1: Look for active subscriptions with plans that include this module
        $hasSubscription = $this->subscriptions()
            ->where('status', Subscription::STATUS_ACTIVE)
            ->where('starts_at', '<=', now())
            ->where(function ($query) {
                $query->whereNull('ends_at')
                      ->orWhere('ends_at', '>=', now());
            })
            ->whereHas('plan.modules', function ($query) use ($moduleName) {
                $query->where('code', $moduleName)
                      ->where('is_active', true);
            })
            ->exists();

        if ($hasSubscription) {
            return true;
        }

        // Check 2: Also check direct plan relationship (legacy/simple setup)
        if ($this->plan_id && $this->plan) {
            return $this->plan->modules()
                ->where('code', $moduleName)
                ->where('is_active', true)
                ->exists();
        }

        // Check 3: Check tenant's custom modules array (for manual module grants)
        if (! empty($this->modules) && is_array($this->modules)) {
            if (in_array($moduleName, $this->modules)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Suspend the tenant.
     */
    public function suspend(?string $reason = null): bool
    {
        $data = $this->data ?? new \ArrayObject;
        $data['suspension_reason'] = $reason;
        $data['suspended_at'] = now()->toIso8601String();
        $this->data = $data;
        $this->status = self::STATUS_SUSPENDED;

        return $this->save();
    }

    /**
     * Enable maintenance mode for this tenant.
     */
    public function enableMaintenance(): bool
    {
        return $this->update(['maintenance_mode' => true]);
    }

    /**
     * Disable maintenance mode for this tenant.
     */
    public function disableMaintenance(): bool
    {
        return $this->update(['maintenance_mode' => false]);
    }

    // =========================================================================
    // STRIPE CASHIER OVERRIDES
    // =========================================================================

    /**
     * Get the email address used to create the Stripe customer.
     *
     * This returns the tenant owner's email from the data column,
     * which is the primary contact for billing communications.
     */
    public function stripeEmail(): ?string
    {
        return $this->data['owner_email'] ?? $this->email;
    }

    /**
     * Get the name for the Stripe customer.
     *
     * Uses the company name for business tenants, or owner name for individuals.
     */
    public function stripeName(): ?string
    {
        if ($this->type === 'company') {
            return $this->name;
        }

        return $this->data['owner_name'] ?? $this->name;
    }

    /**
     * Get the phone number for the Stripe customer.
     */
    public function stripePhone(): ?string
    {
        return $this->data['owner_phone'] ?? $this->phone;
    }

    /**
     * Get the address for the Stripe customer.
     *
     * @return array<string, string|null>
     */
    public function stripeAddress(): ?array
    {
        $billingAddress = $this->billingAddress;

        if (! $billingAddress) {
            return null;
        }

        return [
            'line1' => $billingAddress->address_line1,
            'line2' => $billingAddress->address_line2,
            'city' => $billingAddress->city,
            'state' => $billingAddress->state,
            'postal_code' => $billingAddress->postal_code,
            'country' => $billingAddress->country,
        ];
    }

    /**
     * Get metadata to store on the Stripe customer.
     *
     * @return array<string, string>
     */
    public function stripeMetadata(): array
    {
        return [
            'tenant_id' => $this->id,
            'subdomain' => $this->subdomain,
            'type' => $this->type,
        ];
    }

    // =========================================================================
    // BILLING RELATIONSHIPS
    // =========================================================================

    /**
     * Get the tenant's billing address.
     */
    public function billingAddress(): HasOne
    {
        return $this->hasOne(TenantBillingAddress::class, 'tenant_id');
    }

    // =========================================================================
    // BILLING HELPER METHODS
    // =========================================================================

    /**
     * Check if tenant has an active Stripe subscription.
     */
    public function hasActiveStripeSubscription(): bool
    {
        return $this->subscribed('default');
    }

    /**
     * Get the current Stripe subscription price.
     */
    public function currentStripePlan(): ?string
    {
        $subscription = $this->subscription('default');

        return $subscription?->stripe_price;
    }

    /**
     * Check if tenant is on a specific plan by Stripe price ID.
     */
    public function isOnStripePlan(string $priceId): bool
    {
        return $this->subscribedToPrice($priceId, 'default');
    }

    // =========================================================================
    // ADMIN SETUP HELPER METHODS
    // =========================================================================

    /**
     * Check if admin setup has been completed for this tenant.
     *
     * This checks the admin_setup_completed flag in the data column.
     * This flag is set when the first admin user is created via AdminSetupController.
     */
    public function isAdminSetupComplete(): bool
    {
        $data = $this->data instanceof \ArrayObject
            ? $this->data->getArrayCopy()
            : (array) ($this->data ?? []);

        return ! empty($data['admin_setup_completed']);
    }

    /**
     * Get the timestamp when admin setup was completed.
     */
    public function getAdminSetupCompletedAt(): ?string
    {
        $data = $this->data instanceof \ArrayObject
            ? $this->data->getArrayCopy()
            : (array) ($this->data ?? []);

        return $data['admin_setup_completed_at'] ?? null;
    }
}
