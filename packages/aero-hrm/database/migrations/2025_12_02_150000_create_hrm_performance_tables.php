<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Canonical HRM Performance Management tables migration.
 *
 * Split from: 2025_12_02_121546_create_hrm_core_tables.php (section 2.6)
 *
 * Absorbed additive migrations:
 *  - 2026_04_22_041735_add_soft_deletes_to_performance_reviews_table.php
 *    → softDeletes() on performance_reviews
 *
 * Also domain-groups:
 *  - 2026_04_21_000002_create_pip_plans_table.php
 *  - 2026_04_21_000003_create_pip_goals_table.php
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── kpis ───────────────────────────────────────────────────────────────
        if (! Schema::hasTable('kpis')) {
            Schema::create('kpis', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('category')->nullable();
                $table->string('measurement_unit')->nullable();
                $table->decimal('target_value', 10, 2)->nullable();
                $table->decimal('min_acceptable_value', 10, 2)->nullable();
                $table->enum('frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])->default('monthly');
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['category', 'is_active']);
            });
        }

        // ── kpi_values ─────────────────────────────────────────────────────────
        if (! Schema::hasTable('kpi_values')) {
            Schema::create('kpi_values', function (Blueprint $table) {
                $table->id();
                $table->foreignId('kpi_id')->constrained()->cascadeOnDelete();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->date('measurement_date');
                $table->decimal('actual_value', 10, 2);
                $table->decimal('target_value', 10, 2)->nullable();
                $table->integer('achievement_percentage')->nullable();
                $table->text('notes')->nullable();
                $table->foreignId('recorded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['employee_id', 'measurement_date']);
                $table->index(['kpi_id', 'measurement_date']);
            });
        }

        // ── performance_review_templates ───────────────────────────────────────
        if (! Schema::hasTable('performance_review_templates')) {
            Schema::create('performance_review_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->enum('review_type', ['annual', 'quarterly', 'probation', 'project_based'])->default('annual');
                $table->json('evaluation_criteria')->nullable();
                $table->json('rating_scale')->nullable();
                $table->boolean('include_self_assessment')->default(false);
                $table->boolean('include_peer_review')->default(false);
                $table->boolean('include_360_feedback')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── performance_reviews ────────────────────────────────────────────────
        if (! Schema::hasTable('performance_reviews')) {
            Schema::create('performance_reviews', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('template_id')->nullable()->constrained('performance_review_templates')->nullOnDelete();
                $table->string('review_period');
                $table->date('review_start_date');
                $table->date('review_end_date');
                $table->date('due_date')->nullable();
                $table->json('self_assessment')->nullable();
                $table->json('manager_assessment')->nullable();
                $table->json('peer_feedback')->nullable();
                $table->decimal('overall_rating', 3, 2)->nullable();
                $table->text('strengths')->nullable();
                $table->text('areas_of_improvement')->nullable();
                $table->text('goals_for_next_period')->nullable();
                $table->text('training_recommendations')->nullable();
                $table->text('comments')->nullable();
                $table->enum('status', ['draft', 'self_assessment_pending', 'manager_review_pending', 'completed', 'acknowledged'])->default('draft');
                $table->timestamp('completed_at')->nullable();
                $table->timestamp('acknowledged_at')->nullable();
                $table->timestamps();

                // Absorbed from: add_soft_deletes_to_performance_reviews_table
                $table->softDeletes();

                $table->index(['employee_id', 'status']);
                $table->index(['review_start_date', 'review_end_date']);
            });
        }

        // ── pip_plans ──────────────────────────────────────────────────────────
        // Absorbed from: 2026_04_21_000002_create_pip_plans_table.php
        if (! Schema::hasTable('pip_plans')) {
            Schema::create('pip_plans', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->unsignedBigInteger('manager_id')->nullable();
                $table->string('title');
                $table->text('reason');
                $table->date('start_date');
                $table->date('end_date');
                $table->enum('status', ['draft', 'active', 'completed', 'extended', 'terminated'])->default('draft');
                $table->text('description')->nullable();
                $table->text('expected_outcomes')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamp('closed_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index('employee_id');
                $table->index('manager_id');
                $table->index('status');
                $table->index(['start_date', 'end_date']);
            });
        }

        // ── pip_goals ──────────────────────────────────────────────────────────
        // Absorbed from: 2026_04_21_000003_create_pip_goals_table.php
        if (! Schema::hasTable('pip_goals')) {
            Schema::create('pip_goals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pip_plan_id')->constrained('pip_plans')->cascadeOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->date('target_date');
                $table->enum('status', ['pending', 'in_progress', 'achieved', 'missed'])->default('pending');
                $table->text('progress_notes')->nullable();
                $table->timestamps();

                $table->index('pip_plan_id');
                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pip_goals');
        Schema::dropIfExists('pip_plans');
        Schema::dropIfExists('performance_reviews');
        Schema::dropIfExists('performance_review_templates');
        Schema::dropIfExists('kpi_values');
        Schema::dropIfExists('kpis');
    }
};
