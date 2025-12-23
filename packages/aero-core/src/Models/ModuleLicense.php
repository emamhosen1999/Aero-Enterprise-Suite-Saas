<?php

namespace Aero\Core\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ModuleLicense extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'module_code',
        'module_name',
        'license_key',
        'provider',
        'license_type',
        'customer_name',
        'customer_email',
        'domain',
        'purchase_code',
        'activation_id',
        'purchase_date',
        'activated_at',
        'status',
        'expires_at',
        'support_until',
        'updates_until',
        'last_verified_at',
        'verification_failures',
        'grace_period_started_at',
        'metadata',
        'notes',
    ];

    protected $casts = [
        'metadata' => 'array',
        'purchase_date' => 'datetime',
        'activated_at' => 'datetime',
        'expires_at' => 'datetime',
        'support_until' => 'datetime',
        'updates_until' => 'datetime',
        'last_verified_at' => 'datetime',
        'grace_period_started_at' => 'datetime',
    ];

    /**
     * Check if license is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active' && 
               ($this->expires_at === null || $this->expires_at->isFuture());
    }

    /**
     * Check if license has expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    /**
     * Check if license is in grace period
     */
    public function isInGracePeriod(): bool
    {
        if (!$this->grace_period_started_at) {
            return false;
        }

        $gracePeriod = config('license.verification.grace_period', 604800); // 7 days
        return $this->grace_period_started_at->addSeconds($gracePeriod)->isFuture();
    }

    /**
     * Check if support is active
     */
    public function hasSupportAccess(): bool
    {
        return $this->support_until === null || $this->support_until->isFuture();
    }

    /**
     * Check if updates are available
     */
    public function hasUpdatesAccess(): bool
    {
        return $this->updates_until === null || $this->updates_until->isFuture();
    }

    /**
     * Start grace period
     */
    public function startGracePeriod(): void
    {
        $this->update([
            'grace_period_started_at' => now(),
            'verification_failures' => $this->verification_failures + 1,
        ]);
    }

    /**
     * Reset grace period
     */
    public function resetGracePeriod(): void
    {
        $this->update([
            'grace_period_started_at' => null,
            'verification_failures' => 0,
            'last_verified_at' => now(),
        ]);
    }

    /**
     * Scope: Active licenses
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                    });
    }

    /**
     * Scope: Expired licenses
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<', now());
    }

    /**
     * Scope: By module
     */
    public function scopeForModule($query, string $moduleCode)
    {
        return $query->where('module_code', $moduleCode);
    }

    /**
     * Scope: By provider
     */
    public function scopeByProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }
}
