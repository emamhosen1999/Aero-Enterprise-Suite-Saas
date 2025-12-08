<?php

namespace App\Providers;

use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\Benefit;
use Aero\HRM\Models\Competency;
use Aero\HRM\Models\Department;
use Aero\HRM\Models\Designation;
use Aero\HRM\Models\HrDocument;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\Offboarding;
use Aero\HRM\Models\Onboarding;
use Aero\HRM\Models\Payroll;
use Aero\HRM\Models\SafetyIncident;
use Aero\HRM\Models\SafetyInspection;
use Aero\HRM\Models\SafetyTraining;
use Aero\HRM\Models\Skill;
use Aero\HRM\Policies\AttendancePolicy;
use Aero\HRM\Policies\BenefitPolicy;
use Aero\HRM\Policies\CompetencyPolicy;
use Aero\HRM\Policies\DepartmentPolicy;
use Aero\HRM\Policies\DesignationPolicy;
use Aero\HRM\Policies\LeavePolicy;
use Aero\HRM\Policies\OffboardingPolicy;
use Aero\HRM\Policies\OnboardingPolicy;
use Aero\HRM\Policies\PayrollPolicy;
use Aero\HRM\Policies\RecruitmentPolicy;
use Aero\HRM\Policies\SkillPolicy;
use App\Models\Shared\User;
use App\Models\Tenant\DMS\DocumentCategory;
use App\Models\Tenant\HRM\Job;
use App\Policies\Shared\UserPolicy;
use App\Policies\Tenant\Document\DocumentCategoryPolicy;
use App\Policies\Tenant\Document\HrDocumentPolicy;
use App\Policies\Tenant\Safety\SafetyIncidentPolicy;
use App\Policies\Tenant\Safety\SafetyInspectionPolicy;
use App\Policies\Tenant\Safety\SafetyTrainingPolicy;
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
