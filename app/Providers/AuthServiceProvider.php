<?php

namespace App\Providers;

use App\Models\Benefit;
use App\Models\Competency;
use App\Models\DocumentCategory;
use App\Models\HRM\Attendance;
use App\Models\HRM\Department;
use App\Models\HRM\Designation;
use App\Models\HRM\HrDocument;
use App\Models\HRM\Job;
use App\Models\HRM\Leave;
use App\Models\HRM\Offboarding;
use App\Models\HRM\Onboarding;
use App\Models\HRM\Payroll;
use App\Models\SafetyIncident;
use App\Models\SafetyInspection;
use App\Models\SafetyTraining;
use App\Models\Skill;
use App\Models\User;
use App\Policies\AttendancePolicy;
use App\Policies\BenefitPolicy;
use App\Policies\CompetencyPolicy;
use App\Policies\DepartmentPolicy;
use App\Policies\DesignationPolicy;
use App\Policies\DocumentCategoryPolicy;
use App\Policies\HrDocumentPolicy;
use App\Policies\LeavePolicy;
use App\Policies\OffboardingPolicy;
use App\Policies\OnboardingPolicy;
use App\Policies\PayrollPolicy;
use App\Policies\RecruitmentPolicy;
use App\Policies\SafetyIncidentPolicy;
use App\Policies\SafetyInspectionPolicy;
use App\Policies\SafetyTrainingPolicy;
use App\Policies\SkillPolicy;
use App\Policies\UserPolicy;
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
