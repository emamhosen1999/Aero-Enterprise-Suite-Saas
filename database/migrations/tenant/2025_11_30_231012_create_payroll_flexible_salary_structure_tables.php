<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Payroll Flexible Salary Structure Migration
 *
 * This migration creates a flexible and scalable payroll system with:
 *
 * CORE TABLES:
 * 1. salary_components - Master list of all salary components (earnings/deductions)
 * 2. salary_component_rules - Dynamic calculation rules for components
 * 3. salary_grades - Salary grade levels for organizational hierarchy
 * 4. employee_salary_structures - Links employees to their salary components
 *
 * PAYROLL PROCESSING:
 * 5. payrolls - Enhanced payroll header with month/year tracking
 * 6. payroll_items - Historical snapshot of salary breakdown per payroll
 *
 * ADDITIONAL CONFIGURATION:
 * 7. tax_brackets - Tax calculation brackets
 * 8. payroll_settings - Global payroll configuration
 * 9. salary_revisions - Track salary revision history
 * 10. payroll_adjustments - Ad-hoc adjustments (bonuses, arrears, corrections)
 * 11. employee_loans - Employee loan management
 * 12. loan_repayments - Track each EMI payment
 *
 * ARCHITECTURAL NOTES:
 * - Soft deletes on all tables for audit trail
 * - Components are versioned via payroll_items for historical accuracy
 * - Supports percentage-based and fixed amount calculations
 * - Multi-currency support inherent from existing user/bank structures
 *
 * @see \App\Models\HRM\SalaryComponent
 * @see \App\Models\HRM\EmployeeSalaryStructure
 * @see \App\Models\HRM\Payroll
 * @see \App\Models\HRM\PayrollItem
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // =====================================================================
        // TABLE 1: SALARY COMPONENTS (Master List)
        // =====================================================================
        if (! Schema::hasTable('salary_components')) {
            Schema::create('salary_components', function (Blueprint $table) {
                $table->id();

                // Component identification
                $table->string('name');
                $table->string('code', 50)->unique()->comment('Unique code for programmatic reference');
                $table->text('description')->nullable();

                // Component type
                $table->enum('type', ['earning', 'deduction'])->index();

                // Calculation mode
                $table->enum('calculation_type', [
                    'fixed',           // Fixed amount
                    'percentage',      // Percentage of basic/gross
                    'formula',         // Custom formula
                    'attendance',      // Based on attendance days
                    'slab',            // Based on salary slabs
                ])->default('fixed');

                // For percentage-based components
                $table->enum('percentage_of', ['basic', 'gross', 'ctc', 'custom'])->nullable();
                $table->decimal('percentage_value', 8, 4)->nullable()->comment('Percentage value if calculation_type is percentage');

                // For fixed amount
                $table->decimal('default_amount', 15, 2)->nullable()->comment('Default fixed amount');

                // Tax configuration
                $table->boolean('is_taxable')->default(true);
                $table->boolean('affects_gross')->default(true)->comment('Whether this affects gross salary calculation');
                $table->boolean('affects_epf')->default(false)->comment('Affects EPF/PF calculation');
                $table->boolean('affects_esi')->default(false)->comment('Affects ESI calculation');

                // Display and ordering
                $table->unsignedInteger('display_order')->default(0);
                $table->boolean('show_on_payslip')->default(true);
                $table->boolean('show_if_zero')->default(false)->comment('Show on payslip even if value is 0');

                // Statutory component flags
                $table->boolean('is_basic')->default(false)->comment('Is this the basic salary component');
                $table->boolean('is_statutory')->default(false)->comment('Government mandated component');

                // Status
                $table->boolean('is_active')->default(true);

                // Audit
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();

                // Indexes
                $table->index('is_active');
                $table->index(['type', 'is_active']);
                $table->index('display_order');
            });
        }

        // =====================================================================
        // TABLE 2: SALARY COMPONENT RULES (Dynamic Calculation Rules)
        // =====================================================================
        if (! Schema::hasTable('salary_component_rules')) {
            Schema::create('salary_component_rules', function (Blueprint $table) {
                $table->id();

                $table->foreignId('salary_component_id')
                    ->constrained('salary_components')
                    ->cascadeOnDelete();

                // Rule type
                $table->enum('rule_type', [
                    'min_amount',      // Minimum amount threshold
                    'max_amount',      // Maximum amount cap
                    'condition',       // Conditional application
                    'slab',            // Slab-based calculation
                    'formula',         // Custom formula
                ])->index();

                // Rule conditions (JSON for flexibility)
                $table->json('conditions')->nullable()->comment('JSON conditions for rule application');

                // Rule values
                $table->decimal('min_value', 15, 2)->nullable();
                $table->decimal('max_value', 15, 2)->nullable();
                $table->text('formula')->nullable()->comment('Custom calculation formula');

                // Priority for rule execution
                $table->unsignedInteger('priority')->default(0);
                $table->boolean('is_active')->default(true);

                $table->timestamps();
                $table->softDeletes();

                $table->index(['salary_component_id', 'is_active']);
            });
        }

        // =====================================================================
        // TABLE 3: SALARY GRADES (Organizational Hierarchy)
        // =====================================================================
        if (! Schema::hasTable('salary_grades')) {
            Schema::create('salary_grades', function (Blueprint $table) {
                $table->id();

                $table->string('name');
                $table->string('code', 20)->unique();
                $table->text('description')->nullable();

                // Salary range for this grade
                $table->decimal('min_salary', 15, 2)->nullable();
                $table->decimal('max_salary', 15, 2)->nullable();

                // Grade level (for hierarchy)
                $table->unsignedInteger('level')->default(1);

                // Default annual increment percentage
                $table->decimal('annual_increment_percentage', 5, 2)->nullable();

                // Status
                $table->boolean('is_active')->default(true);

                $table->timestamps();
                $table->softDeletes();

                $table->index('level');
                $table->index('is_active');
            });
        }

        // =====================================================================
        // TABLE 4: EMPLOYEE SALARY STRUCTURES (The Assignment)
        // =====================================================================
        if (! Schema::hasTable('employee_salary_structures')) {
            Schema::create('employee_salary_structures', function (Blueprint $table) {
                $table->id();

                // Foreign keys
                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                $table->foreignId('salary_component_id')
                    ->constrained('salary_components')
                    ->cascadeOnDelete();

                $table->foreignId('salary_grade_id')
                    ->nullable()
                    ->constrained('salary_grades')
                    ->nullOnDelete();

                // Amount configuration
                $table->enum('amount_type', ['fixed', 'percentage', 'component_default'])->default('fixed');
                $table->decimal('amount', 15, 2)->nullable()->comment('Fixed amount or percentage value');
                $table->enum('percentage_of', ['basic', 'gross', 'ctc'])->nullable();

                // Effective date range
                $table->date('effective_from')->default(now());
                $table->date('effective_to')->nullable()->comment('NULL means currently active');

                // Override flags
                $table->boolean('is_active')->default(true);
                $table->boolean('is_overridden')->default(false)->comment('Manual override of default calculation');

                // Notes
                $table->text('notes')->nullable();

                // Audit
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();

                // Indexes for efficient lookup
                $table->index(['user_id', 'is_active']);
                $table->index(['user_id', 'effective_from', 'effective_to']);
                $table->index(['salary_component_id', 'is_active']);

                // Prevent duplicate active component assignments
                $table->unique(
                    ['user_id', 'salary_component_id', 'effective_from'],
                    'unique_employee_component_effective'
                );
            });
        }

        // =====================================================================
        // TABLE 5: ENHANCE EXISTING PAYROLLS TABLE (The Header)
        // =====================================================================
        if (Schema::hasTable('payrolls')) {
            Schema::table('payrolls', function (Blueprint $table) {
                // Check and add columns if they don't exist

                // Employee reference
                if (! Schema::hasColumn('payrolls', 'user_id')) {
                    $table->foreignId('user_id')
                        ->after('id')
                        ->constrained('users')
                        ->cascadeOnDelete();
                }

                // Period tracking (month/year style)
                if (! Schema::hasColumn('payrolls', 'month')) {
                    $table->unsignedTinyInteger('month')
                        ->after('user_id')
                        ->comment('1-12');
                }
                if (! Schema::hasColumn('payrolls', 'year')) {
                    $table->unsignedSmallInteger('year')
                        ->after('month');
                }

                // Pay period dates
                if (! Schema::hasColumn('payrolls', 'pay_period_start')) {
                    $table->date('pay_period_start')->nullable()->after('year');
                }
                if (! Schema::hasColumn('payrolls', 'pay_period_end')) {
                    $table->date('pay_period_end')->nullable()->after('pay_period_start');
                }

                // Salary breakdown
                if (! Schema::hasColumn('payrolls', 'basic_salary')) {
                    $table->decimal('basic_salary', 15, 2)->default(0)->after('pay_period_end');
                }
                if (! Schema::hasColumn('payrolls', 'total_earnings')) {
                    $table->decimal('total_earnings', 15, 2)->default(0)->after('basic_salary');
                }
                if (! Schema::hasColumn('payrolls', 'total_deductions')) {
                    $table->decimal('total_deductions', 15, 2)->default(0)->after('total_earnings');
                }
                if (! Schema::hasColumn('payrolls', 'gross_salary')) {
                    $table->decimal('gross_salary', 15, 2)->default(0)->after('total_deductions');
                }
                if (! Schema::hasColumn('payrolls', 'net_salary')) {
                    $table->decimal('net_salary', 15, 2)->default(0)->after('gross_salary');
                }

                // Attendance data for the period
                if (! Schema::hasColumn('payrolls', 'working_days')) {
                    $table->unsignedTinyInteger('working_days')->default(0);
                }
                if (! Schema::hasColumn('payrolls', 'present_days')) {
                    $table->unsignedTinyInteger('present_days')->default(0);
                }
                if (! Schema::hasColumn('payrolls', 'absent_days')) {
                    $table->unsignedTinyInteger('absent_days')->default(0);
                }
                if (! Schema::hasColumn('payrolls', 'leave_days')) {
                    $table->unsignedTinyInteger('leave_days')->default(0);
                }
                if (! Schema::hasColumn('payrolls', 'holiday_days')) {
                    $table->unsignedTinyInteger('holiday_days')->default(0);
                }

                // Overtime
                if (! Schema::hasColumn('payrolls', 'overtime_hours')) {
                    $table->decimal('overtime_hours', 8, 2)->default(0);
                }
                if (! Schema::hasColumn('payrolls', 'overtime_amount')) {
                    $table->decimal('overtime_amount', 15, 2)->default(0);
                }

                // Tax calculations
                if (! Schema::hasColumn('payrolls', 'taxable_income')) {
                    $table->decimal('taxable_income', 15, 2)->default(0);
                }
                if (! Schema::hasColumn('payrolls', 'tax_amount')) {
                    $table->decimal('tax_amount', 15, 2)->default(0);
                }

                // Status tracking
                if (! Schema::hasColumn('payrolls', 'status')) {
                    $table->enum('status', [
                        'draft',
                        'pending_approval',
                        'approved',
                        'processed',
                        'paid',
                        'cancelled',
                    ])->default('draft');
                }

                // Payment information
                if (! Schema::hasColumn('payrolls', 'payment_date')) {
                    $table->date('payment_date')->nullable();
                }
                if (! Schema::hasColumn('payrolls', 'payment_method')) {
                    $table->enum('payment_method', ['bank_transfer', 'cash', 'cheque', 'other'])->nullable();
                }
                if (! Schema::hasColumn('payrolls', 'payment_reference')) {
                    $table->string('payment_reference')->nullable();
                }

                // Processing info
                if (! Schema::hasColumn('payrolls', 'processed_by')) {
                    $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
                }
                if (! Schema::hasColumn('payrolls', 'processed_at')) {
                    $table->timestamp('processed_at')->nullable();
                }
                if (! Schema::hasColumn('payrolls', 'approved_by')) {
                    $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                }
                if (! Schema::hasColumn('payrolls', 'approved_at')) {
                    $table->timestamp('approved_at')->nullable();
                }

                // Notes
                if (! Schema::hasColumn('payrolls', 'remarks')) {
                    $table->text('remarks')->nullable();
                }

                // Soft deletes
                if (! Schema::hasColumn('payrolls', 'deleted_at')) {
                    $table->softDeletes();
                }
            });

            // Add indexes
            Schema::table('payrolls', function (Blueprint $table) {
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                $indexes = $sm->listTableIndexes('payrolls');

                if (! isset($indexes['payrolls_month_year_index'])) {
                    $table->index(['month', 'year'], 'payrolls_month_year_index');
                }
                if (! isset($indexes['payrolls_user_month_year_index'])) {
                    $table->index(['user_id', 'month', 'year'], 'payrolls_user_month_year_index');
                }
                if (! isset($indexes['payrolls_status_index'])) {
                    $table->index('status', 'payrolls_status_index');
                }
            });
        }

        // =====================================================================
        // TABLE 6: PAYROLL ITEMS (The Breakdown Snapshot)
        // =====================================================================
        if (! Schema::hasTable('payroll_items')) {
            Schema::create('payroll_items', function (Blueprint $table) {
                $table->id();

                $table->foreignId('payroll_id')
                    ->constrained('payrolls')
                    ->cascadeOnDelete();

                // Reference to original component (nullable for historical records)
                $table->foreignId('salary_component_id')
                    ->nullable()
                    ->constrained('salary_components')
                    ->nullOnDelete();

                /**
                 * HISTORICAL SNAPSHOT
                 * We copy these values from the component at the time of payroll generation
                 * so changes to salary_components don't affect historical records
                 */
                $table->string('name')->comment('Component name at time of generation');
                $table->string('code', 50)->nullable()->comment('Component code at time of generation');
                $table->enum('type', ['earning', 'deduction']);

                // Amount
                $table->decimal('amount', 15, 2)->default(0);

                // Calculation details for audit
                $table->enum('calculation_type', ['fixed', 'percentage', 'formula', 'attendance', 'slab', 'manual'])
                    ->default('fixed');
                $table->decimal('calculation_base', 15, 2)->nullable()->comment('Base amount used for calculation');
                $table->decimal('rate', 10, 4)->nullable()->comment('Rate/percentage used');

                // Tax status at time of calculation
                $table->boolean('is_taxable')->default(true);
                $table->boolean('is_statutory')->default(false);

                // Display
                $table->unsignedInteger('display_order')->default(0);
                $table->boolean('show_on_payslip')->default(true);

                // Notes
                $table->text('notes')->nullable();

                $table->timestamps();

                // Indexes
                $table->index(['payroll_id', 'type']);
                $table->index(['payroll_id', 'display_order']);
            });
        }

        // =====================================================================
        // TABLE 7: TAX BRACKETS (Tax Calculation Configuration)
        // =====================================================================
        if (! Schema::hasTable('tax_brackets')) {
            Schema::create('tax_brackets', function (Blueprint $table) {
                $table->id();

                $table->string('name')->comment('Tax bracket name, e.g., "Standard Tax 2024"');
                $table->string('financial_year', 10)->comment('e.g., 2024-25');

                // Bracket range
                $table->decimal('min_income', 15, 2)->default(0);
                $table->decimal('max_income', 15, 2)->nullable()->comment('NULL for unlimited');

                // Tax rate
                $table->decimal('rate', 8, 4)->default(0)->comment('Tax rate as percentage');
                $table->decimal('fixed_amount', 15, 2)->default(0)->comment('Fixed tax for this bracket');

                // Surcharge and cess
                $table->decimal('surcharge_rate', 8, 4)->default(0);
                $table->decimal('cess_rate', 8, 4)->default(0);

                // Applicability
                $table->enum('regime', ['old', 'new'])->default('new')->comment('Tax regime');
                $table->boolean('is_active')->default(true);

                $table->timestamps();
                $table->softDeletes();

                $table->index(['financial_year', 'is_active']);
                $table->index(['min_income', 'max_income']);
            });
        }

        // =====================================================================
        // TABLE 8: PAYROLL SETTINGS (Global Configuration)
        // =====================================================================
        if (! Schema::hasTable('payroll_settings')) {
            Schema::create('payroll_settings', function (Blueprint $table) {
                $table->id();

                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->string('type')->default('string')->comment('string, integer, boolean, json, array');
                $table->string('group')->default('general')->comment('Setting group for organization');
                $table->text('description')->nullable();
                $table->boolean('is_editable')->default(true);

                $table->timestamps();

                $table->index('group');
            });

            // Insert default settings
            $this->insertDefaultSettings();
        }

        // =====================================================================
        // TABLE 9: SALARY REVISIONS (Track Salary History)
        // =====================================================================
        if (! Schema::hasTable('salary_revisions')) {
            Schema::create('salary_revisions', function (Blueprint $table) {
                $table->id();

                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Previous and new salary
                $table->decimal('previous_ctc', 15, 2)->nullable();
                $table->decimal('new_ctc', 15, 2);
                $table->decimal('previous_basic', 15, 2)->nullable();
                $table->decimal('new_basic', 15, 2);

                // Increment details
                $table->decimal('increment_percentage', 8, 2)->nullable();
                $table->decimal('increment_amount', 15, 2)->nullable();

                // Effective dates
                $table->date('effective_from');
                $table->date('revision_date');

                // Reason and type
                $table->enum('revision_type', [
                    'annual_increment',
                    'promotion',
                    'performance_bonus',
                    'market_correction',
                    'role_change',
                    'other',
                ])->default('annual_increment');
                $table->text('reason')->nullable();

                // Approval workflow
                $table->enum('status', ['pending', 'approved', 'rejected', 'applied'])->default('pending');
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();

                // Snapshot of component changes (JSON)
                $table->json('component_changes')->nullable()
                    ->comment('JSON snapshot of salary structure changes');

                // Document reference (for letter/notification)
                $table->string('reference_number')->nullable();
                $table->string('document_path')->nullable();

                // Audit
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'effective_from']);
                $table->index('status');
            });
        }

        // =====================================================================
        // TABLE 10: PAYROLL ADJUSTMENTS (Ad-hoc Adjustments)
        // =====================================================================
        if (! Schema::hasTable('payroll_adjustments')) {
            Schema::create('payroll_adjustments', function (Blueprint $table) {
                $table->id();

                // Link to payroll (nullable for future/scheduled adjustments)
                $table->foreignId('payroll_id')
                    ->nullable()
                    ->constrained('payrolls')
                    ->cascadeOnDelete();

                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Adjustment details
                $table->enum('type', ['earning', 'deduction']);
                $table->string('name');
                $table->text('description')->nullable();

                // Amount
                $table->decimal('amount', 15, 2);
                $table->boolean('is_taxable')->default(true);
                $table->boolean('is_recurring')->default(false);

                // For recurring adjustments
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->unsignedTinyInteger('remaining_occurrences')->nullable();

                // Adjustment reason
                $table->enum('adjustment_reason', [
                    'bonus',
                    'arrears',
                    'correction',
                    'reimbursement',
                    'advance_recovery',
                    'loan_recovery',
                    'fine',
                    'incentive',
                    'other',
                ])->default('other');

                // Status
                $table->enum('status', ['pending', 'approved', 'applied', 'cancelled'])->default('pending');

                // Approval
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();

                // Audit
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'status']);
                $table->index(['payroll_id', 'type']);
            });
        }

        // =====================================================================
        // TABLE 11: LOAN MANAGEMENT (Employee Loans)
        // =====================================================================
        if (! Schema::hasTable('employee_loans')) {
            Schema::create('employee_loans', function (Blueprint $table) {
                $table->id();

                $table->foreignId('user_id')
                    ->constrained('users')
                    ->cascadeOnDelete();

                // Loan details
                $table->string('loan_number')->unique();
                $table->enum('loan_type', ['salary_advance', 'personal_loan', 'emergency_loan', 'other'])
                    ->default('salary_advance');
                $table->text('purpose')->nullable();

                // Amount
                $table->decimal('principal_amount', 15, 2);
                $table->decimal('interest_rate', 8, 4)->default(0)->comment('Annual interest rate percentage');
                $table->decimal('total_interest', 15, 2)->default(0);
                $table->decimal('total_amount', 15, 2)->comment('Principal + Interest');

                // Repayment
                $table->unsignedInteger('tenure_months');
                $table->decimal('emi_amount', 15, 2);
                $table->date('start_date');
                $table->date('end_date')->nullable();

                // Status tracking
                $table->decimal('amount_paid', 15, 2)->default(0);
                $table->decimal('amount_remaining', 15, 2);
                $table->unsignedInteger('installments_paid')->default(0);
                $table->unsignedInteger('installments_remaining');

                // Status
                $table->enum('status', ['pending', 'approved', 'active', 'closed', 'defaulted', 'cancelled'])
                    ->default('pending');

                // Approval
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();

                // Document
                $table->string('agreement_path')->nullable();

                // Audit
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'status']);
                $table->index('loan_number');
            });
        }

        // =====================================================================
        // TABLE 12: LOAN REPAYMENTS (Track Each EMI Payment)
        // =====================================================================
        if (! Schema::hasTable('loan_repayments')) {
            Schema::create('loan_repayments', function (Blueprint $table) {
                $table->id();

                $table->foreignId('employee_loan_id')
                    ->constrained('employee_loans')
                    ->cascadeOnDelete();

                $table->foreignId('payroll_id')
                    ->nullable()
                    ->constrained('payrolls')
                    ->nullOnDelete();

                // Installment details
                $table->unsignedInteger('installment_number');
                $table->date('due_date');
                $table->date('paid_date')->nullable();

                // Amounts
                $table->decimal('principal_amount', 15, 2);
                $table->decimal('interest_amount', 15, 2);
                $table->decimal('total_amount', 15, 2);
                $table->decimal('penalty_amount', 15, 2)->default(0);

                // Balance after payment
                $table->decimal('balance_remaining', 15, 2);

                // Status
                $table->enum('status', ['upcoming', 'due', 'paid', 'overdue', 'waived'])->default('upcoming');

                // Notes
                $table->text('notes')->nullable();

                $table->timestamps();

                $table->index(['employee_loan_id', 'status']);
                $table->index('due_date');
            });
        }

        // =====================================================================
        // SEED DEFAULT SALARY COMPONENTS
        // =====================================================================
        $this->seedDefaultComponents();
    }

    /**
     * Insert default payroll settings.
     */
    private function insertDefaultSettings(): void
    {
        $settings = [
            // General Settings
            ['key' => 'pay_period', 'value' => 'monthly', 'type' => 'string', 'group' => 'general', 'description' => 'Pay period frequency: weekly, bi-weekly, monthly'],
            ['key' => 'pay_day', 'value' => '1', 'type' => 'integer', 'group' => 'general', 'description' => 'Day of month for salary payment'],
            ['key' => 'currency', 'value' => 'USD', 'type' => 'string', 'group' => 'general', 'description' => 'Default currency for payroll'],
            ['key' => 'working_days_per_month', 'value' => '22', 'type' => 'integer', 'group' => 'general', 'description' => 'Standard working days per month'],
            ['key' => 'working_hours_per_day', 'value' => '8', 'type' => 'integer', 'group' => 'general', 'description' => 'Standard working hours per day'],

            // Overtime Settings
            ['key' => 'overtime_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'overtime', 'description' => 'Enable overtime calculation'],
            ['key' => 'overtime_multiplier', 'value' => '1.5', 'type' => 'float', 'group' => 'overtime', 'description' => 'Overtime rate multiplier'],
            ['key' => 'holiday_overtime_multiplier', 'value' => '2', 'type' => 'float', 'group' => 'overtime', 'description' => 'Holiday overtime rate multiplier'],

            // Tax Settings
            ['key' => 'tax_calculation_enabled', 'value' => 'true', 'type' => 'boolean', 'group' => 'tax', 'description' => 'Enable automatic tax calculation'],
            ['key' => 'default_tax_regime', 'value' => 'new', 'type' => 'string', 'group' => 'tax', 'description' => 'Default tax regime: old, new'],
            ['key' => 'pf_employer_contribution', 'value' => '12', 'type' => 'float', 'group' => 'statutory', 'description' => 'Employer PF contribution percentage'],
            ['key' => 'pf_employee_contribution', 'value' => '12', 'type' => 'float', 'group' => 'statutory', 'description' => 'Employee PF contribution percentage'],
            ['key' => 'pf_wage_ceiling', 'value' => '15000', 'type' => 'float', 'group' => 'statutory', 'description' => 'PF wage ceiling amount'],
            ['key' => 'esi_employer_contribution', 'value' => '3.25', 'type' => 'float', 'group' => 'statutory', 'description' => 'Employer ESI contribution percentage'],
            ['key' => 'esi_employee_contribution', 'value' => '0.75', 'type' => 'float', 'group' => 'statutory', 'description' => 'Employee ESI contribution percentage'],
            ['key' => 'esi_wage_ceiling', 'value' => '21000', 'type' => 'float', 'group' => 'statutory', 'description' => 'ESI wage ceiling amount'],

            // Approval Settings
            ['key' => 'require_approval', 'value' => 'true', 'type' => 'boolean', 'group' => 'approval', 'description' => 'Require approval before processing payroll'],
            ['key' => 'auto_approve_threshold', 'value' => '0', 'type' => 'float', 'group' => 'approval', 'description' => 'Auto-approve payroll below this amount (0 = disabled)'],

            // Payslip Settings
            ['key' => 'payslip_format', 'value' => 'detailed', 'type' => 'string', 'group' => 'payslip', 'description' => 'Payslip format: simple, detailed'],
            ['key' => 'show_ytd_on_payslip', 'value' => 'true', 'type' => 'boolean', 'group' => 'payslip', 'description' => 'Show year-to-date totals on payslip'],
            ['key' => 'email_payslip', 'value' => 'true', 'type' => 'boolean', 'group' => 'payslip', 'description' => 'Email payslip to employee'],
        ];

        foreach ($settings as $setting) {
            \DB::table('payroll_settings')->insert(array_merge($setting, [
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    /**
     * Seed default salary components.
     */
    private function seedDefaultComponents(): void
    {
        $components = [
            // Earnings
            [
                'name' => 'Basic Salary',
                'code' => 'BASIC',
                'type' => 'earning',
                'calculation_type' => 'fixed',
                'is_taxable' => true,
                'affects_gross' => true,
                'affects_epf' => true,
                'affects_esi' => true,
                'display_order' => 1,
                'is_basic' => true,
                'is_statutory' => false,
            ],
            [
                'name' => 'House Rent Allowance',
                'code' => 'HRA',
                'type' => 'earning',
                'calculation_type' => 'percentage',
                'percentage_of' => 'basic',
                'percentage_value' => 40.00,
                'is_taxable' => true,
                'affects_gross' => true,
                'affects_epf' => false,
                'affects_esi' => false,
                'display_order' => 2,
            ],
            [
                'name' => 'Dearness Allowance',
                'code' => 'DA',
                'type' => 'earning',
                'calculation_type' => 'percentage',
                'percentage_of' => 'basic',
                'percentage_value' => 10.00,
                'is_taxable' => true,
                'affects_gross' => true,
                'affects_epf' => true,
                'affects_esi' => true,
                'display_order' => 3,
            ],
            [
                'name' => 'Transport Allowance',
                'code' => 'TA',
                'type' => 'earning',
                'calculation_type' => 'fixed',
                'default_amount' => 1600.00,
                'is_taxable' => true,
                'affects_gross' => true,
                'display_order' => 4,
            ],
            [
                'name' => 'Medical Allowance',
                'code' => 'MA',
                'type' => 'earning',
                'calculation_type' => 'fixed',
                'default_amount' => 1250.00,
                'is_taxable' => false,
                'affects_gross' => true,
                'display_order' => 5,
            ],
            [
                'name' => 'Special Allowance',
                'code' => 'SPA',
                'type' => 'earning',
                'calculation_type' => 'fixed',
                'is_taxable' => true,
                'affects_gross' => true,
                'display_order' => 6,
            ],
            [
                'name' => 'Overtime',
                'code' => 'OT',
                'type' => 'earning',
                'calculation_type' => 'formula',
                'is_taxable' => true,
                'affects_gross' => true,
                'show_if_zero' => false,
                'display_order' => 10,
            ],
            [
                'name' => 'Performance Bonus',
                'code' => 'BONUS',
                'type' => 'earning',
                'calculation_type' => 'fixed',
                'is_taxable' => true,
                'affects_gross' => true,
                'show_if_zero' => false,
                'display_order' => 11,
            ],

            // Deductions
            [
                'name' => 'Provident Fund (Employee)',
                'code' => 'PF_EE',
                'type' => 'deduction',
                'calculation_type' => 'percentage',
                'percentage_of' => 'basic',
                'percentage_value' => 12.00,
                'is_taxable' => false,
                'is_statutory' => true,
                'display_order' => 20,
            ],
            [
                'name' => 'Employee State Insurance',
                'code' => 'ESI_EE',
                'type' => 'deduction',
                'calculation_type' => 'percentage',
                'percentage_of' => 'gross',
                'percentage_value' => 0.75,
                'is_taxable' => false,
                'is_statutory' => true,
                'display_order' => 21,
            ],
            [
                'name' => 'Professional Tax',
                'code' => 'PT',
                'type' => 'deduction',
                'calculation_type' => 'slab',
                'is_taxable' => false,
                'is_statutory' => true,
                'display_order' => 22,
            ],
            [
                'name' => 'Income Tax (TDS)',
                'code' => 'TDS',
                'type' => 'deduction',
                'calculation_type' => 'formula',
                'is_taxable' => false,
                'is_statutory' => true,
                'display_order' => 23,
            ],
            [
                'name' => 'Loan Recovery',
                'code' => 'LOAN',
                'type' => 'deduction',
                'calculation_type' => 'fixed',
                'is_taxable' => false,
                'show_if_zero' => false,
                'display_order' => 30,
            ],
            [
                'name' => 'Advance Recovery',
                'code' => 'ADV_REC',
                'type' => 'deduction',
                'calculation_type' => 'fixed',
                'is_taxable' => false,
                'show_if_zero' => false,
                'display_order' => 31,
            ],
            [
                'name' => 'Absent Deduction',
                'code' => 'ABSENT',
                'type' => 'deduction',
                'calculation_type' => 'attendance',
                'is_taxable' => false,
                'show_if_zero' => false,
                'display_order' => 32,
            ],
            [
                'name' => 'Late Coming Fine',
                'code' => 'LATE',
                'type' => 'deduction',
                'calculation_type' => 'fixed',
                'is_taxable' => false,
                'show_if_zero' => false,
                'display_order' => 33,
            ],
        ];

        foreach ($components as $component) {
            \DB::table('salary_components')->insert(array_merge($component, [
                'is_active' => true,
                'show_on_payslip' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop tables in reverse order of creation (respecting foreign keys)
        Schema::dropIfExists('loan_repayments');
        Schema::dropIfExists('employee_loans');
        Schema::dropIfExists('payroll_adjustments');
        Schema::dropIfExists('salary_revisions');
        Schema::dropIfExists('payroll_settings');
        Schema::dropIfExists('tax_brackets');
        Schema::dropIfExists('payroll_items');
        Schema::dropIfExists('employee_salary_structures');
        Schema::dropIfExists('salary_grades');
        Schema::dropIfExists('salary_component_rules');
        Schema::dropIfExists('salary_components');

        // Remove added columns from payrolls table
        if (Schema::hasTable('payrolls')) {
            Schema::table('payrolls', function (Blueprint $table) {
                $columnsToRemove = [
                    'month', 'year', 'pay_period_start', 'pay_period_end',
                    'basic_salary', 'total_earnings', 'total_deductions', 'gross_salary', 'net_salary',
                    'working_days', 'present_days', 'absent_days', 'leave_days', 'holiday_days',
                    'overtime_hours', 'overtime_amount', 'taxable_income', 'tax_amount',
                    'status', 'payment_date', 'payment_method', 'payment_reference',
                    'processed_by', 'processed_at', 'approved_by', 'approved_at',
                    'remarks', 'deleted_at',
                ];

                foreach ($columnsToRemove as $column) {
                    if (Schema::hasColumn('payrolls', $column)) {
                        if (in_array($column, ['processed_by', 'approved_by', 'user_id'])) {
                            $table->dropForeign([$column]);
                        }
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
