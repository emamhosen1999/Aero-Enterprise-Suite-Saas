<?php

namespace App\Models;

use App\Models\HRM\Attendance;
use App\Models\HRM\AttendanceType;
use App\Models\HRM\Department;
use App\Models\HRM\Designation;
use App\Models\HRM\EmergencyContact;
use App\Models\HRM\EmployeeAddress;
use App\Models\HRM\EmployeeBankDetail;
use App\Models\HRM\EmployeeCertification;
use App\Models\HRM\EmployeeDependent;
use App\Models\HRM\EmployeeEducation;
use App\Models\HRM\EmployeePersonalDocument;
use App\Models\HRM\EmployeeWorkExperience;
use App\Models\HRM\Leave;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Log;
use Laravel\Fortify\TwoFactorAuthenticatable;
use NotificationChannels\WebPush\HasPushSubscriptions;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Permission\Traits\HasRoles;

/**
 * Class User
 *
 * @method bool hasRole(string|array $roles)
 * @method bool hasAnyRole(string|array $roles)
 * @method bool hasAllRoles(array $roles)
 * @method bool hasPermissionTo(string $permission, string $guardName = null)
 */
class User extends Authenticatable implements HasMedia, MustVerifyEmail
{
    use HasFactory, HasPushSubscriptions, HasRoles, InteractsWithMedia, Notifiable, SoftDeletes, TwoFactorAuthenticatable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'employee_id',
        'user_name',
        'phone',
        'email',
        'dob',
        'address',
        'about',
        'report_to',
        'password',
        'designation_id',
        'nid',
        'name',
        'profile_image',
        'department_id',
        'date_of_joining',
        'active',
        'birthday',
        'gender',
        'passport_no',
        'passport_exp_date',
        'nationality',
        'religion',
        'marital_status',
        'employment_of_spouse',
        'number_of_children',
        'emergency_contact_primary_name',
        'emergency_contact_primary_relationship',
        'emergency_contact_primary_phone',
        'emergency_contact_secondary_name',
        'emergency_contact_secondary_relationship',
        'emergency_contact_secondary_phone',
        'bank_name',
        'bank_account_no',
        'ifsc_code',
        'pan_no',
        'family_member_name',
        'family_member_relationship',
        'family_member_dob',
        'family_member_phone',
        'education_ug_institution',
        'education_ug_degree',
        'education_ug_start_year',
        'education_ug_end_year',
        'education_pg_institution',
        'education_pg_degree',
        'education_pg_start_year',
        'education_pg_end_year',
        'experience_1_company',
        'experience_1_position',
        'experience_1_start_date',
        'experience_1_end_date',
        'experience_2_company',
        'experience_2_position',
        'experience_2_start_date',
        'experience_2_end_date',
        'experience_3_company',
        'experience_3_position',
        'experience_3_start_date',
        'experience_3_end_date',
        'salary_basis',
        'salary_amount',
        'payment_type',
        'pf_contribution',
        'pf_no',
        'employee_pf_rate',
        'additional_pf_rate',
        'total_pf_rate',
        'esi_contribution',
        'esi_no',
        'employee_esi_rate',
        'additional_esi_rate',
        'total_esi_rate',
        'email_verified_at',
        'phone_verified_at',
        'phone_verification_code',
        'phone_verification_sent_at',
        'attendance_type_id',
        'attendance_config',
        'fcm_token',
        'preferences',
        'single_device_login_enabled',
        'device_reset_at',
        'device_reset_reason',
        'locale',
        // OAuth fields
        'oauth_provider',
        'oauth_provider_id',
        'oauth_token',
        'oauth_refresh_token',
        'oauth_token_expires_at',
        'avatar_url',
        // Notification preferences
        'notification_preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'oauth_token',
        'oauth_refresh_token',
        'phone_verification_code',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'phone_verification_sent_at' => 'datetime',
        'password' => 'hashed',
        'report_to' => 'integer',
        'designation_id' => 'integer',
        'department_id' => 'integer',
        'attendance_type_id' => 'integer',
        'attendance_config' => 'array',
        'preferences' => 'array',
        'notification_preferences' => 'array',
        'active' => 'boolean',
        'single_device_login_enabled' => 'boolean',
        'device_reset_at' => 'datetime',
        'oauth_token_expires_at' => 'datetime',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'profile_image_url',
    ];

    /**
     * Query scope to load basic relations for user management.
     */
    public function scopeWithBasicRelations($query)
    {
        return $query->with([
            'department:id,name',
            'designation:id,title',
            'roles:id,name',
        ]);
    }

    /**
     * Query scope to load device information.
     */
    public function scopeWithDeviceInfo($query)
    {
        return $query->with([
            'currentDevice:id,user_id,device_name,device_type,last_used_at,is_active',
        ]);
    }

    /**
     * Query scope to load full relations for detailed views.
     */
    public function scopeWithFullRelations($query)
    {
        return $query->with([
            'department',
            'designation',
            'roles',
            'attendanceType',
            'currentDevice',
            'educations',
            'experiences',
        ]);
    }

    /**
     * Query scope for active users only.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Query scope for inactive users only.
     */
    public function scopeInactive($query)
    {
        return $query->where('active', false);
    }

    public function ledProjects()
    {
        return $this->hasMany(Project::class, 'project_leader_id');
    }

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_user');
    }

    public function experiences()
    {
        return $this->hasMany(Experience::class);
    }

    public function educations()
    {
        return $this->hasMany(Education::class);
    }

    public function setActiveStatus(bool $status)
    {
        if ($status) {
            // Restore the user if it's soft deleted
            if ($this->trashed()) {
                $this->restore();
            }
            $this->active = true;
        } else {
            // Soft delete the user and mark as inactive
            $this->active = false;
            $this->delete();
        }
        $this->save();
    }

    public function leaves()
    {
        return $this->hasMany(Leave::class, 'user_id');
    }

    // In User.php model
    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'user_id');
    }

    public function attendanceType()
    {
        return $this->belongsTo(AttendanceType::class, 'attendance_type_id');
    }

    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class, 'designation_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    /**
     * Get the user's manager (who they report to).
     */
    public function reportsTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'report_to');
    }

    /**
     * Get the users who report to this user.
     */
    public function directReports(): HasMany
    {
        return $this->hasMany(User::class, 'report_to');
    }

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
     * Get the active device (alias for currentDevice for compatibility).
     */
    public function activeDevice()
    {
        return $this->currentDevice();
    }

    /**
     * Check if single device login is enabled for this user.
     */
    public function hasSingleDeviceLoginEnabled(): bool
    {
        return (bool) $this->single_device_login_enabled;
    }

    // =========================================================================
    // EMPLOYEE PROFILE RELATIONSHIPS
    // =========================================================================

    /**
     * Get the user's bank details (1:1).
     */
    public function bankDetail(): HasOne
    {
        return $this->hasOne(EmployeeBankDetail::class);
    }

    /**
     * Get the user's personal documents (1:Many).
     */
    public function personalDocuments(): HasMany
    {
        return $this->hasMany(EmployeePersonalDocument::class);
    }

    /**
     * Get the user's emergency contacts (1:Many).
     */
    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmergencyContact::class)->ordered();
    }

    /**
     * Get the user's primary emergency contact.
     */
    public function primaryEmergencyContact(): HasOne
    {
        return $this->hasOne(EmergencyContact::class)->where('is_primary', true);
    }

    /**
     * Get the user's addresses (1:Many).
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(EmployeeAddress::class);
    }

    /**
     * Get the user's current address.
     */
    public function currentAddress(): HasOne
    {
        return $this->hasOne(EmployeeAddress::class)->where('address_type', 'current');
    }

    /**
     * Get the user's permanent address.
     */
    public function permanentAddress(): HasOne
    {
        return $this->hasOne(EmployeeAddress::class)->where('address_type', 'permanent');
    }

    /**
     * Get the user's education records (1:Many).
     */
    public function education(): HasMany
    {
        return $this->hasMany(EmployeeEducation::class)->latest('end_date');
    }

    /**
     * Get the user's work experience records (1:Many).
     */
    public function workExperience(): HasMany
    {
        return $this->hasMany(EmployeeWorkExperience::class)->latest('end_date');
    }

    /**
     * Get the user's certifications (1:Many).
     */
    public function certifications(): HasMany
    {
        return $this->hasMany(EmployeeCertification::class);
    }

    /**
     * Get the user's valid certifications.
     */
    public function validCertifications(): HasMany
    {
        return $this->hasMany(EmployeeCertification::class)->valid();
    }

    /**
     * Get the user's dependents (1:Many).
     */
    public function dependents(): HasMany
    {
        return $this->hasMany(EmployeeDependent::class);
    }

    /**
     * Get the user's beneficiaries (dependents marked as beneficiary).
     */
    public function beneficiaries(): HasMany
    {
        return $this->hasMany(EmployeeDependent::class)->beneficiaries();
    }

    /**
     * Accessor for single_device_login (for frontend compatibility).
     */
    public function getSingleDeviceLoginAttribute(): bool
    {
        return $this->single_device_login_enabled;
    }

    /**
     * Enable single device login for this user.
     */
    public function enableSingleDeviceLogin(?string $reason = null): bool
    {
        return $this->update([
            'single_device_login_enabled' => true,
            'device_reset_reason' => $reason,
        ]);
    }

    /**
     * Disable single device login for this user.
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
        // Delete all devices for complete reset
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
        // If single device login is not enabled, allow login
        if (! $this->hasSingleDeviceLoginEnabled()) {
            return true;
        }

        // Check if this device is already registered and active
        $existingDevice = $this->devices()
            ->where('device_id', $deviceId)
            ->active()
            ->first();

        if ($existingDevice) {
            return true;
        }

        // Check if user has any active devices
        $hasActiveDevices = $this->activeDevices()->exists();

        // If no active devices, allow login (first device or after reset)
        return ! $hasActiveDevices;
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

    /**
     * Get the profile image URL.
     * Uses MediaLibrary standard methods with proper exception handling.
     */
    public function getProfileImageUrlAttribute(): ?string
    {
        try {
            // Only use MediaLibrary - check if user has media in the profile_images collection
            $url = $this->getFirstMediaUrl('profile_images');

            return ! empty($url) ? $url : null;
        } catch (\Exception $e) {
            // Log the error and return null
            Log::warning('Failed to get profile image URL for user '.$this->id.': '.$e->getMessage());

            return null;
        }
    }

    /**
     * Check if user has access to a module by code.
     */
    public function hasModuleAccess(string $moduleCode): bool
    {
        $service = app(\App\Services\Module\ModuleAccessService::class);
        $result = $service->canAccessModule($this, $moduleCode);

        return $result['allowed'];
    }

    /**
     * Check if user has access to a submodule by code.
     */
    public function hasSubModuleAccess(string $moduleCode, string $subModuleCode): bool
    {
        $service = app(\App\Services\Module\ModuleAccessService::class);
        $result = $service->canAccessSubModule($this, $moduleCode, $subModuleCode);

        return $result['allowed'];
    }

    /**
     * Check if user has access to a component by code.
     */
    public function hasComponentAccess(string $moduleCode, string $subModuleCode, string $componentCode): bool
    {
        $service = app(\App\Services\Module\ModuleAccessService::class);
        $result = $service->canAccessComponent($this, $moduleCode, $subModuleCode, $componentCode);

        return $result['allowed'];
    }

    /**
     * Check if user can perform an action by code.
     */
    public function canPerformAction(string $moduleCode, string $subModuleCode, string $componentCode, string $actionCode): bool
    {
        $service = app(\App\Services\Module\ModuleAccessService::class);
        $result = $service->canPerformAction($this, $moduleCode, $subModuleCode, $componentCode, $actionCode);

        return $result['allowed'];
    }

    /**
     * Get user's access scope for an action.
     *
     * Returns: 'all', 'department', 'team', 'own', or null if no access
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
     *
     * Returns array of access at each level for user's primary role.
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
