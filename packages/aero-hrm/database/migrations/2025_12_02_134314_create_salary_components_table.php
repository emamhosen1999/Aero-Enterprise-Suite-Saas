<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Salary Components Migration
 *
 * Master list of all salary components (earnings and deductions)
 * that can be used to build employee salary structures.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('salary_components')) {
            Schema::create('salary_components', function (Blueprint $table) {
                $table->id();
                $table->string('name'); // E.g., "House Rent Allowance", "Provident Fund"
                $table->string('code', 50)->unique(); // E.g., "HRA", "PF_EE"
                $table->enum('type', ['earning', 'deduction']);

                // Calculation configuration
                $table->enum('calculation_type', ['fixed', 'percentage', 'formula', 'attendance', 'slab'])->default('fixed');
                $table->string('percentage_of')->nullable(); // 'basic', 'gross', 'ctc'
                $table->decimal('percentage_value', 10, 4)->nullable();
                $table->decimal('default_amount', 15, 2)->nullable();
                $table->text('formula')->nullable(); // For custom calculations

                // Tax configuration
                $table->boolean('is_taxable')->default(true);
                $table->boolean('is_statutory')->default(false); // PF, ESI, etc.

                // Payroll configuration
                $table->boolean('affects_gross')->default(true);
                $table->boolean('affects_ctc')->default(true);
                $table->boolean('affects_epf')->default(false);
                $table->boolean('affects_esi')->default(false);

                // Display configuration
                $table->boolean('is_active')->default(true);
                $table->boolean('show_in_payslip')->default(true);
                $table->boolean('show_if_zero')->default(false);
                $table->integer('display_order')->default(0);

                // Metadata
                $table->text('description')->nullable();
                $table->json('metadata')->nullable(); // Additional configuration

                $table->timestamps();
                $table->softDeletes();

                $table->index(['type', 'is_active']);
                $table->index('display_order');
            });
        }

        // Seed default components
        $this->seedDefaultComponents();
    }

    /**
     * Seed default salary components
     */
    protected function seedDefaultComponents(): void
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
                'affects_ctc' => true,
                'affects_epf' => true,
                'affects_esi' => true,
                'is_statutory' => false,
                'show_in_payslip' => true,
                'show_if_zero' => true,
                'display_order' => 1,
                'description' => 'Base salary component',
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
                'affects_ctc' => true,
                'affects_epf' => false,
                'affects_esi' => false,
                'display_order' => 2,
                'description' => 'House Rent Allowance (40% of basic)',
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
                'affects_ctc' => true,
                'affects_epf' => true,
                'affects_esi' => true,
                'display_order' => 3,
                'description' => 'Dearness Allowance (10% of basic)',
            ],
            [
                'name' => 'Transport Allowance',
                'code' => 'TA',
                'type' => 'earning',
                'calculation_type' => 'fixed',
                'default_amount' => 1600.00,
                'is_taxable' => false,
                'affects_gross' => true,
                'affects_ctc' => true,
                'display_order' => 4,
                'description' => 'Transport Allowance (Tax-free up to ₹1,600)',
            ],
            [
                'name' => 'Medical Allowance',
                'code' => 'MA',
                'type' => 'earning',
                'calculation_type' => 'fixed',
                'default_amount' => 1250.00,
                'is_taxable' => false,
                'affects_gross' => true,
                'affects_ctc' => true,
                'display_order' => 5,
                'description' => 'Medical Allowance (Tax-free up to ₹15,000/year)',
            ],
            [
                'name' => 'Special Allowance',
                'code' => 'SPA',
                'type' => 'earning',
                'calculation_type' => 'fixed',
                'is_taxable' => true,
                'affects_gross' => true,
                'affects_ctc' => true,
                'display_order' => 6,
                'description' => 'Special Allowance (Fully taxable)',
            ],
            [
                'name' => 'Overtime',
                'code' => 'OT',
                'type' => 'earning',
                'calculation_type' => 'formula',
                'is_taxable' => true,
                'affects_gross' => true,
                'affects_ctc' => false,
                'show_if_zero' => false,
                'display_order' => 10,
                'description' => 'Overtime pay based on hours worked',
            ],
            [
                'name' => 'Performance Bonus',
                'code' => 'BONUS',
                'type' => 'earning',
                'calculation_type' => 'fixed',
                'is_taxable' => true,
                'affects_gross' => true,
                'affects_ctc' => false,
                'show_if_zero' => false,
                'display_order' => 11,
                'description' => 'Performance-based bonus',
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
                'affects_gross' => false,
                'affects_ctc' => true,
                'display_order' => 20,
                'description' => 'Employee Provident Fund (12% of basic)',
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
                'affects_gross' => false,
                'affects_ctc' => true,
                'display_order' => 21,
                'description' => 'Employee State Insurance (0.75% of gross, applicable if gross ≤ ₹21,000)',
            ],
            [
                'name' => 'Professional Tax',
                'code' => 'PT',
                'type' => 'deduction',
                'calculation_type' => 'slab',
                'is_taxable' => false,
                'is_statutory' => true,
                'affects_gross' => false,
                'affects_ctc' => true,
                'display_order' => 22,
                'description' => 'Professional Tax (State-specific)',
            ],
            [
                'name' => 'Income Tax (TDS)',
                'code' => 'TDS',
                'type' => 'deduction',
                'calculation_type' => 'formula',
                'is_taxable' => false,
                'is_statutory' => true,
                'affects_gross' => false,
                'affects_ctc' => false,
                'display_order' => 23,
                'description' => 'Tax Deducted at Source',
            ],
            [
                'name' => 'Loan Repayment',
                'code' => 'LOAN',
                'type' => 'deduction',
                'calculation_type' => 'fixed',
                'is_taxable' => false,
                'is_statutory' => false,
                'affects_gross' => false,
                'affects_ctc' => false,
                'show_if_zero' => false,
                'display_order' => 30,
                'description' => 'Employee loan repayment',
            ],
        ];

        foreach ($components as $component) {
            DB::table('salary_components')->insert(array_merge($component, [
                'is_active' => true,
                'show_in_payslip' => true,
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
        Schema::dropIfExists('salary_components');
    }
};
