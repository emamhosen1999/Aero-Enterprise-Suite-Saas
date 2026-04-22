<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Canonical HRM Recruitment tables migration.
 *
 * Split from: 2025_12_02_121546_create_hrm_core_tables.php (section 2.5)
 *
 * Absorbed additive migrations:
 *  - 2025_12_02_153442_create_job_types_table.php                 (domain-grouped)
 *  - 2026_01_21_000002_update_recruitment_tables.php
 *    → job_hiring_stages: sequence, required_actions, requires_approval, is_final
 *    → jobs_recruitment:  created_by
 *  - 2026_01_26_051223_add_deleted_at_to_job_hiring_stages_table.php
 *    → softDeletes() on job_hiring_stages
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── job_types ──────────────────────────────────────────────────────────
        if (! Schema::hasTable('job_types')) {
            Schema::create('job_types', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->nullable()->unique();
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── jobs_recruitment ───────────────────────────────────────────────────
        if (! Schema::hasTable('jobs_recruitment')) {
            Schema::create('jobs_recruitment', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete();
                $table->string('type')->nullable();
                $table->string('location')->nullable();
                $table->boolean('is_remote_allowed')->default(false);
                $table->text('description')->nullable();
                $table->json('responsibilities')->nullable();
                $table->json('requirements')->nullable();
                $table->json('qualifications')->nullable();
                $table->decimal('salary_min', 12, 2)->nullable();
                $table->decimal('salary_max', 12, 2)->nullable();
                $table->string('salary_currency', 3)->default('BDT');
                $table->boolean('salary_visible')->default(true);
                $table->json('benefits')->nullable();
                $table->date('posting_date')->nullable();
                $table->date('closing_date')->nullable();
                $table->string('status')->default('draft');
                $table->foreignId('hiring_manager_id')->nullable()->constrained('users')->nullOnDelete();
                $table->integer('positions')->default(1);
                $table->boolean('is_featured')->default(false);
                $table->json('skills_required')->nullable();
                $table->json('custom_fields')->nullable();

                // Absorbed from: update_recruitment_tables
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'posting_date']);
            });
        }

        // ── job_hiring_stages ──────────────────────────────────────────────────
        if (! Schema::hasTable('job_hiring_stages')) {
            Schema::create('job_hiring_stages', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_id')->constrained('jobs_recruitment')->cascadeOnDelete();
                $table->string('name');
                $table->text('description')->nullable();

                // Absorbed from: update_recruitment_tables
                $table->integer('sequence')->default(0);
                $table->json('required_actions')->nullable();
                $table->boolean('requires_approval')->default(false);
                $table->boolean('is_final')->default(false);

                // Original column (kept for backward compat; sequence is canonical)
                $table->integer('stage_order')->default(0);

                $table->boolean('is_active')->default(true);
                $table->timestamps();

                // Absorbed from: add_deleted_at_to_job_hiring_stages_table
                $table->softDeletes();

                $table->index(['job_id', 'stage_order']);
            });
        }

        // ── job_applications ───────────────────────────────────────────────────
        if (! Schema::hasTable('job_applications')) {
            Schema::create('job_applications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('job_id')->constrained('jobs_recruitment')->cascadeOnDelete();
                $table->foreignId('current_stage_id')->nullable()->constrained('job_hiring_stages')->nullOnDelete();
                $table->string('first_name');
                $table->string('last_name');
                $table->string('email');
                $table->string('phone')->nullable();
                $table->date('date_of_birth')->nullable();
                $table->text('address')->nullable();
                $table->string('city')->nullable();
                $table->string('country')->nullable();
                $table->string('resume_path')->nullable();
                $table->string('cover_letter_path')->nullable();
                $table->text('cover_letter_text')->nullable();
                $table->string('portfolio_url')->nullable();
                $table->string('linkedin_url')->nullable();
                $table->decimal('expected_salary', 12, 2)->nullable();
                $table->integer('years_of_experience')->default(0);
                $table->date('available_from')->nullable();
                $table->enum('status', ['applied', 'screening', 'shortlisted', 'interview', 'offered', 'hired', 'rejected', 'withdrawn'])->default('applied');
                $table->integer('overall_score')->nullable();
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['job_id', 'status']);
                $table->index('email');
            });
        }

        // ── job_application_stage_history ──────────────────────────────────────
        if (! Schema::hasTable('job_application_stage_history')) {
            Schema::create('job_application_stage_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('application_id')->constrained('job_applications')->cascadeOnDelete();
                $table->foreignId('from_stage_id')->nullable()->constrained('job_hiring_stages')->nullOnDelete();
                $table->foreignId('to_stage_id')->constrained('job_hiring_stages')->cascadeOnDelete();
                $table->foreignId('moved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamp('moved_at');
                $table->timestamps();

                $table->index('application_id');
            });
        }

        // ── job_interviews ─────────────────────────────────────────────────────
        if (! Schema::hasTable('job_interviews')) {
            Schema::create('job_interviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('application_id')->constrained('job_applications')->cascadeOnDelete();
                $table->string('title');
                $table->enum('interview_type', ['phone', 'video', 'in_person', 'technical', 'hr', 'final'])->default('in_person');
                $table->dateTime('scheduled_at');
                $table->integer('duration_minutes')->default(60);
                $table->string('location')->nullable();
                $table->string('meeting_link')->nullable();
                $table->text('notes')->nullable();
                $table->enum('status', ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'])->default('scheduled');
                $table->foreignId('scheduled_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['application_id', 'scheduled_at']);
            });
        }

        // ── job_interview_interviewers ─────────────────────────────────────────
        if (! Schema::hasTable('job_interview_interviewers')) {
            Schema::create('job_interview_interviewers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('interview_id')->constrained('job_interviews')->cascadeOnDelete();
                $table->foreignId('interviewer_id')->constrained('users')->cascadeOnDelete();
                $table->timestamps();

                $table->unique(['interview_id', 'interviewer_id']);
            });
        }

        // ── job_interview_feedback ─────────────────────────────────────────────
        if (! Schema::hasTable('job_interview_feedback')) {
            Schema::create('job_interview_feedback', function (Blueprint $table) {
                $table->id();
                $table->foreignId('interview_id')->constrained('job_interviews')->cascadeOnDelete();
                $table->foreignId('interviewer_id')->constrained('users')->cascadeOnDelete();
                $table->integer('technical_score')->nullable();
                $table->integer('communication_score')->nullable();
                $table->integer('cultural_fit_score')->nullable();
                $table->integer('problem_solving_score')->nullable();
                $table->integer('overall_score')->nullable();
                $table->text('strengths')->nullable();
                $table->text('weaknesses')->nullable();
                $table->text('comments')->nullable();
                $table->enum('recommendation', ['strong_hire', 'hire', 'maybe', 'no_hire'])->nullable();
                $table->timestamps();

                $table->unique(['interview_id', 'interviewer_id']);
            });
        }

        // ── job_offers ─────────────────────────────────────────────────────────
        if (! Schema::hasTable('job_offers')) {
            Schema::create('job_offers', function (Blueprint $table) {
                $table->id();
                $table->foreignId('application_id')->constrained('job_applications')->cascadeOnDelete();
                $table->string('offer_letter_path')->nullable();
                $table->decimal('offered_salary', 12, 2);
                $table->date('joining_date');
                $table->date('offer_valid_until');
                $table->text('terms_and_conditions')->nullable();
                $table->text('benefits')->nullable();
                $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired'])->default('draft');
                $table->foreignId('sent_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('sent_at')->nullable();
                $table->timestamp('responded_at')->nullable();
                $table->text('candidate_response_notes')->nullable();
                $table->timestamps();

                $table->index(['application_id', 'status']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_offers');
        Schema::dropIfExists('job_interview_feedback');
        Schema::dropIfExists('job_interview_interviewers');
        Schema::dropIfExists('job_interviews');
        Schema::dropIfExists('job_application_stage_history');
        Schema::dropIfExists('job_applications');
        Schema::dropIfExists('job_hiring_stages');
        Schema::dropIfExists('jobs_recruitment');
        Schema::dropIfExists('job_types');
    }
};
