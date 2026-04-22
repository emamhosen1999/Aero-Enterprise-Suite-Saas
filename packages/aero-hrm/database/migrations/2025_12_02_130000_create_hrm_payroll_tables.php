<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Canonical HRM Payroll tables migration.
 *
 * Split from: 2025_12_02_121546_create_hrm_core_tables.php (section 2.4)
 *
 * Also groups salary-related standalone migrations:
 *  - 2025_12_02_134314_create_salary_components_table.php
 *  - 2025_12_02_134324_create_employee_salary_structures_table.php
 *  - 2025_12_02_133657_create_tax_configuration_tables.php
 *  - 2025_12_02_153410_create_grades_table.php
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── grades ─────────────────────────────────────────────────────────────
        if (! Schema::hasTable('grades')) {
            Schema::create('grades', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->nullable()->unique();
                $table->text('description')->nullable();
                $table->decimal('min_salary', 12, 2)->nullable();
                $table->decimal('max_salary', 12, 2)->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── salary_components ──────────────────────────────────────────────────
        if (! Schema::hasTable('salary_components')) {
            Schema::create('salary_components', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->unique();
                $table->enum('type', ['allowance', 'deduction', 'benefit'])->default('allowance');
                $table->enum('calculation_type', ['fixed', 'percentage'])->default('fixed');
                $table->decimal('value', 12, 2)->default(0);
                $table->string('percentage_of')->nullable();
                $table->boolean('is_taxable')->default(true);
                $table->boolean('is_active')->default(true);
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // ── employee_salary_structures ─────────────────────────────────────────
        if (! Schema::hasTable('employee_salary_structures')) {
            Schema::create('employee_salary_structures', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
                $table->foreignId('salary_component_id')->constrained()->cascadeOnDelete();
                $table->decimal('value', 12, 2)->default(0);
                $table->date('effective_from');
                $table->date('effective_to')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['employee_id', 'is_active']);
            });
        }

        // ── tax_slabs ──────────────────────────────────────────────────────────
        if (! Schema::hasTable('tax_slabs')) {
            Schema::create('tax_slabs', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('fiscal_year', 9);
                $table->decimal('min_income', 15, 2)->default(0);
                $table->decimal('max_income', 15, 2)->nullable();
                $table->decimal('tax_rate', 5, 2);
                $table->decimal('fixed_tax', 12, 2)->default(0);
                $table->string('currency', 3)->default('BDT');
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['fiscal_year', 'is_active']);
            });
        }

        // ── payrolls ───────────────────────────────────────────────────────────
        if (! Schema::hasTable('payrolls')) {
            Schema::create('payrolls', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->date('pay_period_start');
                $table->date('pay_period_end');
                $table->decimal('basic_salary', 12, 2)->default(0);
                $table->decimal('gross_salary', 12, 2)->default(0);
                $table->decimal('total_deductions', 12, 2)->default(0);
                $table->decimal('net_salary', 12, 2)->default(0);
                $table->integer('working_days')->default(0);
                $table->integer('present_days')->default(0);
                $table->integer('absent_days')->default(0);
                $table->integer('leave_days')->default(0);
                $table->decimal('overtime_hours', 5, 2)->default(0);
                $table->decimal('overtime_amount', 10, 2)->default(0);
                $table->string('status')->default('draft');
                $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('processed_at')->nullable();
                $table->text('remarks')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'pay_period_start']);
                $table->index(['status', 'pay_period_start']);
            });
        }

        // ── payroll_allowances ─────────────────────────────────────────────────
        if (! Schema::hasTable('payroll_allowances')) {
            Schema::create('payroll_allowances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('payroll_id')->constrained()->cascadeOnDelete();
                $table->string('type');
                $table->string('description')->nullable();
                $table->decimal('amount', 10, 2);
                $table->boolean('is_taxable')->default(true);
                $table->timestamps();

                $table->index('payroll_id');
            });
        }

        // ── payroll_deductions ─────────────────────────────────────────────────
        if (! Schema::hasTable('payroll_deductions')) {
            Schema::create('payroll_deductions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('payroll_id')->constrained()->cascadeOnDelete();
                $table->string('type');
                $table->string('description')->nullable();
                $table->decimal('amount', 10, 2);
                $table->timestamps();

                $table->index('payroll_id');
            });
        }

        // ── payslips ───────────────────────────────────────────────────────────
        if (! Schema::hasTable('payslips')) {
            Schema::create('payslips', function (Blueprint $table) {
                $table->id();
                $table->foreignId('payroll_id')->constrained()->cascadeOnDelete();
                $table->string('payslip_number')->unique();
                $table->string('file_path')->nullable();
                $table->boolean('is_sent')->default(false);
                $table->timestamp('sent_at')->nullable();
                $table->boolean('is_downloaded')->default(false);
                $table->timestamp('downloaded_at')->nullable();
                $table->timestamps();

                $table->index('payroll_id');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payslips');
        Schema::dropIfExists('payroll_deductions');
        Schema::dropIfExists('payroll_allowances');
        Schema::dropIfExists('payrolls');
        Schema::dropIfExists('tax_slabs');
        Schema::dropIfExists('employee_salary_structures');
        Schema::dropIfExists('salary_components');
        Schema::dropIfExists('grades');
    }
};
