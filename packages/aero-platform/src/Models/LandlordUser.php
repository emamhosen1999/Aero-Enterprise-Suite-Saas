<?php

namespace Aero\Platform\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Traits\HasRoles;

/**
 * LandlordUser Model (Platform Admin)
 *
 * Represents platform administrators who manage the multi-tenant SaaS
 * from the admin.platform.com domain. These users exist ONLY in the
 * central database and have access to tenant management, billing,
 * and platform-wide settings.
 *
 * This model uses the same structure as the User model to share
 * roles and permissions between platform admins and tenant users.
 *
 * SECURITY CONSIDERATIONS:
 * - Stored in central database (not affected by tenant context)
 * - Separate from tenant User model to enforce isolation
 * - Uses Spatie HasRoles for permission management
 * - Should have MFA enabled in production
 *
 * @property int $id Primary key
 * @property string $user_name Username
 * @property string $name Full name
 * @property string $email Unique email address
 * @property string $password Hashed password
 * @property bool $active Whether the account is active
 * @property string|null $phone Phone number
 * @property string|null $profile_image Profile image path
 * @property string $timezone User timezone
 * @property \Carbon\Carbon|null $email_verified_at
 * @property \Carbon\Carbon|null $last_login_at
 * @property string|null $last_login_ip
 */
class LandlordUser extends Authenticatable
{
    use HasFactory, HasRoles, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

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
     * The guard name for Spatie permissions.
     * This allows sharing roles/permissions with the 'web' guard.
     *
     * @var string
     */
    protected $guard_name = 'landlord';

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): \Aero\Platform\Database\Factories\LandlordUserFactory
    {
        return \Aero\Platform\Database\Factories\LandlordUserFactory::new();
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_name',
        'name',
        'email',
        'password',
        'phone',
        'active',
        'profile_image',
        'timezone',
        'email_verified_at',
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
            'active' => 'boolean',
            'last_login_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'profile_image_url',
    ];

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope to filter active users only.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Scope to filter inactive users only.
     */
    public function scopeInactive($query)
    {
        return $query->where('active', false);
    }

    // =========================================================================
    // RELATIONSHIPS
    // =========================================================================

 

    // =========================================================================
    // HELPER METHODS
    // =========================================================================

   
    /**
     * Check if the user is a super admin (has Platform Super Admin role).
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('Super Administrator');
    }

    /**
     * Check if the user is an admin (any admin role).
     */
    public function isAdmin(): bool
    {
        return $this->hasAnyRole(['Super Administrator', 'Platform Admin']);
    }

    /**
     * Check if the user is support staff.
     */
    public function isSupport(): bool
    {
        return $this->hasRole('Platform Support');
    }

    /**
     * Check if the user is a super administrator.
     * Super administrators bypass all module access checks.
     */
    public function getIsSuperAdminAttribute(): bool
    {
        return $this->hasRole('Super Administrator');
    }

    /**
     * Check if the user account is active.
     */
    public function isActive(): bool
    {
        return $this->active === true;
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
     * Get the profile image URL or generate a default.
     */
    public function getProfileImageUrlAttribute(): string
    {
        if ($this->profile_image) {
            return asset('storage/'.$this->profile_image);
        }

        // Generate a Gravatar URL as fallback
        $hash = md5(strtolower(trim($this->email)));

        return "https://www.gravatar.com/avatar/{$hash}?d=mp&s=200";
    }
}
