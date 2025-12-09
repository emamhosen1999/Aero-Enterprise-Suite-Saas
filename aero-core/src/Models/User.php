<?php

namespace Aero\Core\Models;

use Aero\Core\Services\UserRelationshipRegistry;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Traits\HasRoles;

/**
 * User Model - Core Authentication & Account Management
 *
 * This model is FULLY INDEPENDENT and handles ONLY core functionality:
 * - Login credentials (email, password, OAuth)
 * - Two-factor authentication (when Fortify installed)
 * - Device management
 * - Account status (active, locked)
 * - Roles & permissions
 * - Basic profile
 *
 * Module-specific relationships (Employee, Attendance, Leaves, etc.) are
 * registered dynamically by their respective module providers via
 * UserRelationshipRegistry.
 *
 * Modules can extend User with dynamic relationships:
 *   $registry = app(UserRelationshipRegistry::class);
 *   $registry->registerRelationship('employee', fn($user) => $user->hasOne(Employee::class));
 *
 * Then use as normal: $user->employee
 *
 * Optional features (auto-enabled when packages installed):
 * - TwoFactorAuthenticatable: laravel/fortify
 * - InteractsWithMedia: spatie/laravel-medialibrary
 * - HasPushSubscriptions: laravel-notification-channels/webpush
 *
 * @property int $id
 * @property string $name
 * @property string|null $user_name
 * @property string $email
 * @property string|null $phone
 * @property string|null $password
 * @property bool $active
 */
class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory;
    use HasRoles;
    use Notifiable;
    use SoftDeletes;

    /**
     * The guard name for Spatie Permission
     */
    protected $guard_name = 'web';

    /**
     * The attributes that are mass assignable.
     *
     * Core authentication and profile fields only.
     * Module-specific fields should be on their respective module models.
     */
    protected $fillable = [
        // Core Identity
        'name',
        'user_name',
        'email',
        'phone',
        'password',

        // Account Status
        'active',
        'is_active',
        'account_locked_at',
        'locked_reason',
        'force_password_reset',

        // Profile basics
        'profile_image',
        'about',
        'locale',

        // Verification
        'email_verified_at',
        'phone_verified_at',
        'phone_verification_code',
        'phone_verification_sent_at',

        // OAuth / Social Login
        'oauth_provider',
        'oauth_provider_id',
        'oauth_token',
        'oauth_refresh_token',
        'oauth_token_expires_at',
        'avatar_url',

        // Device Management
        'single_device_login_enabled',
        'device_reset_at',
        'device_reset_reason',

        // Push Notifications
        'fcm_token',

        // Preferences
        'preferences',
        'notification_preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     */
    protected $hidden = [
        'password',
        'remember_token',
        'oauth_token',
        'oauth_refresh_token',
        'phone_verification_code',
        'two_factor_secret',
        'two_factor_recovery_codes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'phone_verification_sent_at' => 'datetime',
        'password' => 'hashed',
        'active' => 'boolean',
        'is_active' => 'boolean',
        'account_locked_at' => 'datetime',
        'single_device_login_enabled' => 'boolean',
        'device_reset_at' => 'datetime',
        'oauth_token_expires_at' => 'datetime',
        'preferences' => 'array',
        'notification_preferences' => 'array',
    ];

    /**
     * The accessors to append to the model's array form.
     */
    protected $appends = [
        'profile_image_url',
    ];

    // =========================================================================
    // DYNAMIC RELATIONSHIP RESOLUTION (Module Extension Point)
    // =========================================================================

    /**
     * Handle dynamic method calls for module-registered relationships.
     *
     * Modules register relationships via UserRelationshipRegistry:
     *   $registry->registerRelationship('employee', fn($user) => $user->hasOne(Employee::class));
     *
     * Then they can be used normally: $user->employee
     *
     * @param  string  $method
     * @param  array  $parameters
     * @return mixed
     */
    public function __call($method, $parameters)
    {
        // Check if this is a dynamically registered relationship
        $registry = app(UserRelationshipRegistry::class);

        if ($registry->hasRelationship($method)) {
            $callback = $registry->getRelationship($method);

            return $callback($this);
        }

        // Fall back to parent (handles scopes, etc.)
        return parent::__call($method, $parameters);
    }

    /**
     * Handle dynamic scope calls from modules.
     *
     * Usage: User::dynamic('withEmployeeRelations')->get()
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  mixed  ...$parameters
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeDynamic($query, string $scopeName, ...$parameters)
    {
        $registry = app(UserRelationshipRegistry::class);

        if ($registry->hasScope($scopeName)) {
            $callback = $registry->getScope($scopeName);

            return $callback($query, ...$parameters);
        }

        return $query;
    }

    /**
     * Check if a dynamic relationship is available.
     */
    public function hasDynamicRelationship(string $name): bool
    {
        return app(UserRelationshipRegistry::class)->hasRelationship($name);
    }

    /**
     * Get available dynamic relationships.
     */
    public function getDynamicRelationships(): array
    {
        return app(UserRelationshipRegistry::class)->getRelationshipNames();
    }

    // =========================================================================
    // QUERY SCOPES (Core Only)
    // =========================================================================

    /**
     * Load core relations for user management.
     */
    public function scopeWithCoreRelations($query)
    {
        return $query->with([
            'roles:id,name',
            'currentDevice:id,user_id,device_name,device_type,last_used_at,is_active',
        ]);
    }

    /**
     * Load device information.
     */
    public function scopeWithDeviceInfo($query)
    {
        return $query->with([
            'currentDevice:id,user_id,device_name,device_type,last_used_at,is_active',
        ]);
    }

    /**
     * Active users only.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Inactive users only.
     */
    public function scopeInactive($query)
    {
        return $query->where('active', false);
    }

    // =========================================================================
    // ACCOUNT STATUS MANAGEMENT
    // =========================================================================

    /**
     * Set active status (with soft delete handling).
     */
    public function setActiveStatus(bool $status): void
    {
        if ($status) {
            if ($this->trashed()) {
                $this->restore();
            }
            $this->active = true;
        } else {
            $this->active = false;
            $this->delete();
        }
        $this->save();
    }

    /**
     * Lock the user account.
     */
    public function lockAccount(?string $reason = null): bool
    {
        return $this->update([
            'account_locked_at' => now(),
            'locked_reason' => $reason,
        ]);
    }

    /**
     * Unlock the user account.
     */
    public function unlockAccount(): bool
    {
        return $this->update([
            'account_locked_at' => null,
            'locked_reason' => null,
        ]);
    }

    /**
     * Check if account is locked.
     */
    public function isLocked(): bool
    {
        return $this->account_locked_at !== null;
    }

    // =========================================================================
    // DEVICE MANAGEMENT
    // =========================================================================

    /**
     * Get the user's devices.
     */
    public function devices(): HasMany
    {
        return $this->hasMany(UserDevice::class);
    }

    /**
     * Get the user's active devices.
     */
    public function activeDevices(): HasMany
    {
        return $this->hasMany(UserDevice::class)->where('is_active', true);
    }

    /**
     * Get the current active device.
     */
    public function currentDevice(): HasOne
    {
        return $this->hasOne(UserDevice::class)
            ->where('is_active', true)
            ->latest('last_used_at');
    }

    /**
     * Alias for currentDevice (compatibility).
     */
    public function activeDevice(): HasOne
    {
        return $this->currentDevice();
    }

    /**
     * Check if single device login is enabled.
     */
    public function hasSingleDeviceLoginEnabled(): bool
    {
        return (bool) $this->single_device_login_enabled;
    }

    /**
     * Accessor for single_device_login (frontend compatibility).
     */
    public function getSingleDeviceLoginAttribute(): bool
    {
        return $this->single_device_login_enabled ?? false;
    }

    /**
     * Enable single device login.
     */
    public function enableSingleDeviceLogin(?string $reason = null): bool
    {
        return $this->update([
            'single_device_login_enabled' => true,
            'device_reset_reason' => $reason,
        ]);
    }

    /**
     * Disable single device login.
     */
    public function disableSingleDeviceLogin(?string $reason = null): bool
    {
        return $this->update([
            'single_device_login_enabled' => false,
            'device_reset_reason' => $reason,
        ]);
    }

    /**
     * Reset user devices (admin action).
     */
    public function resetDevices(?string $reason = null): bool
    {
        $this->devices()->delete();

        return $this->update([
            'device_reset_at' => now(),
            'device_reset_reason' => $reason ?: 'Admin reset',
        ]);
    }

    /**
     * Check if user can login from new device.
     */
    public function canLoginFromDevice(string $deviceId): bool
    {
        if (! $this->hasSingleDeviceLoginEnabled()) {
            return true;
        }

        $existingDevice = $this->devices()
            ->where('device_id', $deviceId)
            ->where('is_active', true)
            ->first();

        if ($existingDevice) {
            return true;
        }

        return ! $this->activeDevices()->exists();
    }

    /**
     * Get device summary for display.
     */
    public function getDeviceSummary(): array
    {
        $devices = $this->devices()->orderBy('last_used_at', 'desc')->get();

        return [
            'total_devices' => $devices->count(),
            'active_devices' => $devices->where('is_active', true)->count(),
            'current_device' => $devices->where('is_active', true)->first(),
            'last_reset' => $this->device_reset_at,
            'reset_reason' => $this->device_reset_reason,
            'single_device_enabled' => $this->single_device_login_enabled,
        ];
    }

    // =========================================================================
    // PROFILE & MEDIA
    // =========================================================================

    /**
     * Get the profile image URL.
     */
    public function getProfileImageUrlAttribute(): ?string
    {
        try {
            $url = $this->getFirstMediaUrl('profile_images');

            return ! empty($url) ? $url : null;
        } catch (\Exception $e) {
            Log::warning('Failed to get profile image URL for user '.$this->id.': '.$e->getMessage());

            return null;
        }
    }

    /**
     * Register media collections.
     */
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('profile_images')
            ->singleFile();
    }

    // =========================================================================
    // MODULE ACCESS (Core RBAC)
    // =========================================================================

    /**
     * Check if user has access to a module.
     */
    public function hasModuleAccess(string $moduleCode): bool
    {
        if (! app()->bound('Aero\Core\Services\ModuleAccessService')) {
            return false;
        }

        $service = app('Aero\Core\Services\ModuleAccessService');
        $result = $service->canAccessModule($this, $moduleCode);

        return $result['allowed'] ?? false;
    }

    /**
     * Check if user has access to a submodule.
     */
    public function hasSubModuleAccess(string $moduleCode, string $subModuleCode): bool
    {
        if (! app()->bound('Aero\Core\Services\ModuleAccessService')) {
            return false;
        }

        $service = app('Aero\Core\Services\ModuleAccessService');
        $result = $service->canAccessSubModule($this, $moduleCode, $subModuleCode);

        return $result['allowed'] ?? false;
    }

    /**
     * Check if user has access to a component.
     */
    public function hasComponentAccess(string $moduleCode, string $subModuleCode, string $componentCode): bool
    {
        if (! app()->bound('Aero\Core\Services\ModuleAccessService')) {
            return false;
        }

        $service = app('Aero\Core\Services\ModuleAccessService');
        $result = $service->canAccessComponent($this, $moduleCode, $subModuleCode, $componentCode);

        return $result['allowed'] ?? false;
    }

    // =========================================================================
    // ROLE HELPER METHODS
    // =========================================================================

    /**
     * Check if the user has any of the given roles.
     */
    public function hasAnyRole($roles, $guard = null): bool
    {
        return $this->roles()->whereIn('name', (array) $roles)->exists();
    }

    /**
     * Check if user is a super admin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('Super Admin');
    }

    /**
     * Check if user is an admin (Super Admin or Admin).
     */
    public function isAdmin(): bool
    {
        return $this->hasAnyRole(['Super Admin', 'Admin']);
    }

    // =========================================================================
    // MODULE ACCESS METHODS (Core RBAC)
    // =========================================================================

    /**
     * Check if user can perform an action.
     */
    public function canPerformAction(string $moduleCode, string $subModuleCode, string $componentCode, string $actionCode): bool
    {
        if (! app()->bound('Aero\Core\Services\ModuleAccessService')) {
            return false;
        }

        $service = app('Aero\Core\Services\ModuleAccessService');
        $result = $service->canPerformAction($this, $moduleCode, $subModuleCode, $componentCode, $actionCode);

        return $result['allowed'] ?? false;
    }

    /**
     * Get user's access scope for an action.
     */
    public function getActionAccessScope(int $actionId): ?string
    {
        if (! app()->bound('Aero\Core\Services\ModuleAccessService')) {
            return null;
        }

        $service = app('Aero\Core\Services\ModuleAccessService');

        return $service->getUserAccessScope($this, $actionId);
    }

    /**
     * Get all accessible modules for this user.
     */
    public function getAccessibleModules(): array
    {
        if (! app()->bound('Aero\Core\Services\ModuleAccessService')) {
            return [];
        }

        $service = app('Aero\Core\Services\ModuleAccessService');

        return $service->getAccessibleModules($this);
    }

    /**
     * Get role module access tree (for frontend UI).
     */
    public function getModuleAccessTree(): array
    {
        if (! app()->bound('Aero\Core\Services\RoleModuleAccessService')) {
            return [
                'modules' => [],
                'sub_modules' => [],
                'components' => [],
                'actions' => [],
            ];
        }

        $roleAccessService = app('Aero\Core\Services\RoleModuleAccessService');
        $role = $this->roles->first();

        if (! $role) {
            return [
                'modules' => [],
                'sub_modules' => [],
                'components' => [],
                'actions' => [],
            ];
        }

        return $roleAccessService->getRoleAccessTree($role);
    }
}
