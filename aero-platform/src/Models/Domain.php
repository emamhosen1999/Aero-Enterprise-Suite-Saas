<?php

namespace Aero\Platform\Models;

use Carbon\Carbon;
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
 * @property bool $is_custom Whether this is a custom domain (vs auto-generated subdomain)
 * @property string $status Domain verification status: pending, verified, active, failed
 * @property string|null $dns_verification_code Unique code for DNS TXT record verification
 * @property string|null $ssl_status SSL certificate status: pending, provisioning, active, failed
 * @property Carbon|null $verified_at When the domain was verified
 * @property string|null $verification_errors JSON errors from verification attempts
 */
class Domain extends BaseDomain
{
    /**
     * Domain status constants.
     */
    public const STATUS_PENDING = 'pending';

    public const STATUS_VERIFIED = 'verified';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_FAILED = 'failed';

    /**
     * SSL status constants.
     */
    public const SSL_PENDING = 'pending';

    public const SSL_PROVISIONING = 'provisioning';

    public const SSL_ACTIVE = 'active';

    public const SSL_FAILED = 'failed';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'domain',
        'tenant_id',
        'is_primary',
        'is_custom',
        'status',
        'dns_verification_code',
        'ssl_status',
        'verified_at',
        'verification_errors',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'is_custom' => 'boolean',
            'verified_at' => 'datetime',
            'verification_errors' => 'array',
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
     * Scope to filter only custom domains.
     */
    public function scopeCustom(Builder $query): Builder
    {
        return $query->where('is_custom', true);
    }

    /**
     * Scope to filter only subdomain (non-custom) domains.
     */
    public function scopeSubdomain(Builder $query): Builder
    {
        return $query->where('is_custom', false);
    }

    /**
     * Scope to filter by status.
     */
    public function scopeWithStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter active domains only.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope to filter pending verification domains.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
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
     * Check if this is a custom domain.
     */
    public function isCustom(): bool
    {
        return $this->is_custom === true;
    }

    /**
     * Check if domain is pending verification.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if domain is verified (DNS check passed).
     */
    public function isVerified(): bool
    {
        return in_array($this->status, [self::STATUS_VERIFIED, self::STATUS_ACTIVE], true);
    }

    /**
     * Check if domain is fully active (verified + SSL).
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if domain verification failed.
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Check if SSL is active.
     */
    public function hasActiveSSL(): bool
    {
        return $this->ssl_status === self::SSL_ACTIVE;
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

    /**
     * Mark domain as verified.
     */
    public function markAsVerified(): bool
    {
        return $this->update([
            'status' => self::STATUS_VERIFIED,
            'verified_at' => now(),
            'verification_errors' => null,
        ]);
    }

    /**
     * Mark domain as active (fully operational).
     */
    public function markAsActive(): bool
    {
        return $this->update([
            'status' => self::STATUS_ACTIVE,
            'ssl_status' => self::SSL_ACTIVE,
        ]);
    }

    /**
     * Mark domain verification as failed.
     */
    public function markAsFailed(array $errors = []): bool
    {
        return $this->update([
            'status' => self::STATUS_FAILED,
            'verification_errors' => $errors,
        ]);
    }

    /**
     * Get the DNS TXT record name for verification.
     */
    public function getVerificationTxtRecordName(): string
    {
        return '_eos365-verification.'.$this->domain;
    }

    /**
     * Get the expected TXT record value.
     */
    public function getExpectedTxtRecordValue(): string
    {
        return 'eos365-verify='.$this->dns_verification_code;
    }

    /**
     * Get a human-readable status label.
     */
    public function getStatusLabel(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending Verification',
            self::STATUS_VERIFIED => 'Verified',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_FAILED => 'Failed',
            default => 'Unknown',
        };
    }

    /**
     * Get status color for UI.
     */
    public function getStatusColor(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'warning',
            self::STATUS_VERIFIED => 'primary',
            self::STATUS_ACTIVE => 'success',
            self::STATUS_FAILED => 'danger',
            default => 'default',
        };
    }
}
