<?php

namespace Aero\HRM\Models;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Employee Model
 *
 * Contains all employment-specific information separate from authentication.
 * This is the central model for the Employee Information System (EIS).
 *
 * Architecture:
 * - User: Authentication/login data only (email, password, OAuth, 2FA)
 * - Employee: Employment data (department, designation, salary, profile info)
 *
 * Flow:
 * 1. User is created (invited or registered)
 * 2. User is onboarded as Employee (Employee record created)
 * 3. Employee profile data (addresses, education, bank) linked to Employee
 *
 * A User can exist without being an Employee (admin, external user)
 * An Employee MUST have a User account for authentication.
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $department_id
 * @property int|null $designation_id
 * @property int|null $manager_id
 * @property string $employee_code
 * @property \Carbon\Carbon $date_of_joining
 * @property \Carbon\Carbon|null $date_of_leaving
 * @property \Carbon\Carbon|null $probation_end_date
 * @property \Carbon\Carbon|null $confirmation_date
 * @property string $employment_type
 * @property string $status
 * @property float $basic_salary
 * @property string|null $work_location
 * @property string|null $shift
 * @property string|null $notes
 *
 * Personal Info (moved from User):
 * @property \Carbon\Carbon|null $birthday
 * @property string|null $gender
 * @property string|null $nationality
 * @property string|null $religion
 * @property string|null $marital_status
 * @property string|null $blood_group
 */
class Employee extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The table associated with the model.
     */
    protected $table = 'employees';

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        // Core linkage
        'user_id',
        'department_id',
        'designation_id',
        'manager_id',

        // Employee identifiers
        'employee_code',

        // Employment dates
        'date_of_joining',
        'date_of_leaving',
        'probation_end_date',
        'confirmation_date',

        // Employment details
        'employment_type',
        'status',
        'basic_salary',
        'work_location',
        'shift',

        // Personal info (employee-specific, not auth)
        'birthday',
        'gender',
        'nationality',
        'religion',
        'marital_status',
        'blood_group',

        // Identity documents
        'passport_no',
        'passport_exp_date',

        // Spouse info (if married)
        'employment_of_spouse',
        'number_of_children',

        // Notes
        'notes',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'date_of_joining' => 'date',
            'date_of_leaving' => 'date',
            'probation_end_date' => 'date',
            'confirmation_date' => 'date',
            'birthday' => 'date',
            'passport_exp_date' => 'date',
            'basic_salary' => 'decimal:2',
            'number_of_children' => 'integer',
        ];
    }

    /**
     * Employment type options.
     */
    public const EMPLOYMENT_TYPES = [
        'full_time' => 'Full Time',
        'part_time' => 'Part Time',
        'contract' => 'Contract',
        'intern' => 'Intern',
    ];

    /**
     * Status options.
     */
    public const STATUSES = [
        'active' => 'Active',
        'on_leave' => 'On Leave',
        'resigned' => 'Resigned',
        'terminated' => 'Terminated',
        'retired' => 'Retired',
    ];

    /**
     * Gender options.
     */
    public const GENDERS = [
        'male' => 'Male',
        'female' => 'Female',
        'other' => 'Other',
    ];

    /**
     * Marital status options.
     */
    public const MARITAL_STATUSES = [
        'single' => 'Single',
        'married' => 'Married',
        'divorced' => 'Divorced',
        'widowed' => 'Widowed',
    ];

    // =========================================================================
    // CORE RELATIONSHIPS
    // =========================================================================

    /**
     * Get the user account associated with this employee.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the department this employee belongs to.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the designation/position of this employee.
     */
    public function designation(): BelongsTo
    {
        return $this->belongsTo(Designation::class);
    }

    /**
     * Get the manager (another user) this employee reports to.
     */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    /**
     * Get the manager's employee record.
     */
    public function managerEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'manager_id', 'user_id');
    }

    /**
     * Get employees who report to this employee.
     */
    public function directReports(): HasMany
    {
        return $this->hasMany(Employee::class, 'manager_id', 'user_id');
    }

    // =========================================================================
    // HRM OPERATIONS (linked via user_id for backward compatibility)
    // =========================================================================

    /**
     * Get attendance records for this employee.
     */
    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class, 'user_id', 'user_id');
    }

    /**
     * Get leave records for this employee.
     */
    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class, 'user_id', 'user_id');
    }

    /**
     * Get salary structure for this employee.
     */
    public function salaryStructure(): HasMany
    {
        return $this->hasMany(EmployeeSalaryStructure::class, 'user_id', 'user_id');
    }

    // =========================================================================
    // EMPLOYEE PROFILE RELATIONSHIPS
    // =========================================================================

    /**
     * Get the employee's bank details (1:1).
     */
    public function bankDetail(): HasOne
    {
        return $this->hasOne(EmployeeBankDetail::class, 'user_id', 'user_id');
    }

    /**
     * Get the employee's personal documents (1:Many).
     */
    public function personalDocuments(): HasMany
    {
        return $this->hasMany(EmployeePersonalDocument::class, 'user_id', 'user_id');
    }

    /**
     * Get the employee's emergency contacts (1:Many).
     */
    public function emergencyContacts(): HasMany
    {
        return $this->hasMany(EmergencyContact::class, 'user_id', 'user_id')->orderBy('priority');
    }

    /**
     * Get the employee's primary emergency contact.
     */
    public function primaryEmergencyContact(): HasOne
    {
        return $this->hasOne(EmergencyContact::class, 'user_id', 'user_id')->where('is_primary', true);
    }

    /**
     * Get the employee's addresses (1:Many).
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(EmployeeAddress::class, 'user_id', 'user_id');
    }

    /**
     * Get the employee's current address.
     */
    public function currentAddress(): HasOne
    {
        return $this->hasOne(EmployeeAddress::class, 'user_id', 'user_id')->where('address_type', 'current');
    }

    /**
     * Get the employee's permanent address.
     */
    public function permanentAddress(): HasOne
    {
        return $this->hasOne(EmployeeAddress::class, 'user_id', 'user_id')->where('address_type', 'permanent');
    }

    /**
     * Get the employee's education records (1:Many).
     */
    public function education(): HasMany
    {
        return $this->hasMany(EmployeeEducation::class, 'user_id', 'user_id')->latest('end_date');
    }

    /**
     * Get the employee's work experience records (1:Many).
     */
    public function workExperience(): HasMany
    {
        return $this->hasMany(EmployeeWorkExperience::class, 'user_id', 'user_id')->latest('end_date');
    }

    /**
     * Get the employee's certifications (1:Many).
     */
    public function certifications(): HasMany
    {
        return $this->hasMany(EmployeeCertification::class, 'user_id', 'user_id');
    }

    /**
     * Get the employee's valid certifications.
     */
    public function validCertifications(): HasMany
    {
        return $this->hasMany(EmployeeCertification::class, 'user_id', 'user_id')
            ->where(function ($query) {
                $query->whereNull('expiry_date')
                    ->orWhere('expiry_date', '>', now());
            });
    }

    /**
     * Get the employee's dependents (1:Many).
     */
    public function dependents(): HasMany
    {
        return $this->hasMany(EmployeeDependent::class, 'user_id', 'user_id');
    }

    /**
     * Get the employee's beneficiaries (dependents marked as beneficiary).
     */
    public function beneficiaries(): HasMany
    {
        return $this->hasMany(EmployeeDependent::class, 'user_id', 'user_id')->where('is_beneficiary', true);
    }

    // =========================================================================
    // ACCESSORS & HELPERS
    // =========================================================================

    /**
     * Get the full name from the associated user.
     */
    public function getNameAttribute(): string
    {
        return $this->user?->name ?? 'Unknown';
    }

    /**
     * Get the email from the associated user.
     */
    public function getEmailAttribute(): string
    {
        return $this->user?->email ?? '';
    }

    /**
     * Get the phone from the associated user.
     */
    public function getPhoneAttribute(): ?string
    {
        return $this->user?->phone;
    }

    /**
     * Get profile image URL from the associated user.
     */
    public function getProfileImageUrlAttribute(): ?string
    {
        return $this->user?->profile_image_url;
    }

    /**
     * Check if employee is currently active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if employee is on probation.
     */
    public function isOnProbation(): bool
    {
        if (! $this->probation_end_date) {
            return false;
        }

        return $this->probation_end_date->isFuture();
    }

    /**
     * Check if employee is confirmed.
     */
    public function isConfirmed(): bool
    {
        return $this->confirmation_date !== null;
    }

    /**
     * Get tenure in days.
     */
    public function getTenureDaysAttribute(): int
    {
        $endDate = $this->date_of_leaving ?? now();

        return $this->date_of_joining ? $this->date_of_joining->diffInDays($endDate) : 0;
    }

    /**
     * Get tenure in years and months (formatted).
     */
    public function getTenureFormattedAttribute(): string
    {
        if (! $this->date_of_joining) {
            return 'N/A';
        }

        $endDate = $this->date_of_leaving ?? now();
        $years = $this->date_of_joining->diffInYears($endDate);
        $months = $this->date_of_joining->copy()->addYears($years)->diffInMonths($endDate);

        if ($years > 0 && $months > 0) {
            return "{$years}y {$months}m";
        } elseif ($years > 0) {
            return "{$years} year(s)";
        } elseif ($months > 0) {
            return "{$months} month(s)";
        }

        return 'Less than a month';
    }

    /**
     * Get age from birthday.
     */
    public function getAgeAttribute(): ?int
    {
        return $this->birthday?->age;
    }

    /**
     * Get formatted employment type.
     */
    public function getEmploymentTypeLabelAttribute(): string
    {
        return self::EMPLOYMENT_TYPES[$this->employment_type] ?? $this->employment_type;
    }

    /**
     * Get formatted status.
     */
    public function getStatusLabelAttribute(): string
    {
        return self::STATUSES[$this->status] ?? $this->status;
    }

    /**
     * Get formatted gender.
     */
    public function getGenderLabelAttribute(): string
    {
        return self::GENDERS[$this->gender] ?? $this->gender ?? 'Not specified';
    }

    /**
     * Get formatted marital status.
     */
    public function getMaritalStatusLabelAttribute(): string
    {
        return self::MARITAL_STATUSES[$this->marital_status] ?? $this->marital_status ?? 'Not specified';
    }

    // =========================================================================
    // SCOPES
    // =========================================================================

    /**
     * Scope to only active employees.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to employees in a specific department.
     */
    public function scopeInDepartment($query, $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    /**
     * Scope to employees with a specific designation.
     */
    public function scopeWithDesignation($query, $designationId)
    {
        return $query->where('designation_id', $designationId);
    }

    /**
     * Scope to employees who joined in a date range.
     */
    public function scopeJoinedBetween($query, $startDate, $endDate)
    {
        return $query->whereBetween('date_of_joining', [$startDate, $endDate]);
    }

    /**
     * Scope to employees on probation.
     */
    public function scopeOnProbation($query)
    {
        return $query->where('probation_end_date', '>', now());
    }

    /**
     * Scope to confirmed employees.
     */
    public function scopeConfirmed($query)
    {
        return $query->whereNotNull('confirmation_date');
    }

    /**
     * Scope with full profile relations.
     */
    public function scopeWithFullProfile($query)
    {
        return $query->with([
            'user:id,name,email,phone,profile_image',
            'department:id,name',
            'designation:id,title',
            'manager:id,name',
            'addresses',
            'emergencyContacts',
            'bankDetail',
        ]);
    }

    /**
     * Scope with basic relations for list views.
     */
    public function scopeWithBasicRelations($query)
    {
        return $query->with([
            'user:id,name,email,phone',
            'department:id,name',
            'designation:id,title',
        ]);
    }

    // =========================================================================
    // STATIC HELPERS
    // =========================================================================

    /**
     * Generate a unique employee code.
     */
    public static function generateEmployeeCode(string $prefix = 'EMP'): string
    {
        $lastEmployee = static::withTrashed()
            ->where('employee_code', 'like', $prefix.'%')
            ->orderBy('employee_code', 'desc')
            ->first();

        if ($lastEmployee) {
            $lastNumber = (int) substr($lastEmployee->employee_code, strlen($prefix));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return $prefix.str_pad((string) $newNumber, 5, '0', STR_PAD_LEFT);
    }

    /**
     * Onboard a user as an employee.
     *
     * @param  User  $user  The user to onboard
     * @param  array  $data  Employment data (department_id, designation_id, etc.)
     * @return Employee The created employee record
     */
    public static function onboardUser(User $user, array $data): Employee
    {
        $data['user_id'] = $user->id;
        $data['employee_code'] = $data['employee_code'] ?? static::generateEmployeeCode();
        $data['date_of_joining'] = $data['date_of_joining'] ?? now();
        $data['status'] = $data['status'] ?? 'active';
        $data['employment_type'] = $data['employment_type'] ?? 'full_time';

        return static::create($data);
    }
}
