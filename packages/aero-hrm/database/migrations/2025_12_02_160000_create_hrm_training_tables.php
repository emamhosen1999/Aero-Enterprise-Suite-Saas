<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Canonical HRM Training & Development tables migration.
 *
 * Split from: 2025_12_02_121546_create_hrm_core_tables.php (section 2.7)
 *
 * Also groups:
 *  - 2025_12_02_153454_create_shift_schedules_table.php  (domain-grouped)
 *  - 2025_12_02_121600_create_task_templates_table.php   (domain-grouped)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── shift_schedules ────────────────────────────────────────────────────
        if (! Schema::hasTable('shift_schedules')) {
            Schema::create('shift_schedules', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->nullable()->unique();
                $table->time('start_time');
                $table->time('end_time');
                $table->integer('break_duration_minutes')->default(0);
                $table->boolean('is_night_shift')->default(false);
                $table->json('working_days')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── task_templates ─────────────────────────────────────────────────────
        if (! Schema::hasTable('task_templates')) {
            Schema::create('task_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('category')->nullable();
                $table->json('tasks')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── training_categories ────────────────────────────────────────────────
        if (! Schema::hasTable('training_categories')) {
            Schema::create('training_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── training_sessions ──────────────────────────────────────────────────
        if (! Schema::hasTable('training_sessions')) {
            Schema::create('training_sessions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('category_id')->nullable()->constrained('training_categories')->nullOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->enum('training_type', ['internal', 'external', 'online', 'workshop', 'seminar'])->default('internal');
                $table->string('trainer_name')->nullable();
                $table->string('trainer_organization')->nullable();
                $table->string('venue')->nullable();
                $table->dateTime('start_date');
                $table->dateTime('end_date');
                $table->integer('duration_hours')->nullable();
                $table->integer('max_participants')->nullable();
                $table->decimal('cost_per_participant', 10, 2)->default(0);
                $table->text('objectives')->nullable();
                $table->text('prerequisites')->nullable();
                $table->enum('status', ['scheduled', 'ongoing', 'completed', 'cancelled'])->default('scheduled');
                $table->foreignId('organized_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['start_date', 'status']);
            });
        }

        // ── training_enrollments ───────────────────────────────────────────────
        if (! Schema::hasTable('training_enrollments')) {
            Schema::create('training_enrollments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('training_session_id')->constrained()->cascadeOnDelete();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->enum('enrollment_type', ['mandatory', 'voluntary', 'nominated'])->default('voluntary');
                $table->enum('status', ['enrolled', 'attended', 'completed', 'absent', 'cancelled'])->default('enrolled');
                $table->integer('attendance_percentage')->nullable();
                $table->boolean('certificate_issued')->default(false);
                $table->string('certificate_path')->nullable();
                $table->foreignId('enrolled_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['training_session_id', 'employee_id']);
                $table->index(['employee_id', 'status']);
            });
        }

        // ── training_feedback ──────────────────────────────────────────────────
        if (! Schema::hasTable('training_feedback')) {
            Schema::create('training_feedback', function (Blueprint $table) {
                $table->id();
                $table->foreignId('enrollment_id')->constrained('training_enrollments')->cascadeOnDelete();
                $table->integer('content_rating')->nullable();
                $table->integer('trainer_rating')->nullable();
                $table->integer('relevance_rating')->nullable();
                $table->integer('venue_rating')->nullable();
                $table->integer('overall_rating')->nullable();
                $table->text('what_went_well')->nullable();
                $table->text('what_could_improve')->nullable();
                $table->text('suggestions')->nullable();
                $table->boolean('would_recommend')->default(false);
                $table->timestamps();

                $table->index('enrollment_id');
            });
        }

        // ── training_materials ─────────────────────────────────────────────────
        if (! Schema::hasTable('training_materials')) {
            Schema::create('training_materials', function (Blueprint $table) {
                $table->id();
                $table->foreignId('training_session_id')->constrained()->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->enum('material_type', ['presentation', 'document', 'video', 'link', 'other'])->default('document');
                $table->string('file_path')->nullable();
                $table->string('external_url')->nullable();
                $table->boolean('is_downloadable')->default(true);
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index('training_session_id');
            });
        }

        // ── training_assignments ───────────────────────────────────────────────
        if (! Schema::hasTable('training_assignments')) {
            Schema::create('training_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('training_session_id')->constrained()->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->text('instructions')->nullable();
                $table->date('due_date')->nullable();
                $table->integer('max_score')->default(100);
                $table->integer('passing_score')->default(60);
                $table->boolean('is_mandatory')->default(false);
                $table->timestamps();

                $table->index('training_session_id');
            });
        }

        // ── training_assignment_submissions ────────────────────────────────────
        if (! Schema::hasTable('training_assignment_submissions')) {
            Schema::create('training_assignment_submissions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('assignment_id')->constrained('training_assignments')->cascadeOnDelete();
                $table->foreignId('enrollment_id')->constrained('training_enrollments')->cascadeOnDelete();
                $table->text('submission_text')->nullable();
                $table->string('submission_file_path')->nullable();
                $table->timestamp('submitted_at')->nullable();
                $table->integer('score')->nullable();
                $table->boolean('is_passed')->default(false);
                $table->text('feedback')->nullable();
                $table->foreignId('evaluated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('evaluated_at')->nullable();
                $table->timestamps();

                $table->unique(['assignment_id', 'enrollment_id'], 'train_assign_sub_uniq');
            });
        }

        // ── employee_skills ────────────────────────────────────────────────────
        if (! Schema::hasTable('employee_skills')) {
            Schema::create('employee_skills', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->string('skill_name');
                $table->enum('proficiency_level', ['beginner', 'intermediate', 'advanced', 'expert'])->default('beginner');
                $table->integer('years_of_experience')->default(0);
                $table->date('last_used_date')->nullable();
                $table->boolean('is_certified')->default(false);
                $table->string('certification_name')->nullable();
                $table->date('certification_date')->nullable();
                $table->date('certification_expiry')->nullable();
                $table->string('certification_file_path')->nullable();
                $table->timestamps();

                $table->index(['employee_id', 'skill_name']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_skills');
        Schema::dropIfExists('training_assignment_submissions');
        Schema::dropIfExists('training_assignments');
        Schema::dropIfExists('training_materials');
        Schema::dropIfExists('training_feedback');
        Schema::dropIfExists('training_enrollments');
        Schema::dropIfExists('training_sessions');
        Schema::dropIfExists('training_categories');
        Schema::dropIfExists('task_templates');
        Schema::dropIfExists('shift_schedules');
    }
};
