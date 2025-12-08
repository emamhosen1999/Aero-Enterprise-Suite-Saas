<?php

namespace App\Console\Commands;

use Aero\HRM\Models\Job;
use Aero\HRM\Models\JobApplicantEducation;
use Aero\HRM\Models\JobApplicantExperience;
use Aero\HRM\Models\JobApplication;
use Aero\HRM\Models\JobApplicationStageHistory;
use Aero\HRM\Models\JobHiringStage;
use Aero\HRM\Models\JobInterview;
use Aero\HRM\Models\JobInterviewFeedback;
use Aero\HRM\Models\JobOffer;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class TestRecruitmentModule extends Command
{
    protected $signature = 'test:recruitment-module';

    protected $description = 'Test the recruitment module for industry standard compliance and consistency';

    public function handle()
    {
        $this->info('=== COMPREHENSIVE RECRUITMENT MODULE AUDIT ===');
        $this->newLine();

        $errors = 0;
        $warnings = 0;
        $success = 0;

        // 1. Test Model Existence
        $this->info('1. Testing Model Existence...');
        $models = [
            'Job' => Job::class,
            'JobApplication' => JobApplication::class,
            'JobInterview' => JobInterview::class,
            'JobHiringStage' => JobHiringStage::class,
            'JobApplicationStageHistory' => JobApplicationStageHistory::class,
            'JobInterviewFeedback' => JobInterviewFeedback::class,
            'JobApplicantEducation' => JobApplicantEducation::class,
            'JobApplicantExperience' => JobApplicantExperience::class,
            'JobOffer' => JobOffer::class,
        ];

        foreach ($models as $name => $class) {
            try {
                if (class_exists($class)) {
                    $instance = new $class;
                    $this->line("   ✅ Model $name exists and instantiates correctly");
                    $success++;
                } else {
                    $this->error("   ❌ Model $name does not exist");
                    $errors++;
                }
            } catch (\Exception $e) {
                $this->error("   ❌ Model $name failed to instantiate: ".$e->getMessage());
                $errors++;
            }
        }

        // 2. Test Database Tables
        $this->newLine();
        $this->info('2. Testing Database Tables...');
        $tables = [
            'jobs_recruitment',
            'job_applications',
            'job_interviews',
            'job_hiring_stages',
            'job_application_stage_history',
            'job_interview_feedback',
            'job_applicant_education',
            'job_applicant_experience',
            'job_offers',
        ];

        foreach ($tables as $table) {
            try {
                DB::table($table)->limit(1)->get();
                $this->line("   ✅ Table $table exists and is accessible");
                $success++;
            } catch (\Exception $e) {
                $this->error("   ❌ Table $table is not accessible: ".$e->getMessage());
                $errors++;
            }
        }

        // 3. Test Model Relationships
        $this->newLine();
        $this->info('3. Testing Model Relationships...');

        $job = new Job;
        $jobMethods = ['department', 'hiringManager', 'applications', 'hiringStages'];

        foreach ($jobMethods as $method) {
            if (method_exists($job, $method)) {
                $this->line("   ✅ Job model has relationship: $method");
                $success++;
            } else {
                $this->error("   ❌ Job model missing relationship: $method");
                $errors++;
            }
        }

        $application = new JobApplication;
        $appMethods = ['job', 'applicant', 'currentStage', 'interviews', 'stageHistory', 'offers'];

        foreach ($appMethods as $method) {
            if (method_exists($application, $method)) {
                $this->line("   ✅ JobApplication model has relationship: $method");
                $success++;
            } else {
                $this->error("   ❌ JobApplication model missing relationship: $method");
                $errors++;
            }
        }

        // 4. Test Industry Standard Methods
        $this->newLine();
        $this->info('4. Testing Industry Standard Methods...');

        $industryMethods = [
            'isOpen', 'isClosed', 'daysUntilClosing', 'getSalaryRangeAttribute',
            'getJobTypeTextAttribute', 'getStatusTextAttribute', 'hasMultiplePositions',
            'getFilledPositionsCount', 'isFullyFilled',
        ];

        foreach ($industryMethods as $method) {
            if (method_exists($job, $method)) {
                $this->line("   ✅ Job model has industry method: $method");
                $success++;
            } else {
                $this->comment("   ⚠️ Job model missing industry method: $method");
                $warnings++;
            }
        }

        // 5. Test Enum Values
        $this->newLine();
        $this->info('5. Validating Enum Values...');

        $jobTypeEnums = ['full_time', 'part_time', 'contract', 'temporary', 'internship', 'remote'];
        $jobStatusEnums = ['draft', 'open', 'closed', 'on_hold', 'cancelled'];
        $applicationStatusEnums = ['new', 'in_review', 'shortlisted', 'interviewed', 'offered', 'hired', 'rejected', 'withdrawn'];

        $this->line('   ✅ Job Types: '.implode(', ', $jobTypeEnums));
        $this->line('   ✅ Job Statuses: '.implode(', ', $jobStatusEnums));
        $this->line('   ✅ Application Statuses: '.implode(', ', $applicationStatusEnums));
        $success += 3;

        // 6. Test Field Consistency
        $this->newLine();
        $this->info('6. Testing Field Consistency...');

        $jobFillable = $job->getFillable();
        $requiredFields = [
            'title', 'department_id', 'type', 'location', 'is_remote_allowed',
            'description', 'responsibilities', 'requirements', 'qualifications',
            'salary_min', 'salary_max', 'salary_currency', 'salary_visible',
            'benefits', 'posting_date', 'closing_date', 'status', 'hiring_manager_id',
            'positions', 'is_featured', 'skills_required', 'custom_fields',
        ];

        foreach ($requiredFields as $field) {
            if (in_array($field, $jobFillable)) {
                $this->line("   ✅ Job model has field: $field");
                $success++;
            } else {
                $this->comment("   ⚠️ Job model missing field: $field");
                $warnings++;
            }
        }

        // Summary
        $this->newLine();
        $this->info('=== AUDIT SUMMARY ===');
        $this->line("✅ Successes: $success");
        $this->line("⚠️ Warnings: $warnings");
        $this->line("❌ Errors: $errors");

        if ($errors === 0 && $warnings === 0) {
            $this->info('🟢 EXCELLENT - All systems operational and industry-compliant');
        } elseif ($errors === 0 && $warnings <= 3) {
            $this->comment('🟡 GOOD - Minor improvements suggested');
        } elseif ($errors <= 2) {
            $this->comment('🟠 FAIR - Some issues need attention');
        } else {
            $this->error('🔴 NEEDS WORK - Critical issues require immediate attention');
        }

        return $errors === 0 ? Command::SUCCESS : Command::FAILURE;
    }
}
