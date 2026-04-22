<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Canonical HRM Benefits tables migration.
 *
 * Consolidates:
 *  - 2026_01_12_000001_create_missing_hrm_tables.php  → benefits table (absorbed)
 *  - 2026_01_24_000001_create_benefits_tables.php      → benefit_plans, benefit_enrollments (base)
 *  - 2026_04_21_000001_create_benefit_open_enrollment_periods_table.php (absorbed – adds period FK to enrollments)
 *  - 2026_04_22_041743_create_employee_benefits_table.php               (base)
 *  - 2026_04_22_041913_add_missing_columns_to_employee_benefits_table.php (absorbed)
 *    → cost_to_employee, notes
 *
 * NOTE: The standalone `benefits` table (basic type/value model) and the `benefit_plans`
 *       table (full provider/policy model) serve different layers. Both are retained.
 *       `employee_benefits` links employees to the basic `benefits` table.
 *       `benefit_enrollments` links employees to the rich `benefit_plans` table.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── benefits (basic catalogue) ─────────────────────────────────────────
        if (! Schema::hasTable('benefits')) {
            Schema::create('benefits', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->enum('type', ['health', 'retirement', 'insurance', 'leave', 'other']);
                $table->decimal('value', 15, 2)->nullable();
                $table->enum('value_type', ['fixed', 'percentage']);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── benefit_open_enrollment_periods ────────────────────────────────────
        // Created before benefit_plans/enrollments so the FK can reference it
        if (! Schema::hasTable('benefit_open_enrollment_periods')) {
            Schema::create('benefit_open_enrollment_periods', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->date('starts_at');
                $table->date('ends_at');
                $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
                $table->text('description')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();

                $table->index('status');
                $table->index(['starts_at', 'ends_at']);
                $table->index('created_by');
            });
        }

        // ── benefit_plans (rich provider-level plans) ──────────────────────────
        if (! Schema::hasTable('benefit_plans')) {
            Schema::create('benefit_plans', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->enum('type', ['health', 'dental', 'vision', 'life', 'retirement', 'disability', 'wellness', 'other'])->default('health');
                $table->decimal('employer_contribution', 12, 2)->default(0);
                $table->decimal('employee_contribution', 12, 2)->default(0);
                $table->enum('contribution_frequency', ['monthly', 'quarterly', 'annually'])->default('monthly');
                $table->date('effective_date')->nullable();
                $table->date('expiration_date')->nullable();
                $table->json('eligibility_criteria')->nullable();
                $table->json('coverage_details')->nullable();
                $table->string('provider_name')->nullable();
                $table->string('policy_number')->nullable();
                $table->integer('waiting_period_days')->default(0);
                $table->enum('status', ['active', 'inactive', 'pending', 'expired'])->default('active');
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'type']);
                $table->index('effective_date');
            });
        }

        // ── benefit_enrollments ────────────────────────────────────────────────
        if (! Schema::hasTable('benefit_enrollments')) {
            Schema::create('benefit_enrollments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->foreignId('benefit_plan_id')->constrained('benefit_plans')->cascadeOnDelete();

                // Absorbed from: create_benefit_open_enrollment_periods_table
                $table->foreignId('benefit_open_enrollment_period_id')
                    ->nullable()
                    ->constrained('benefit_open_enrollment_periods')
                    ->nullOnDelete();

                $table->date('enrollment_date');
                $table->date('effective_date')->nullable();
                $table->date('termination_date')->nullable();
                $table->enum('coverage_level', ['employee_only', 'employee_spouse', 'employee_children', 'family'])->default('employee_only');
                $table->decimal('employee_contribution', 12, 2)->default(0);
                $table->decimal('employer_contribution', 12, 2)->default(0);
                $table->enum('status', ['active', 'pending', 'terminated', 'waived'])->default('pending');
                $table->json('dependents')->nullable();
                $table->json('beneficiaries')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['employee_id', 'status']);
                $table->index('benefit_plan_id');
                $table->index('enrollment_date');
                $table->index(
                    ['employee_id', 'benefit_open_enrollment_period_id'],
                    'benefit_enrollments_employee_period_index'
                );
            });
        }

        // ── employee_benefits (employee → basic benefits link) ─────────────────
        if (! Schema::hasTable('employee_benefits')) {
            Schema::create('employee_benefits', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('benefit_id')->constrained()->cascadeOnDelete();
                $table->date('enrollment_date')->nullable();
                $table->date('end_date')->nullable();
                $table->string('coverage_level')->nullable();

                // Absorbed from: add_missing_columns_to_employee_benefits_table
                $table->decimal('cost_to_employee', 10, 2)->nullable();

                $table->string('status')->default('active');

                // Absorbed from: add_missing_columns_to_employee_benefits_table
                $table->text('notes')->nullable();

                $table->timestamps();

                $table->unique(['user_id', 'benefit_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_benefits');
        Schema::dropIfExists('benefit_enrollments');
        Schema::dropIfExists('benefit_plans');
        Schema::dropIfExists('benefit_open_enrollment_periods');
        Schema::dropIfExists('benefits');
    }
};
