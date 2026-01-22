<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration for additional HRM gap-fill tables:
 * - Succession Planning
 * - Compensation History
 * - Overtime Records
 * - Promotion History
 * - Transfer History
 * - Exit Interviews
 * - Grievances
 * - Pulse Surveys
 */
return new class extends Migration
{
    public function up(): void
    {
        // Succession Plans
        if (! Schema::hasTable('succession_plans')) {
            Schema::create('succession_plans', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('position_id')->nullable();
                $table->foreignId('designation_id')->nullable()->constrained('designations')->nullOnDelete();
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->unsignedBigInteger('current_holder_id')->nullable();
                $table->string('title');
                $table->text('description')->nullable();
                $table->enum('priority', ['critical', 'high', 'medium', 'low'])->default('medium');
                $table->enum('risk_level', ['high', 'medium', 'low'])->default('medium');
                $table->enum('status', ['draft', 'active', 'on_hold', 'completed', 'cancelled'])->default('draft');
                $table->date('target_date')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'priority']);
                $table->index('department_id');
            });
        }

        // Succession Candidates
        if (! Schema::hasTable('succession_candidates')) {
            Schema::create('succession_candidates', function (Blueprint $table) {
                $table->id();
                $table->foreignId('succession_plan_id')->constrained('succession_plans')->cascadeOnDelete();
                $table->unsignedBigInteger('employee_id');
                $table->enum('readiness_level', ['ready_now', 'ready_1_year', 'ready_2_years', 'ready_3_plus', 'not_ready'])->default('ready_1_year');
                $table->enum('development_priority', ['high', 'medium', 'low'])->default('medium');
                $table->json('strengths')->nullable();
                $table->json('development_areas')->nullable();
                $table->json('development_plan')->nullable();
                $table->unsignedBigInteger('mentor_id')->nullable();
                $table->date('assessment_date')->nullable();
                $table->decimal('assessment_score', 5, 2)->nullable();
                $table->text('assessment_notes')->nullable();
                $table->enum('status', ['active', 'in_development', 'on_hold', 'promoted', 'removed'])->default('active');
                $table->unsignedBigInteger('nominated_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['succession_plan_id', 'readiness_level']);
                $table->index('employee_id');
            });
        }

        // Compensation History
        if (! Schema::hasTable('compensation_history')) {
            Schema::create('compensation_history', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->enum('change_type', ['annual_increase', 'promotion', 'market_adjustment', 'merit_increase', 'cost_of_living', 'demotion', 'correction', 'bonus'])->default('annual_increase');
                $table->decimal('previous_salary', 15, 2)->nullable();
                $table->decimal('new_salary', 15, 2);
                $table->decimal('change_amount', 15, 2)->nullable();
                $table->decimal('change_percentage', 5, 2)->nullable();
                $table->string('currency', 3)->default('USD');
                $table->string('reason')->nullable();
                $table->date('effective_date');
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->date('approval_date')->nullable();
                $table->text('notes')->nullable();
                $table->string('performance_rating')->nullable();
                $table->boolean('market_adjustment')->default(false);
                $table->unsignedBigInteger('promotion_id')->nullable();
                $table->timestamps();

                $table->index(['employee_id', 'effective_date']);
                $table->index('change_type');
            });
        }

        // Overtime Records
        if (! Schema::hasTable('overtime_records')) {
            Schema::create('overtime_records', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->date('date');
                $table->time('start_time')->nullable();
                $table->time('end_time')->nullable();
                $table->decimal('hours', 5, 2);
                $table->enum('overtime_type', ['weekday', 'weekend', 'holiday', 'night', 'emergency'])->default('weekday');
                $table->decimal('rate_multiplier', 4, 2)->default(1.5);
                $table->text('reason')->nullable();
                $table->unsignedBigInteger('project_id')->nullable();
                $table->string('task_description')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
                $table->unsignedBigInteger('requested_by')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->boolean('compensated')->default(false);
                $table->enum('compensation_type', ['monetary', 'time_off', 'both'])->nullable();
                $table->decimal('compensation_amount', 15, 2)->nullable();
                $table->unsignedBigInteger('payroll_id')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['employee_id', 'date']);
                $table->index(['status', 'compensated']);
            });
        }

        // Promotion History
        if (! Schema::hasTable('promotion_history')) {
            Schema::create('promotion_history', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->enum('promotion_type', ['vertical', 'lateral', 'dry', 'grade'])->default('vertical');
                $table->unsignedBigInteger('previous_designation_id')->nullable();
                $table->unsignedBigInteger('new_designation_id')->nullable();
                $table->unsignedBigInteger('previous_department_id')->nullable();
                $table->unsignedBigInteger('new_department_id')->nullable();
                $table->unsignedBigInteger('previous_grade_id')->nullable();
                $table->unsignedBigInteger('new_grade_id')->nullable();
                $table->decimal('previous_salary', 15, 2)->nullable();
                $table->decimal('new_salary', 15, 2)->nullable();
                $table->date('effective_date');
                $table->text('reason')->nullable();
                $table->string('performance_rating')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->date('approval_date')->nullable();
                $table->text('notes')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected', 'completed'])->default('pending');
                $table->timestamps();
                $table->softDeletes();

                $table->index(['employee_id', 'effective_date']);
                $table->index('status');
            });
        }

        // Transfer History
        if (! Schema::hasTable('transfer_history')) {
            Schema::create('transfer_history', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->enum('transfer_type', ['department', 'location', 'branch', 'international', 'project'])->default('department');
                $table->unsignedBigInteger('from_department_id')->nullable();
                $table->unsignedBigInteger('to_department_id')->nullable();
                $table->string('from_location')->nullable();
                $table->string('to_location')->nullable();
                $table->string('from_branch')->nullable();
                $table->string('to_branch')->nullable();
                $table->unsignedBigInteger('from_manager_id')->nullable();
                $table->unsignedBigInteger('to_manager_id')->nullable();
                $table->text('reason')->nullable();
                $table->date('effective_date');
                $table->date('end_date')->nullable();
                $table->boolean('is_temporary')->default(false);
                $table->unsignedBigInteger('requested_by')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->date('approval_date')->nullable();
                $table->enum('status', ['pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'])->default('pending');
                $table->text('notes')->nullable();
                $table->boolean('relocation_support')->default(false);
                $table->decimal('relocation_amount', 15, 2)->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['employee_id', 'effective_date']);
                $table->index('status');
            });
        }

        // Exit Interviews
        if (! Schema::hasTable('exit_interviews')) {
            Schema::create('exit_interviews', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->unsignedBigInteger('offboarding_id')->nullable();
                $table->date('interview_date')->nullable();
                $table->unsignedBigInteger('interviewer_id')->nullable();
                $table->enum('departure_reason', ['better_opportunity', 'compensation', 'career_growth', 'management', 'work_life_balance', 'relocation', 'personal', 'retirement', 'health', 'layoff', 'termination', 'other'])->nullable();
                $table->text('departure_reason_details')->nullable();
                $table->boolean('would_recommend')->nullable();
                $table->boolean('would_return')->nullable();
                $table->tinyInteger('overall_satisfaction')->nullable();
                $table->tinyInteger('management_rating')->nullable();
                $table->tinyInteger('work_environment_rating')->nullable();
                $table->tinyInteger('compensation_rating')->nullable();
                $table->tinyInteger('career_growth_rating')->nullable();
                $table->tinyInteger('work_life_balance_rating')->nullable();
                $table->tinyInteger('team_collaboration_rating')->nullable();
                $table->text('liked_most')->nullable();
                $table->text('liked_least')->nullable();
                $table->json('improvement_suggestions')->nullable();
                $table->string('new_employer')->nullable();
                $table->string('new_position')->nullable();
                $table->string('new_salary_range')->nullable();
                $table->text('reason_for_new_job')->nullable();
                $table->text('exit_feedback_summary')->nullable();
                $table->text('confidential_notes')->nullable();
                $table->boolean('is_confidential')->default(true);
                $table->enum('status', ['scheduled', 'completed', 'declined', 'cancelled'])->default('scheduled');
                $table->boolean('follow_up_required')->default(false);
                $table->text('follow_up_notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index('employee_id');
                $table->index('status');
                $table->index('departure_reason');
            });
        }

        // Grievance Categories
        if (! Schema::hasTable('grievance_categories')) {
            Schema::create('grievance_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code', 10)->unique();
                $table->text('description')->nullable();
                $table->boolean('requires_investigation')->default(false);
                $table->string('default_priority')->default('medium');
                $table->integer('escalation_days')->default(7);
                $table->boolean('is_active')->default(true);
                $table->integer('display_order')->default(0);
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Grievances
        if (! Schema::hasTable('grievances')) {
            Schema::create('grievances', function (Blueprint $table) {
                $table->id();
                $table->string('grievance_number')->unique();
                $table->unsignedBigInteger('employee_id');
                $table->foreignId('category_id')->nullable()->constrained('grievance_categories')->nullOnDelete();
                $table->string('subject');
                $table->text('description');
                $table->enum('grievance_type', ['harassment', 'discrimination', 'workplace_safety', 'compensation', 'management', 'policy', 'workload', 'interpersonal', 'other'])->default('other');
                $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('medium');
                $table->unsignedBigInteger('against_employee_id')->nullable();
                $table->unsignedBigInteger('against_department_id')->nullable();
                $table->date('incident_date')->nullable();
                $table->string('incident_location')->nullable();
                $table->json('witnesses')->nullable();
                $table->json('supporting_documents')->nullable();
                $table->text('desired_resolution')->nullable();
                $table->enum('status', ['submitted', 'under_review', 'investigating', 'pending_resolution', 'resolved', 'closed', 'appealed', 'withdrawn'])->default('submitted');
                $table->unsignedBigInteger('assigned_to')->nullable();
                $table->timestamp('assigned_at')->nullable();
                $table->text('investigation_notes')->nullable();
                $table->text('resolution')->nullable();
                $table->date('resolution_date')->nullable();
                $table->unsignedBigInteger('resolved_by')->nullable();
                $table->tinyInteger('employee_satisfaction')->nullable();
                $table->enum('appeal_status', ['none', 'pending', 'approved', 'rejected'])->default('none');
                $table->text('appeal_notes')->nullable();
                $table->boolean('is_anonymous')->default(false);
                $table->boolean('is_confidential')->default(false);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'severity']);
                $table->index('employee_id');
                $table->index('assigned_to');
            });
        }

        // Grievance Notes
        if (! Schema::hasTable('grievance_notes')) {
            Schema::create('grievance_notes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('grievance_id')->constrained('grievances')->cascadeOnDelete();
                $table->unsignedBigInteger('user_id');
                $table->enum('note_type', ['update', 'investigation', 'resolution', 'escalation', 'communication'])->default('update');
                $table->text('content');
                $table->boolean('is_internal')->default(true);
                $table->json('attachments')->nullable();
                $table->timestamps();

                $table->index(['grievance_id', 'note_type']);
            });
        }

        // Pulse Surveys
        if (! Schema::hasTable('pulse_surveys')) {
            Schema::create('pulse_surveys', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->json('questions');
                $table->enum('frequency', ['weekly', 'biweekly', 'monthly', 'one_time'])->default('monthly');
                $table->json('target_departments')->nullable();
                $table->json('target_designations')->nullable();
                $table->boolean('is_anonymous')->default(true);
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->enum('status', ['draft', 'active', 'paused', 'completed', 'cancelled'])->default('draft');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->integer('response_count')->default(0);
                $table->decimal('completion_rate', 5, 2)->default(0);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'start_date']);
            });
        }

        // Pulse Survey Responses
        if (! Schema::hasTable('pulse_survey_responses')) {
            Schema::create('pulse_survey_responses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pulse_survey_id')->constrained('pulse_surveys')->cascadeOnDelete();
                $table->unsignedBigInteger('employee_id')->nullable(); // Nullable for anonymous
                $table->json('responses');
                $table->decimal('overall_score', 4, 2)->nullable();
                $table->enum('sentiment', ['positive', 'neutral', 'negative'])->nullable();
                $table->text('comments')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->boolean('is_complete')->default(false);
                $table->timestamps();

                $table->index(['pulse_survey_id', 'employee_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pulse_survey_responses');
        Schema::dropIfExists('pulse_surveys');
        Schema::dropIfExists('grievance_notes');
        Schema::dropIfExists('grievances');
        Schema::dropIfExists('grievance_categories');
        Schema::dropIfExists('exit_interviews');
        Schema::dropIfExists('transfer_history');
        Schema::dropIfExists('promotion_history');
        Schema::dropIfExists('overtime_records');
        Schema::dropIfExists('compensation_history');
        Schema::dropIfExists('succession_candidates');
        Schema::dropIfExists('succession_plans');
    }
};
