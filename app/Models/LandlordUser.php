<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * LandlordUser Model (Super Admin)
 *
 * Represents platform administrators who manage the multi-tenant SaaS
 * from the admin.platform.com domain. These users exist ONLY in the
 * central database and have access to tenant management, billing,
 * and platform-wide settings.
 *
 * SECURITY CONSIDERATIONS:
 * - Uses UUID primary key to prevent enumeration attacks
 * - Stored in central database (not affected by tenant context)
 * - Separate from tenant User model to enforce isolation
 * - Should have MFA enabled in production
 *
 * @property string $id UUID primary key
 * @property string $name Full name
 * @property string $email Unique email address
 * @property string $password Hashed password
 * @property string $role Admin role (super_admin, admin, support)
 * @property bool $is_active Whether the account is active
 * @property \Carbon\Carbon|null $email_verified_at
 * @property \Carbon\Carbon|null $last_login_at
 * @property string|null $last_login_ip
 */
class LandlordUser extends Authenticatable
{
    use HasFactory, HasUuids, Notifiable, SoftDeletes;

    /**
     * CRITICAL: Force this model to ALWAYS use the central database connection.
     *
     * This ensures landlord users are never accidentally queried from
     * a tenant database, even when tenancy is initialized.
     *
     * @var string
     */
    protected $connection = 'central';

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'landlord_users';

    /**
     * Role constants.
     */
    public const ROLE_SUPER_ADMIN = 'super_admin';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_SUPPORT = 'support';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
        'avatar',
        'phone',
        'timezone',
        'last_login_at',
        'last_login_ip',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope to filter active users only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to filter by role.
     */
    public function scopeRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Scope to filter super admins.
     */
    public function scopeSuperAdmins($query)
    {
        return $query->where('role', self::ROLE_SUPER_ADMIN);
    }

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

    /**
     * Check if the user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    /**
     * Check if the user is an admin (any admin role).
     */
    public function isAdmin(): bool
    {
        return in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_ADMIN], true);
    }

    /**
     * Check if the user is support staff.
     */
    public function isSupport(): bool
    {
        return $this->role === self::ROLE_SUPPORT;
    }

    /**
     * Check if the user account is active.
     */
    public function isActive(): bool
    {
        return $this->is_active === true;
    }

    /**
     * Record a login event.
     */
    public function recordLogin(?string $ip = null): void
    {
        $this->update([
            'last_login_at' => now(),
            'last_login_ip' => $ip,
        ]);
    }

    /**
     * Check if the user has a specific permission.
     * For now, super_admin has all permissions.
     */
    public function hasPermission(string $permission): bool
    {
        // Super admin has all permissions
        if ($this->isSuperAdmin()) {
            return true;
        }

        // TODO: Implement granular permissions if needed
        // For now, admins have most permissions, support has limited
        $adminPermissions = [
            'tenants.view', 'tenants.create', 'tenants.edit',
            'plans.view', 'plans.create', 'plans.edit',
            'billing.view', 'settings.view', 'settings.edit',
        ];

        $supportPermissions = [
            'tenants.view', 'plans.view', 'billing.view',
        ];

        $userPermissions = match ($this->role) {
            self::ROLE_ADMIN => $adminPermissions,
            self::ROLE_SUPPORT => $supportPermissions,
            default => [],
        };

        return in_array($permission, $userPermissions, true);
    }

    /**
     * Get the user's initials for avatar fallback.
     */
    public function getInitialsAttribute(): string
    {
        $words = explode(' ', $this->name);
        $initials = '';

        foreach (array_slice($words, 0, 2) as $word) {
            $initials .= strtoupper(substr($word, 0, 1));
        }

        return $initials;
    }

    /**
     * Get the avatar URL or generate a default.
     */
    public function getAvatarUrlAttribute(): string
    {
        if ($this->avatar) {
            return asset('storage/'.$this->avatar);
        }

        // Generate a Gravatar URL as fallback
        $hash = md5(strtolower(trim($this->email)));

        return "https://www.gravatar.com/avatar/{$hash}?d=mp&s=200";
    }
}
