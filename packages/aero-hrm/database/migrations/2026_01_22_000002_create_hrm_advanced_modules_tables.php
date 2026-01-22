<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration for advanced HRM modules:
 * - Career Pathing
 * - 360 Feedback
 * - Compensation Planning
 * - Workforce Planning
 */
return new class extends Migration
{
    public function up(): void
    {
        // Career Paths
        if (! Schema::hasTable('career_paths')) {
            Schema::create('career_paths', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->enum('path_type', ['technical', 'management', 'specialist', 'hybrid'])->default('technical');
                $table->integer('typical_duration_months')->nullable();
                $table->json('required_competencies')->nullable();
                $table->json('target_designations')->nullable();
                $table->boolean('is_active')->default(true);
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['is_active', 'path_type']);
                $table->index('department_id');
            });
        }

        // Career Path Milestones
        if (! Schema::hasTable('career_path_milestones')) {
            Schema::create('career_path_milestones', function (Blueprint $table) {
                $table->id();
                $table->foreignId('career_path_id')->constrained('career_paths')->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->integer('sequence_order')->default(0);
                $table->integer('expected_duration_months')->nullable();
                $table->foreignId('target_designation_id')->nullable()->constrained('designations')->nullOnDelete();
                $table->json('required_skills')->nullable();
                $table->json('required_certifications')->nullable();
                $table->json('learning_resources')->nullable();
                $table->json('success_criteria')->nullable();
                $table->timestamps();

                $table->index(['career_path_id', 'sequence_order']);
            });
        }

        // Employee Career Progressions
        if (! Schema::hasTable('employee_career_progressions')) {
            Schema::create('employee_career_progressions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->foreignId('career_path_id')->constrained('career_paths')->cascadeOnDelete();
                $table->foreignId('current_milestone_id')->nullable()->constrained('career_path_milestones')->nullOnDelete();
                $table->date('start_date');
                $table->date('target_completion_date')->nullable();
                $table->date('actual_completion_date')->nullable();
                $table->integer('progress_percentage')->default(0);
                $table->enum('status', ['active', 'on_hold', 'completed', 'abandoned'])->default('active');
                $table->json('completed_milestones')->nullable();
                $table->json('notes')->nullable();
                $table->unsignedBigInteger('assigned_by')->nullable();
                $table->unsignedBigInteger('mentor_id')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['employee_id', 'status']);
                $table->index('career_path_id');
            });
        }

        // 360 Feedback Reviews
        if (! Schema::hasTable('feedback_360_reviews')) {
            Schema::create('feedback_360_reviews', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->string('title');
                $table->text('description')->nullable();
                $table->json('competencies_to_evaluate')->nullable();
                $table->json('questions')->nullable();
                $table->boolean('self_assessment_required')->default(true);
                $table->boolean('manager_assessment_required')->default(true);
                $table->boolean('peer_assessment_required')->default(true);
                $table->boolean('direct_report_assessment_required')->default(false);
                $table->integer('min_peer_reviewers')->default(3);
                $table->integer('max_peer_reviewers')->default(5);
                $table->boolean('is_anonymous')->default(true);
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->enum('status', ['draft', 'active', 'completed', 'cancelled'])->default('draft');
                $table->decimal('overall_score', 4, 2)->nullable();
                $table->json('score_breakdown')->nullable();
                $table->text('summary_report')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['employee_id', 'status']);
                $table->index(['start_date', 'end_date']);
            });
        }

        // 360 Feedback Reviewers
        if (! Schema::hasTable('feedback_360_reviewers')) {
            Schema::create('feedback_360_reviewers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('feedback_360_id')->constrained('feedback_360_reviews')->cascadeOnDelete();
                $table->unsignedBigInteger('reviewer_id');
                $table->enum('reviewer_type', ['self', 'manager', 'peer', 'direct_report', 'external'])->default('peer');
                $table->enum('status', ['pending', 'in_progress', 'completed', 'declined'])->default('pending');
                $table->timestamp('invited_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->integer('reminder_count')->default(0);
                $table->timestamps();

                $table->unique(['feedback_360_id', 'reviewer_id']);
                $table->index(['reviewer_id', 'status']);
            });
        }

        // 360 Feedback Responses
        if (! Schema::hasTable('feedback_360_responses')) {
            Schema::create('feedback_360_responses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('feedback_360_id')->constrained('feedback_360_reviews')->cascadeOnDelete();
                $table->foreignId('reviewer_id')->constrained('feedback_360_reviewers')->cascadeOnDelete();
                $table->json('competency_ratings')->nullable();
                $table->json('question_responses')->nullable();
                $table->text('strengths')->nullable();
                $table->text('areas_for_improvement')->nullable();
                $table->text('additional_comments')->nullable();
                $table->decimal('overall_rating', 4, 2)->nullable();
                $table->boolean('is_submitted')->default(false);
                $table->timestamp('submitted_at')->nullable();
                $table->timestamps();

                $table->unique(['feedback_360_id', 'reviewer_id']);
            });
        }

        // Compensation Reviews (Planning Cycles)
        if (! Schema::hasTable('compensation_reviews')) {
            Schema::create('compensation_reviews', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->integer('cycle_year');
                $table->date('effective_date')->nullable();
                $table->decimal('budget_amount', 15, 2)->nullable();
                $table->string('budget_currency', 3)->default('USD');
                $table->decimal('utilized_amount', 15, 2)->default(0);
                $table->text('guidelines')->nullable();
                $table->decimal('merit_increase_pool_percent', 5, 2)->nullable();
                $table->decimal('promotion_pool_percent', 5, 2)->nullable();
                $table->decimal('market_adjustment_pool_percent', 5, 2)->nullable();
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->enum('status', ['draft', 'planning', 'in_progress', 'under_review', 'approved', 'completed', 'cancelled'])->default('draft');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['cycle_year', 'status']);
                $table->index('department_id');
            });
        }

        // Compensation Adjustments
        if (! Schema::hasTable('compensation_adjustments')) {
            Schema::create('compensation_adjustments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('compensation_review_id')->constrained('compensation_reviews')->cascadeOnDelete();
                $table->unsignedBigInteger('employee_id');
                $table->enum('adjustment_type', ['merit', 'promotion', 'market', 'equity', 'cost_of_living', 'bonus', 'other'])->default('merit');
                $table->decimal('current_salary', 15, 2);
                $table->decimal('proposed_salary', 15, 2);
                $table->decimal('adjustment_amount', 15, 2);
                $table->decimal('adjustment_percent', 5, 2);
                $table->string('currency', 3)->default('USD');
                $table->text('justification')->nullable();
                $table->string('performance_rating')->nullable();
                $table->decimal('compa_ratio', 5, 2)->nullable();
                $table->decimal('market_position_percentile', 5, 2)->nullable();
                $table->enum('status', ['draft', 'pending', 'manager_approved', 'hr_approved', 'approved', 'rejected'])->default('draft');
                $table->unsignedBigInteger('proposed_by')->nullable();
                $table->unsignedBigInteger('manager_approved_by')->nullable();
                $table->timestamp('manager_approved_at')->nullable();
                $table->unsignedBigInteger('hr_approved_by')->nullable();
                $table->timestamp('hr_approved_at')->nullable();
                $table->unsignedBigInteger('final_approved_by')->nullable();
                $table->timestamp('final_approved_at')->nullable();
                $table->text('rejection_reason')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['compensation_review_id', 'status']);
                $table->index('employee_id');
            });
        }

        // Workforce Plans
        if (! Schema::hasTable('workforce_plans')) {
            Schema::create('workforce_plans', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->integer('fiscal_year');
                $table->date('start_date');
                $table->date('end_date');
                $table->integer('current_headcount')->default(0);
                $table->integer('planned_headcount')->default(0);
                $table->text('objectives')->nullable();
                $table->text('assumptions')->nullable();
                $table->json('budget_breakdown')->nullable();
                $table->decimal('total_budget', 15, 2)->nullable();
                $table->string('budget_currency', 3)->default('USD');
                $table->enum('status', ['draft', 'pending_approval', 'approved', 'active', 'completed', 'archived'])->default('draft');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['fiscal_year', 'status']);
                $table->index('department_id');
            });
        }

        // Workforce Plan Positions
        if (! Schema::hasTable('workforce_plan_positions')) {
            Schema::create('workforce_plan_positions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workforce_plan_id')->constrained('workforce_plans')->cascadeOnDelete();
                $table->foreignId('designation_id')->nullable()->constrained('designations')->nullOnDelete();
                $table->string('position_title');
                $table->text('position_description')->nullable();
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->enum('position_type', ['new', 'replacement', 'conversion', 'restructure'])->default('new');
                $table->integer('quantity')->default(1);
                $table->date('target_fill_date')->nullable();
                $table->enum('priority', ['critical', 'high', 'medium', 'low'])->default('medium');
                $table->decimal('estimated_salary', 15, 2)->nullable();
                $table->string('salary_currency', 3)->default('USD');
                $table->text('justification')->nullable();
                $table->json('required_skills')->nullable();
                $table->enum('status', ['planned', 'approved', 'in_recruitment', 'filled', 'on_hold', 'cancelled'])->default('planned');
                $table->unsignedBigInteger('filled_by')->nullable();
                $table->date('filled_date')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['workforce_plan_id', 'status']);
                $table->index('target_fill_date');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('workforce_plan_positions');
        Schema::dropIfExists('workforce_plans');
        Schema::dropIfExists('compensation_adjustments');
        Schema::dropIfExists('compensation_reviews');
        Schema::dropIfExists('feedback_360_responses');
        Schema::dropIfExists('feedback_360_reviewers');
        Schema::dropIfExists('feedback_360_reviews');
        Schema::dropIfExists('employee_career_progressions');
        Schema::dropIfExists('career_path_milestones');
        Schema::dropIfExists('career_paths');
    }
};
