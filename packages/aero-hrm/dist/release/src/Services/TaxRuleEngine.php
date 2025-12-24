<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\TaxSlab;
use Aero\Core\Support\TenantCache;
use Illuminate\Support\Facades\Log;

/**
 * Tax Rule Engine
 *
 * Configurable tax calculation engine with tenant-specific tax rules.
 * Supports multiple tax regimes, slabs, and deduction strategies.
 *
 * Features:
 * - Progressive tax calculation with unlimited slabs
 * - Professional tax with state-specific rules
 * - Configurable deduction strategies (standard/itemized)
 * - Tax exemptions and allowances
 * - Multi-year tax regime support
 * - Tenant isolation with caching
 *
 * @author HRM System
 *
 * @version 1.0.0
 */
class TaxRuleEngine
{
    /**
     * Tax configuration cache duration (minutes)
     */
    const CACHE_DURATION = 60;

    /**
     * Calculate comprehensive tax breakdown for an employee
     *
     * @param  float  $annualGrossSalary  Total annual gross salary
     * @param  array  $exemptions  Array of tax-exempt allowances
     * @param  array  $deductions  Array of eligible deductions (80C, 80D, etc.)
     * @param  array  $options  Additional calculation options
     * @return array Detailed tax breakdown
     */
    public function calculateTax(
        float $annualGrossSalary,
        array $exemptions = [],
        array $deductions = [],
        array $options = []
    ): array {
        // Get tax configuration
        $taxConfig = $this->getTaxConfiguration($options);

        // Step 1: Calculate gross taxable income
        $taxableIncome = $this->calculateTaxableIncome(
            $annualGrossSalary,
            $exemptions,
            $taxConfig
        );

        // Step 2: Apply deductions under various sections
        $totalDeductions = $this->applyDeductions($deductions, $taxConfig);

        // Step 3: Calculate net taxable income
        $netTaxableIncome = max(0, $taxableIncome - $totalDeductions);

        // Step 4: Calculate income tax using slab system
        $incomeTax = $this->calculateIncomeTaxFromSlabs(
            $netTaxableIncome,
            $taxConfig['regime']
        );

        // Step 5: Apply surcharge if applicable
        $surcharge = $this->calculateSurcharge($netTaxableIncome, $incomeTax, $taxConfig);

        // Step 6: Apply health and education cess
        $cess = $this->calculateCess($incomeTax, $surcharge, $taxConfig);

        // Step 7: Calculate total tax liability
        $totalTax = $incomeTax + $surcharge + $cess;

        // Step 8: Apply tax rebates if eligible
        $rebate = $this->calculateTaxRebate($netTaxableIncome, $totalTax, $taxConfig);
        $finalTax = max(0, $totalTax - $rebate);

        // Return comprehensive breakdown
        return [
            'annual_gross_salary' => $annualGrossSalary,
            'total_exemptions' => array_sum($exemptions),
            'taxable_income' => $taxableIncome,
            'total_deductions' => $totalDeductions,
            'net_taxable_income' => $netTaxableIncome,
            'income_tax' => $incomeTax,
            'surcharge' => $surcharge,
            'cess' => $cess,
            'tax_rebate' => $rebate,
            'total_tax_liability' => $finalTax,
            'monthly_tax_deduction' => round($finalTax / 12, 2),
            'effective_tax_rate' => $annualGrossSalary > 0
                ? round(($finalTax / $annualGrossSalary) * 100, 2)
                : 0,
            'tax_regime' => $taxConfig['regime'],
            'financial_year' => $taxConfig['financial_year'],
            'breakdown' => [
                'exemptions' => $exemptions,
                'deductions' => $deductions,
                'slab_wise_tax' => $this->getSlabWiseTaxBreakdown($netTaxableIncome, $taxConfig['regime']),
            ],
        ];
    }

    /**
     * Calculate taxable income after exemptions
     */
    protected function calculateTaxableIncome(
        float $grossSalary,
        array $exemptions,
        array $taxConfig
    ): float {
        $totalExemptions = 0;

        foreach ($exemptions as $key => $amount) {
            // Apply exemption limits based on tax configuration
            $limit = $taxConfig['exemption_limits'][$key] ?? PHP_FLOAT_MAX;
            $exemptAmount = min($amount, $limit);
            $totalExemptions += $exemptAmount;
        }

        return max(0, $grossSalary - $totalExemptions);
    }

    /**
     * Apply deductions under various sections (80C, 80D, etc.)
     */
    protected function applyDeductions(array $deductions, array $taxConfig): float
    {
        $totalDeductions = 0;

        foreach ($deductions as $section => $amount) {
            // Get section-specific limit
            $limit = $taxConfig['deduction_limits'][$section] ?? 0;
            $deductibleAmount = min($amount, $limit);
            $totalDeductions += $deductibleAmount;
        }

        return $totalDeductions;
    }

    /**
     * Calculate income tax using progressive slab system
     */
    protected function calculateIncomeTaxFromSlabs(float $income, string $regime): float
    {
        $slabs = $this->getTaxSlabs($regime);

        if ($slabs->isEmpty()) {
            Log::warning("No tax slabs found for regime: {$regime}");

            return 0;
        }

        $totalTax = 0;
        $remainingIncome = $income;

        foreach ($slabs as $slab) {
            if ($remainingIncome <= 0) {
                break;
            }

            // Calculate taxable amount in this slab
            $slabRange = $slab->max_income - $slab->min_income;
            $taxableInSlab = min($remainingIncome, $slabRange);

            // Apply tax rate
            $taxInSlab = $taxableInSlab * ($slab->tax_rate / 100);
            $totalTax += $taxInSlab;

            // Reduce remaining income
            $remainingIncome -= $taxableInSlab;
        }

        return round($totalTax, 2);
    }

    /**
     * Get slab-wise tax breakdown for display
     */
    protected function getSlabWiseTaxBreakdown(float $income, string $regime): array
    {
        $slabs = $this->getTaxSlabs($regime);
        $breakdown = [];
        $remainingIncome = $income;

        foreach ($slabs as $slab) {
            if ($remainingIncome <= 0) {
                break;
            }

            $slabRange = $slab->max_income - $slab->min_income;
            $taxableInSlab = min($remainingIncome, $slabRange);
            $taxInSlab = $taxableInSlab * ($slab->tax_rate / 100);

            $breakdown[] = [
                'slab_name' => $slab->name,
                'min_income' => $slab->min_income,
                'max_income' => $slab->max_income,
                'rate' => $slab->tax_rate,
                'taxable_amount' => round($taxableInSlab, 2),
                'tax_amount' => round($taxInSlab, 2),
            ];

            $remainingIncome -= $taxableInSlab;
        }

        return $breakdown;
    }

    /**
     * Calculate surcharge based on income level
     */
    protected function calculateSurcharge(float $income, float $tax, array $config): float
    {
        foreach ($config['surcharge_rates'] as $threshold => $rate) {
            if ($income > $threshold) {
                return round($tax * ($rate / 100), 2);
            }
        }

        return 0;
    }

    /**
     * Calculate health and education cess
     */
    protected function calculateCess(float $tax, float $surcharge, array $config): float
    {
        $cessRate = $config['cess_rate'] ?? 4; // 4% default

        return round(($tax + $surcharge) * ($cessRate / 100), 2);
    }

    /**
     * Calculate tax rebate (e.g., Section 87A)
     */
    protected function calculateTaxRebate(float $income, float $tax, array $config): float
    {
        $rebateLimit = $config['rebate_income_limit'] ?? 0;
        $maxRebate = $config['max_rebate_amount'] ?? 0;

        if ($income <= $rebateLimit && $maxRebate > 0) {
            return min($tax, $maxRebate);
        }

        return 0;
    }

    /**
     * Calculate professional tax
     *
     * State-specific professional tax calculation
     */
    public function calculateProfessionalTax(
        float $monthlySalary,
        ?string $state = null
    ): float {
        $taxConfig = $this->getTaxConfiguration(['state' => $state]);
        $ptSlabs = $taxConfig['professional_tax_slabs'] ?? [];

        foreach ($ptSlabs as $slab) {
            if ($monthlySalary >= $slab['min'] && $monthlySalary <= $slab['max']) {
                return $slab['amount'];
            }
        }

        return 0;
    }

    /**
     * Get tax slabs for a specific regime
     */
    protected function getTaxSlabs(string $regime): \Illuminate\Support\Collection
    {
        $cacheKey = "tax_slabs_{$regime}_".tenant('id');

        return TenantCache::remember($cacheKey, self::CACHE_DURATION, function () use ($regime) {
            return TaxSlab::where('is_active', true)
                ->where('regime', $regime)
                ->orderBy('min_income')
                ->get();
        });
    }

    /**
     * Get tax configuration for tenant
     */
    protected function getTaxConfiguration(array $options = []): array
    {
        $tenantId = tenant('id');
        $cacheKey = "tax_config_{$tenantId}";

        $config = TenantCache::remember($cacheKey, self::CACHE_DURATION, function () {
            return [
                'regime' => 'new', // 'old' or 'new'
                'financial_year' => date('Y').'-'.(date('Y') + 1),
                'exemption_limits' => [
                    'hra' => 50000,
                    'lta' => 25000,
                    'medical' => 15000,
                    'transport' => 19200,
                ],
                'deduction_limits' => [
                    '80C' => 150000, // PF, PPF, Insurance, etc.
                    '80D' => 25000,  // Health insurance
                    '80E' => PHP_FLOAT_MAX, // Education loan interest
                    '80G' => PHP_FLOAT_MAX, // Donations
                ],
                'surcharge_rates' => [
                    5000000 => 10,  // 10% surcharge above 50 lakhs
                    10000000 => 15, // 15% surcharge above 1 crore
                ],
                'cess_rate' => 4, // 4% health and education cess
                'rebate_income_limit' => 500000, // Section 87A rebate limit
                'max_rebate_amount' => 12500,    // Max rebate under 87A
                'professional_tax_slabs' => $this->getDefaultProfessionalTaxSlabs(),
            ];
        });

        // Override with options
        if (isset($options['regime'])) {
            $config['regime'] = $options['regime'];
        }

        if (isset($options['financial_year'])) {
            $config['financial_year'] = $options['financial_year'];
        }

        return $config;
    }

    /**
     * Get default professional tax slabs (Maharashtra example)
     */
    protected function getDefaultProfessionalTaxSlabs(): array
    {
        return [
            ['min' => 0, 'max' => 7500, 'amount' => 0],
            ['min' => 7501, 'max' => 10000, 'amount' => 175],
            ['min' => 10001, 'max' => PHP_FLOAT_MAX, 'amount' => 200],
        ];
    }

    /**
     * Calculate tax for multiple employees (bulk processing)
     */
    public function calculateBulkTax(array $employees, array $options = []): array
    {
        $results = [];

        foreach ($employees as $employee) {
            try {
                $tax = $this->calculateTax(
                    $employee['annual_gross_salary'] ?? 0,
                    $employee['exemptions'] ?? [],
                    $employee['deductions'] ?? [],
                    $options
                );

                $results[$employee['id']] = [
                    'success' => true,
                    'data' => $tax,
                ];
            } catch (\Exception $e) {
                $results[$employee['id']] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];

                Log::error("Tax calculation failed for employee {$employee['id']}: ".$e->getMessage());
            }
        }

        return $results;
    }

    /**
     * Clear tax configuration cache
     */
    public function clearCache(): void
    {
        $tenantId = tenant('id');
        TenantCache::forget("tax_config_{$tenantId}");
        TenantCache::forget("tax_slabs_old_{$tenantId}");
        TenantCache::forget("tax_slabs_new_{$tenantId}");
    }

    /**
     * Validate tax configuration
     */
    public function validateConfiguration(array $config): array
    {
        $errors = [];

        // Check required fields
        $required = ['regime', 'financial_year', 'exemption_limits', 'deduction_limits'];
        foreach ($required as $field) {
            if (! isset($config[$field])) {
                $errors[] = "Missing required field: {$field}";
            }
        }

        // Validate regime
        if (isset($config['regime']) && ! in_array($config['regime'], ['old', 'new'])) {
            $errors[] = "Invalid regime. Must be 'old' or 'new'";
        }

        // Validate numeric values
        if (isset($config['cess_rate']) && ($config['cess_rate'] < 0 || $config['cess_rate'] > 100)) {
            $errors[] = 'Cess rate must be between 0 and 100';
        }

        return $errors;
    }
}
