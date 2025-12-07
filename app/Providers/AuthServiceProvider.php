<?php

namespace App\Providers;

use App\Models\Tenant\HRM\Benefit;
use App\Models\Tenant\HRM\Competency;
use App\Models\Tenant\DMS\DocumentCategory;
use App\Models\Tenant\HRM\Attendance;
use App\Models\Tenant\HRM\Department;
use App\Models\Tenant\HRM\Designation;
use App\Models\Tenant\HRM\HrDocument;
use App\Models\Tenant\HRM\Job;
use App\Models\Tenant\HRM\Leave;
use App\Models\Tenant\HRM\Offboarding;
use App\Models\Tenant\HRM\Onboarding;
use App\Models\Tenant\HRM\Payroll;
use App\Models\Tenant\HRM\SafetyIncident;
use App\Models\Tenant\HRM\SafetyInspection;
use App\Models\Tenant\HRM\SafetyTraining;
use App\Models\Tenant\HRM\Skill;
use App\Models\Shared\User;
use App\Policies\Tenant\HRM\AttendancePolicy;
use App\Policies\Tenant\HRM\BenefitPolicy;
use App\Policies\Tenant\HRM\CompetencyPolicy;
use App\Policies\Tenant\HRM\DepartmentPolicy;
use App\Policies\Tenant\HRM\DesignationPolicy;
use App\Policies\Tenant\Document\DocumentCategoryPolicy;
use App\Policies\Tenant\Document\HrDocumentPolicy;
use App\Policies\Tenant\HRM\LeavePolicy;
use App\Policies\Tenant\HRM\OffboardingPolicy;
use App\Policies\Tenant\HRM\OnboardingPolicy;
use App\Policies\Tenant\HRM\PayrollPolicy;
use App\Policies\Tenant\HRM\RecruitmentPolicy;
use App\Policies\Tenant\Safety\SafetyIncidentPolicy;
use App\Policies\Tenant\Safety\SafetyInspectionPolicy;
use App\Policies\Tenant\Safety\SafetyTrainingPolicy;
use App\Policies\Tenant\HRM\SkillPolicy;
use App\Policies\Shared\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class,
        Onboarding::class => OnboardingPolicy::class,
        Offboarding::class => OffboardingPolicy::class,
        HrDocument::class => HrDocumentPolicy::class,
        Skill::class => SkillPolicy::class,
        Competency::class => CompetencyPolicy::class,
        Benefit::class => BenefitPolicy::class,
        SafetyIncident::class => SafetyIncidentPolicy::class,
        SafetyInspection::class => SafetyInspectionPolicy::class,
        SafetyTraining::class => SafetyTrainingPolicy::class,
        DocumentCategory::class => DocumentCategoryPolicy::class,
        Attendance::class => AttendancePolicy::class,
        Leave::class => LeavePolicy::class,
        Payroll::class => PayrollPolicy::class,
        Department::class => DepartmentPolicy::class,
        Designation::class => DesignationPolicy::class,
        Job::class => RecruitmentPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        // Register policies
        $this->registerPolicies();

        // Define implicit permissions based on roles
        Gate::before(function ($user, $ability) {
            // Super Admin can do everything
            if ($user->hasRole('Super Administrator')) {
                return true;
            }

            return null; // Fall through to other authorization checks
        });
    }
}
