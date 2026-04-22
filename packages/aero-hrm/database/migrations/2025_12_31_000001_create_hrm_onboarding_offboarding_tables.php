<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Canonical HRM Onboarding & Offboarding tables migration.
 *
 * Consolidates:
 *  - 2025_12_31_000001_create_onboardings_table.php                    (base)
 *  - 2025_12_31_000002_create_onboarding_tasks_table.php               (base)
 *  - 2025_12_31_000003_add_missing_columns_to_onboardings_table.php    (absorbed)
 *    → actual_completion_date, softDeletes
 *  - 2025_12_31_000004_add_missing_columns_to_onboarding_tasks_table.php (absorbed)
 *    → completed_date, softDeletes
 *  - 2025_12_31_000005_create_onboarding_offboarding_steps_tables.php  (kept as-is, grouped here)
 *  - 2025_12_31_000006_create_checklists_table.php                     (domain-grouped here)
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── onboardings ────────────────────────────────────────────────────────
        if (! Schema::hasTable('onboardings')) {
            Schema::create('onboardings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->timestamp('start_date');
                $table->timestamp('expected_completion_date')->nullable();

                // Absorbed from: add_missing_columns_to_onboardings_table
                $table->timestamp('actual_completion_date')->nullable();

                $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
                $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
                $table->timestamps();

                // Absorbed from: add_missing_columns_to_onboardings_table
                $table->softDeletes();
            });
        }

        // ── onboarding_tasks ───────────────────────────────────────────────────
        if (! Schema::hasTable('onboarding_tasks')) {
            Schema::create('onboarding_tasks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('onboarding_id')->constrained('onboardings')->cascadeOnDelete();
                $table->string('task');
                $table->text('description')->nullable();
                $table->timestamp('due_date')->nullable();

                // Absorbed from: add_missing_columns_to_onboarding_tasks_table
                $table->timestamp('completed_date')->nullable();

                $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
                $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();

                // Absorbed from: add_missing_columns_to_onboarding_tasks_table
                $table->softDeletes();
            });
        }

        // ── onboarding_steps ───────────────────────────────────────────────────
        if (! Schema::hasTable('onboarding_steps')) {
            Schema::create('onboarding_steps', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->integer('order')->default(0);
                $table->boolean('active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['active', 'order']);
            });
        }

        // ── offboardings ───────────────────────────────────────────────────────
        if (! Schema::hasTable('offboardings')) {
            Schema::create('offboardings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->date('last_working_date');
                $table->enum('reason', ['resignation', 'termination', 'retirement', 'contract_end', 'other'])->default('resignation');
                $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'last_working_date']);
            });
        }

        // ── offboarding_steps ──────────────────────────────────────────────────
        if (! Schema::hasTable('offboarding_steps')) {
            Schema::create('offboarding_steps', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->integer('order')->default(0);
                $table->boolean('active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['active', 'order']);
            });
        }

        // ── offboarding_tasks ──────────────────────────────────────────────────
        if (! Schema::hasTable('offboarding_tasks')) {
            Schema::create('offboarding_tasks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('offboarding_id')->constrained('offboardings')->cascadeOnDelete();
                $table->string('task');
                $table->text('description')->nullable();
                $table->date('due_date')->nullable();
                $table->date('completed_date')->nullable();
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['offboarding_id', 'status']);
            });
        }

        // ── checklists ─────────────────────────────────────────────────────────
        if (! Schema::hasTable('checklists')) {
            Schema::create('checklists', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->enum('type', ['onboarding', 'offboarding'])->default('onboarding');
                $table->text('description')->nullable();
                $table->json('items')->nullable();
                $table->boolean('active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['type', 'active']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('checklists');
        Schema::dropIfExists('offboarding_tasks');
        Schema::dropIfExists('offboarding_steps');
        Schema::dropIfExists('offboardings');
        Schema::dropIfExists('onboarding_steps');
        Schema::dropIfExists('onboarding_tasks');
        Schema::dropIfExists('onboardings');
    }
};
