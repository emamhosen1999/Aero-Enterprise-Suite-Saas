<?php

namespace App\Models\Shared;

use App\Models\Tenant\HRM\Attendance;
use App\Models\Tenant\HRM\AttendanceType;
use App\Models\Tenant\HRM\Department;
use App\Models\Tenant\HRM\Designation;
use App\Models\Tenant\HRM\Employee;
use App\Models\Tenant\HRM\Leave;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use Laravel\Fortify\TwoFactorAuthenticatable;
use NotificationChannels\WebPush\HasPushSubscriptions;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

/**
 * User Model - Authentication & Account Only
 *
 * This model handles ONLY authentication-related data:
 * - Login credentials (email, password, OAuth)
 * - Two-factor authentication
 * - Device management
 * - Account status (active, locked)
 * - Roles & permissions
 *
 * Employment data is in the Employee model (App\Models\HRM\Employee):
 * - Department, Designation
 * - Salary, Employment type
 * - Joining date, Employee code
 *
 * Flow:
 * 1. User is created (can be invited or registered)
 * 2. User can be onboarded as Employee (creates Employee record)
 * 3. A User can exist without Employee (admin, external user)
 * 4. An Employee MUST have a User for authentication
 *
 * @property int $id
 * @property string $name
 * @property string|null $user_name
 * @property string $email
 * @property string|null $phone
 * @property string|null $password
 * @property bool $active
 * @property-read Employee|null $employee
 */
class User extends Authenticatable implements HasMedia, MustVerifyEmail
{
    use HasFactory, HasPushSubscriptions, InteractsWithMedia, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * Authentication-only fields. Employment data goes in Employee model.
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

        // Profile basics (kept on User for display)
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

        // Attendance config (user-level setting for which type)
        'attendance_type_id',
        'attendance_config',
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
        'attendance_type_id' => 'integer',
        'attendance_config' => 'array',
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
    // EMPLOYEE RELATIONSHIP (Primary connection to employment data)
    // =========================================================================

    /**
     * Get the employee record for this user.
     *
     * A user may or may not have an employee record.
     * Employee record contains: department, designation, salary, dates, etc.
     */
    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    /**
     * Check if this user has an employee record.
     */
    public function isEmployee(): bool
    {
        return $this->employee()->exists();
    }

    /**
     * Get the department through the employee relationship.
     *
     * Allows: User::with('department')->get()
     */
    public function department(): HasOneThrough
    {
        return $this->hasOneThrough(
            Department::class,
            Employee::class,
            'user_id',        // FK on employees table
            'id',             // FK on departments table
            'id',             // Local key on users table
            'department_id'   // Local key on employees table
        );
    }

    /**
     * Get the designation through the employee relationship.
     *
     * Allows: User::with('designation')->get()
     */
    public function designation(): HasOneThrough
    {
        return $this->hasOneThrough(
            Designation::class,
            Employee::class,
            'user_id',         // FK on employees table
            'id',              // FK on designations table
            'id',              // Local key on users table
            'designation_id'   // Local key on employees table
        );
    }

    /**
     * Get the roles for the user.
     */
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'model_has_roles', 'model_id', 'role_id')
            ->where('model_type', self::class);
    }

    // =========================================================================
    // QUERY SCOPES
    // =========================================================================

    /**
     * Load basic relations for user management.
     */
    public function scopeWithBasicRelations($query)
    {
        return $query->with([
            'roles:id,name',
            'employee:id,user_id,department_id,designation_id,status',
            'employee.department:id,name',
            'employee.designation:id,title',
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
     * Load full relations for detailed views.
     */
    public function scopeWithFullRelations($query)
    {
        return $query->with([
            'roles',
            'employee',
            'employee.department',
            'employee.designation',
            'attendanceType',
            'currentDevice',
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

    /**
     * Users who are employees.
     */
    public function scopeEmployees($query)
    {
        return $query->whereHas('employee');
    }

    /**
     * Users who are not employees (admins, external users).
     */
    public function scopeNonEmployees($query)
    {
        return $query->whereDoesntHave('employee');
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

    // =========================================================================
    // HRM RELATIONSHIPS (linked via user_id for HRM operations)
    // =========================================================================

    /**
     * Get leave records for this user.
     */
    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class, 'user_id');
    }

    /**
     * Get attendance records for this user.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'user_id');
    }

    /**
     * Get the attendance type assigned to this user.
     */
    public function attendanceType()
    {
        return $this->belongsTo(AttendanceType::class, 'attendance_type_id');
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
    public function activeDevices()
    {
        return $this->hasMany(UserDevice::class)->active();
    }

    /**
     * Get the current active device.
     */
    public function currentDevice()
    {
        return $this->hasOne(UserDevice::class)->active()->latest('last_used_at');
    }

    /**
     * Alias for currentDevice (compatibility).
     */
    public function activeDevice()
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
        return $this->single_device_login_enabled;
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
            ->active()
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
    // PROJECT RELATIONSHIPS (kept for project management module)
    // =========================================================================

    public function ledProjects()
    {
        return $this->hasMany(Project::class, 'project_leader_id');
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_user');
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

    // =========================================================================
    // MODULE ACCESS (for RBAC system)
    // =========================================================================

    /**
     * Check if user has access to a module.
     */
    public function hasModuleAccess(string $moduleCode): bool
    {
        $service = app(\App\Services\Module\ModuleAccessService::class);
        $result = $service->canAccessModule($this, $moduleCode);

        return $result['allowed'];
    }

    /**
     * Check if user has access to a submodule.
     */
    public function hasSubModuleAccess(string $moduleCode, string $subModuleCode): bool
    {
        $service = app(\App\Services\Module\ModuleAccessService::class);
        $result = $service->canAccessSubModule($this, $moduleCode, $subModuleCode);

        return $result['allowed'];
    }

    /**
     * Check if user has access to a component.
     */
    public function hasComponentAccess(string $moduleCode, string $subModuleCode, string $componentCode): bool
    {
        $service = app(\App\Services\Module\ModuleAccessService::class);
        $result = $service->canAccessComponent($this, $moduleCode, $subModuleCode, $componentCode);

        return $result['allowed'];
    }

    // =========================================================================
    // ROLE HELPER METHODS
    // =========================================================================

    /**
     * Check if the user has a specific role.
     */
    public function hasRole($role, $guard = null): bool
    {
        if (is_string($role)) {
            return $this->roles()->where('name', $role)->exists();
        }

        if (is_array($role)) {
            return $this->roles()->whereIn('name', $role)->exists();
        }

        return false;
    }

    /**
     * Check if the user has any of the given roles.
     */
    public function hasAnyRole($roles, $guard = null): bool
    {
        return $this->roles()->whereIn('name', (array) $roles)->exists();
    }

    // =========================================================================
    // MODULE ACCESS METHODS
    // =========================================================================

    /**
     * Check if user can perform an action.
     */
    public function canPerformAction(string $moduleCode, string $subModuleCode, string $componentCode, string $actionCode): bool
    {
        $service = app(\App\Services\Module\ModuleAccessService::class);
        $result = $service->canPerformAction($this, $moduleCode, $subModuleCode, $componentCode, $actionCode);

        return $result['allowed'];
    }

    /**
     * Get user's access scope for an action.
     */
    public function getActionAccessScope(int $actionId): ?string
    {
        $service = app(\App\Services\Module\ModuleAccessService::class);

        return $service->getUserAccessScope($this, $actionId);
    }

    /**
     * Get all accessible modules for this user.
     */
    public function getAccessibleModules(): array
    {
        $service = app(\App\Services\Module\ModuleAccessService::class);

        return $service->getAccessibleModules($this);
    }

    /**
     * Get role module access tree (for frontend UI).
     */
    public function getModuleAccessTree(): array
    {
        $roleAccessService = app(\App\Services\Module\RoleModuleAccessService::class);
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
