<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tax Configuration Tables Migration
 *
 * Creates comprehensive tax management infrastructure:
 * - Tax slabs with multiple regimes (old/new)
 * - Professional tax configuration
 * - Tax exemptions and deductions
 * - Tax settings per tenant
 *
 * Supports:
 * - Progressive tax calculation
 * - State-specific professional tax
 * - Multiple tax regimes per financial year
 * - Flexible exemption and deduction rules
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // =====================================================================
        // TAX SLABS - Income tax brackets with progressive rates
        // =====================================================================
        if (! Schema::hasTable('tax_slabs')) {
            Schema::create('tax_slabs', function (Blueprint $table) {
                $table->id();
                $table->string('name'); // E.g., "₹0 - ₹2.5 Lakhs"
                $table->decimal('min_income', 15, 2)->default(0);
                $table->decimal('max_income', 15, 2);
                $table->decimal('tax_rate', 5, 2); // Percentage (e.g., 5.00 for 5%)

                // Tax regime support (old vs new tax regime)
                $table->enum('regime', ['old', 'new'])->default('new');
                $table->string('financial_year', 20); // E.g., "2024-2025"

                // Geo-specific (for future: state-specific taxes)
                $table->string('country', 3)->default('BD');
                $table->string('state', 100)->nullable();

                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);

                $table->timestamps();
                $table->softDeletes();

                // Indexes for performance
                $table->index(['regime', 'financial_year', 'is_active']);
                $table->index(['min_income', 'max_income']);
            });
        }

        // =====================================================================
        // PROFESSIONAL TAX SLABS - State-specific professional tax
        // =====================================================================
        if (! Schema::hasTable('professional_tax_slabs')) {
            Schema::create('professional_tax_slabs', function (Blueprint $table) {
                $table->id();
                $table->string('state'); // State code or name
                $table->decimal('min_salary', 12, 2)->default(0);
                $table->decimal('max_salary', 12, 2);
                $table->decimal('tax_amount', 10, 2); // Fixed amount per month

                $table->string('financial_year', 20);
                $table->boolean('is_active')->default(true);
                $table->text('description')->nullable();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['state', 'financial_year', 'is_active']);
            });
        }

        // =====================================================================
        // TAX EXEMPTIONS - Configurable exemption rules
        // =====================================================================
        if (! Schema::hasTable('tax_exemptions')) {
            Schema::create('tax_exemptions', function (Blueprint $table) {
                $table->id();
                $table->string('code', 50)->unique(); // E.g., 'HRA', 'LTA', 'MEDICAL'
                $table->string('name'); // E.g., "House Rent Allowance"
                $table->text('description')->nullable();

                // Exemption limits
                $table->decimal('max_exemption_amount', 15, 2)->nullable();
                $table->decimal('percentage_limit', 5, 2)->nullable(); // % of salary

                // Applicability
                $table->enum('regime', ['old', 'new', 'both'])->default('both');
                $table->string('financial_year', 20);
                $table->boolean('requires_proof')->default(false);

                $table->boolean('is_active')->default(true);
                $table->integer('display_order')->default(0);

                $table->timestamps();
                $table->softDeletes();

                $table->index(['regime', 'financial_year', 'is_active']);
            });
        }

        // =====================================================================
        // TAX DEDUCTIONS - Section-wise deduction rules (80C, 80D, etc.)
        // =====================================================================
        if (! Schema::hasTable('tax_deductions')) {
            Schema::create('tax_deductions', function (Blueprint $table) {
                $table->id();
                $table->string('section_code', 20)->unique(); // E.g., '80C', '80D'
                $table->string('name'); // E.g., "Section 80C - Investments"
                $table->text('description')->nullable();

                // Deduction limits
                $table->decimal('max_deduction_amount', 15, 2);
                $table->boolean('is_unlimited')->default(false);

                // Applicability
                $table->enum('regime', ['old', 'new', 'both'])->default('old');
                $table->string('financial_year', 20);
                $table->json('applicable_components')->nullable(); // Which salary components qualify

                $table->boolean('is_active')->default(true);
                $table->integer('display_order')->default(0);

                $table->timestamps();
                $table->softDeletes();

                $table->index(['regime', 'financial_year', 'is_active']);
            });
        }

        // =====================================================================
        // TAX SETTINGS - Tenant-specific tax configuration
        // =====================================================================
        if (! Schema::hasTable('tax_settings')) {
            Schema::create('tax_settings', function (Blueprint $table) {
                $table->id();

                // Default tax regime for new employees
                $table->enum('default_tax_regime', ['old', 'new'])->default('new');
                $table->string('current_financial_year', 20);

                // Surcharge configuration
                $table->json('surcharge_rates')->nullable(); // e.g., {"5000000": 10, "10000000": 15}

                // Cess configuration
                $table->decimal('cess_rate', 5, 2)->default(4.00); // Health & Education Cess

                // Rebate configuration (e.g., Section 87A)
                $table->decimal('rebate_income_limit', 15, 2)->default(500000);
                $table->decimal('max_rebate_amount', 10, 2)->default(12500);

                // Professional Tax
                $table->boolean('enable_professional_tax')->default(true);
                $table->string('professional_tax_state')->nullable();

                // TDS settings
                $table->boolean('auto_calculate_tds')->default(true);
                $table->boolean('consider_previous_employer_tds')->default(true);

                // Standard deduction (applicable in new regime)
                $table->decimal('standard_deduction', 12, 2)->default(50000);

                $table->timestamps();
            });

            // Insert default settings
            DB::table('tax_settings')->insert([
                'default_tax_regime' => 'new',
                'current_financial_year' => date('Y').'-'.(date('Y') + 1),
                'surcharge_rates' => json_encode(['5000000' => 10, '10000000' => 15]),
                'cess_rate' => 4.00,
                'rebate_income_limit' => 500000,
                'max_rebate_amount' => 12500,
                'enable_professional_tax' => true,
                'auto_calculate_tds' => true,
                'consider_previous_employer_tds' => true,
                'standard_deduction' => 50000,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // =====================================================================
        // EMPLOYEE TAX DECLARATIONS - Employee-specific tax choices
        // =====================================================================
        if (! Schema::hasTable('employee_tax_declarations')) {
            Schema::create('employee_tax_declarations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('financial_year', 20);

                // Regime choice
                $table->enum('chosen_tax_regime', ['old', 'new']);

                // Declared investments and savings (Section 80C)
                $table->decimal('section_80c_amount', 12, 2)->default(0);
                $table->json('section_80c_breakdown')->nullable(); // PPF, LIC, etc.

                // Health insurance (Section 80D)
                $table->decimal('section_80d_amount', 12, 2)->default(0);

                // Home loan interest (Section 24)
                $table->decimal('section_24_amount', 12, 2)->default(0);

                // Other deductions
                $table->json('other_deductions')->nullable();

                // HRA details
                $table->decimal('hra_claimed', 12, 2)->default(0);
                $table->json('hra_details')->nullable(); // Rent receipts, landlord details

                // Status
                $table->enum('status', ['draft', 'submitted', 'verified', 'rejected'])->default('draft');
                $table->date('submitted_at')->nullable();
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->date('verified_at')->nullable();
                $table->text('verification_notes')->nullable();

                $table->timestamps();
                $table->softDeletes();

                $table->index(['user_id', 'financial_year']);
                $table->index('status');
            });
        }

        // Seed default tax slabs for FY 2024-25 (New Regime)
        $this->seedDefaultTaxSlabs();
    }

    /**
     * Seed default tax slabs
     */
    protected function seedDefaultTaxSlabs(): void
    {
        $financialYear = date('Y').'-'.(date('Y') + 1);

        // New Tax Regime Slabs (FY 2024-25)
        $newRegimeSlabs = [
            ['name' => '₹0 - ₹3 Lakhs', 'min' => 0, 'max' => 300000, 'rate' => 0],
            ['name' => '₹3 - ₹7 Lakhs', 'min' => 300000, 'max' => 700000, 'rate' => 5],
            ['name' => '₹7 - ₹10 Lakhs', 'min' => 700000, 'max' => 1000000, 'rate' => 10],
            ['name' => '₹10 - ₹12 Lakhs', 'min' => 1000000, 'max' => 1200000, 'rate' => 15],
            ['name' => '₹12 - ₹15 Lakhs', 'min' => 1200000, 'max' => 1500000, 'rate' => 20],
            ['name' => 'Above ₹15 Lakhs', 'min' => 1500000, 'max' => 99999999, 'rate' => 30],
        ];

        foreach ($newRegimeSlabs as $slab) {
            DB::table('tax_slabs')->insert([
                'name' => $slab['name'],
                'min_income' => $slab['min'],
                'max_income' => $slab['max'],
                'tax_rate' => $slab['rate'],
                'regime' => 'new',
                'financial_year' => $financialYear,
                'country' => 'IND',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Old Tax Regime Slabs
        $oldRegimeSlabs = [
            ['name' => '₹0 - ₹2.5 Lakhs', 'min' => 0, 'max' => 250000, 'rate' => 0],
            ['name' => '₹2.5 - ₹5 Lakhs', 'min' => 250000, 'max' => 500000, 'rate' => 5],
            ['name' => '₹5 - ₹10 Lakhs', 'min' => 500000, 'max' => 1000000, 'rate' => 20],
            ['name' => 'Above ₹10 Lakhs', 'min' => 1000000, 'max' => 99999999, 'rate' => 30],
        ];

        foreach ($oldRegimeSlabs as $slab) {
            DB::table('tax_slabs')->insert([
                'name' => $slab['name'],
                'min_income' => $slab['min'],
                'max_income' => $slab['max'],
                'tax_rate' => $slab['rate'],
                'regime' => 'old',
                'financial_year' => $financialYear,
                'country' => 'IND',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Professional Tax Slabs (Maharashtra example)
        DB::table('professional_tax_slabs')->insert([
            ['state' => 'Maharashtra', 'min_salary' => 0, 'max_salary' => 7500, 'tax_amount' => 0, 'financial_year' => $financialYear, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['state' => 'Maharashtra', 'min_salary' => 7501, 'max_salary' => 10000, 'tax_amount' => 175, 'financial_year' => $financialYear, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['state' => 'Maharashtra', 'min_salary' => 10001, 'max_salary' => 99999999, 'tax_amount' => 200, 'financial_year' => $financialYear, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // Common tax exemptions
        $exemptions = [
            ['code' => 'HRA', 'name' => 'House Rent Allowance', 'max_exemption_amount' => null, 'percentage_limit' => 50.00, 'regime' => 'old', 'requires_proof' => true],
            ['code' => 'LTA', 'name' => 'Leave Travel Allowance', 'max_exemption_amount' => 50000, 'percentage_limit' => null, 'regime' => 'old', 'requires_proof' => true],
            ['code' => 'MEDICAL', 'name' => 'Medical Allowance', 'max_exemption_amount' => 15000, 'percentage_limit' => null, 'regime' => 'old', 'requires_proof' => true],
            ['code' => 'TRANSPORT', 'name' => 'Transport Allowance', 'max_exemption_amount' => 19200, 'percentage_limit' => null, 'regime' => 'old', 'requires_proof' => false],
        ];

        foreach ($exemptions as $index => $exemption) {
            DB::table('tax_exemptions')->insert(array_merge($exemption, [
                'financial_year' => $financialYear,
                'is_active' => true,
                'display_order' => $index + 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]));
        }

        // Common deduction sections
        $deductions = [
            ['section_code' => '80C', 'name' => 'Section 80C - Investments & Savings', 'max_deduction_amount' => 150000, 'is_unlimited' => false, 'regime' => 'old', 'description' => 'PPF, EPF, LIC, ELSS, NSC, etc.'],
            ['section_code' => '80D', 'name' => 'Section 80D - Health Insurance', 'max_deduction_amount' => 25000, 'is_unlimited' => false, 'regime' => 'old', 'description' => 'Health insurance premiums'],
            ['section_code' => '80E', 'name' => 'Section 80E - Education Loan Interest', 'max_deduction_amount' => 99999999, 'is_unlimited' => true, 'regime' => 'old', 'description' => 'Interest on education loan'],
            ['section_code' => '80G', 'name' => 'Section 80G - Donations', 'max_deduction_amount' => 99999999, 'is_unlimited' => true, 'regime' => 'old', 'description' => 'Donations to approved institutions'],
        ];

        foreach ($deductions as $index => $deduction) {
            DB::table('tax_deductions')->insert(array_merge($deduction, [
                'financial_year' => $financialYear,
                'is_active' => true,
                'display_order' => $index + 1,
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
        Schema::dropIfExists('employee_tax_declarations');
        Schema::dropIfExists('tax_settings');
        Schema::dropIfExists('tax_deductions');
        Schema::dropIfExists('tax_exemptions');
        Schema::dropIfExists('professional_tax_slabs');
        Schema::dropIfExists('tax_slabs');
    }
};
