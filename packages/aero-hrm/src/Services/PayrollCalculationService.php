<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Payroll;
use Aero\HRM\Models\PayrollAllowance;
use Aero\HRM\Models\PayrollDeduction;
use Aero\Core\Models\User;
use Carbon\Carbon;

class PayrollCalculationService
{
    protected $taxEngine;

    public function __construct(TaxRuleEngine $taxEngine)
    {
        $this->taxEngine = $taxEngine;
    }

    /**
     * Calculate comprehensive payroll for an employee
     */
    public function calculatePayroll(User $employee, Carbon $payPeriodStart, Carbon $payPeriodEnd, array $additionalData = [])
    {
        $workingDays = $this->getWorkingDays($payPeriodStart, $payPeriodEnd);
        $attendanceData = $this->getAttendanceData($employee, $payPeriodStart, $payPeriodEnd);

        $basicSalary = $employee->salary ?? 0;
        $dailySalary = $basicSalary / $workingDays;

        // Calculate attendance-based adjustments
        $absentDeduction = $dailySalary * $attendanceData['absent_days'];
        $adjustedBasicSalary = $basicSalary - $absentDeduction;

        // Calculate overtime
        $overtimeAmount = $this->calculateOvertime($attendanceData['overtime_hours'], $dailySalary);

        // Calculate allowances
        $allowances = $this->calculateAllowances($employee, $adjustedBasicSalary, $additionalData);
        $totalAllowances = array_sum(array_column($allowances, 'amount')) + $overtimeAmount;

        // Calculate gross salary
        $grossSalary = $adjustedBasicSalary + $totalAllowances;

        // Calculate tax deductions
        $taxDeductions = $this->calculateTaxDeductions($employee, $grossSalary);

        // Calculate statutory deductions
        $statutoryDeductions = $this->calculateStatutoryDeductions($employee, $grossSalary);

        // Calculate other deductions
        $otherDeductions = $this->calculateOtherDeductions($employee, $additionalData);

        // Total deductions
        $totalDeductions = array_sum(array_column($taxDeductions, 'amount')) +
            array_sum(array_column($statutoryDeductions, 'amount')) +
            array_sum(array_column($otherDeductions, 'amount'));

        // Calculate net salary
        $netSalary = $grossSalary - $totalDeductions;

        return [
            'basic_salary' => $adjustedBasicSalary,
            'gross_salary' => $grossSalary,
            'total_allowances' => $totalAllowances,
            'total_deductions' => $totalDeductions,
            'net_salary' => $netSalary,
            'working_days' => $workingDays,
            'present_days' => $attendanceData['present_days'],
            'absent_days' => $attendanceData['absent_days'],
            'leave_days' => $attendanceData['leave_days'],
            'overtime_hours' => $attendanceData['overtime_hours'],
            'overtime_amount' => $overtimeAmount,
            'allowances' => $allowances,
            'tax_deductions' => $taxDeductions,
            'statutory_deductions' => $statutoryDeductions,
            'other_deductions' => $otherDeductions,
        ];
    }

    /**
     * Calculate income tax based on tax slabs using TaxRuleEngine
     */
    public function calculateIncomeTax($annualIncome, $employee)
    {
        // Get employee's tax regime preference (default to 'new')
        $regime = $employee->tax_regime ?? 'new';

        // Use TaxRuleEngine for comprehensive calculation
        $taxCalculation = $this->taxEngine->calculateTax(
            $annualIncome,
            [], // Exemptions (can be added from employee profile)
            [], // Deductions (can be added from employee declarations)
            ['regime' => $regime]
        );

        // Return monthly tax deduction
        return $taxCalculation['monthly_tax_deduction'];
    }

    /**
     * Calculate professional tax using TaxRuleEngine
     */
    public function calculateProfessionalTax($grossSalary)
    {
        // Get employee's state from profile (default to null)
        $state = tenant('professional_tax_state');

        return $this->taxEngine->calculateProfessionalTax($grossSalary, $state);
    }

    /**
     * Calculate PF (Provident Fund)
     */
    public function calculatePF($basicSalary, $employee)
    {
        $pfRate = $employee->pf_rate ?? 12; // 12% default
        $pfCap = 15000; // PF calculation cap

        $pfBaseSalary = min($basicSalary, $pfCap);

        return $pfBaseSalary * ($pfRate / 100);
    }

    /**
     * Calculate ESI (Employee State Insurance)
     */
    public function calculateESI($grossSalary, $employee)
    {
        $esiRate = $employee->esi_rate ?? 0.75; // 0.75% default
        $esiCap = 25000; // ESI applicable up to 25k

        if ($grossSalary <= $esiCap) {
            return $grossSalary * ($esiRate / 100);
        }

        return 0;
    }

    /**
     * Calculate overtime amount
     */
    protected function calculateOvertime($overtimeHours, $dailySalary)
    {
        if ($overtimeHours <= 0) {
            return 0;
        }

        $hourlyRate = $dailySalary / 8; // 8 hours per day

        return $overtimeHours * $hourlyRate * 1.5; // 1.5x rate for overtime
    }

    /**
     * Calculate standard allowances
     */
    protected function calculateAllowances($employee, $basicSalary, $additionalData)
    {
        $allowances = [];

        // Housing Allowance (40% of basic salary for metro cities, 30% for others)
        $housingRate = $employee->city_type === 'metro' ? 40 : 30;
        $allowances[] = [
            'type' => 'housing_allowance',
            'amount' => $basicSalary * ($housingRate / 100),
            'is_taxable' => true,
            'description' => 'Housing Allowance',
        ];

        // Transport Allowance (flat rate, tax-free up to 1600)
        $transportAllowance = min(1600, $employee->transport_allowance ?? 1600);
        $allowances[] = [
            'type' => 'transport_allowance',
            'amount' => $transportAllowance,
            'is_taxable' => false,
            'description' => 'Transport Allowance',
        ];

        // Medical Allowance (flat rate, tax-free up to 1250)
        $medicalAllowance = min(1250, $employee->medical_allowance ?? 1000);
        $allowances[] = [
            'type' => 'medical_allowance',
            'amount' => $medicalAllowance,
            'is_taxable' => false,
            'description' => 'Medical Allowance',
        ];

        // Performance Bonus (if applicable)
        if (isset($additionalData['performance_bonus'])) {
            $allowances[] = [
                'type' => 'performance_bonus',
                'amount' => $additionalData['performance_bonus'],
                'is_taxable' => true,
                'description' => 'Performance Bonus',
            ];
        }

        return $allowances;
    }

    /**
     * Calculate tax deductions
     */
    protected function calculateTaxDeductions($employee, $grossSalary)
    {
        $deductions = [];

        // Income Tax
        $annualGross = $grossSalary * 12;
        $incomeTax = $this->calculateIncomeTax($annualGross, $employee);

        if ($incomeTax > 0) {
            $deductions[] = [
                'type' => 'income_tax',
                'amount' => $incomeTax,
                'description' => 'Income Tax',
            ];
        }

        // Professional Tax
        $professionalTax = $this->calculateProfessionalTax($grossSalary);
        if ($professionalTax > 0) {
            $deductions[] = [
                'type' => 'professional_tax',
                'amount' => $professionalTax,
                'description' => 'Professional Tax',
            ];
        }

        return $deductions;
    }

    /**
     * Calculate statutory deductions
     */
    protected function calculateStatutoryDeductions($employee, $grossSalary)
    {
        $deductions = [];

        // PF Deduction
        $pfAmount = $this->calculatePF($grossSalary, $employee);
        if ($pfAmount > 0) {
            $deductions[] = [
                'type' => 'pf_deduction',
                'amount' => $pfAmount,
                'description' => 'Provident Fund',
            ];
        }

        // ESI Deduction
        $esiAmount = $this->calculateESI($grossSalary, $employee);
        if ($esiAmount > 0) {
            $deductions[] = [
                'type' => 'esi_deduction',
                'amount' => $esiAmount,
                'description' => 'Employee State Insurance',
            ];
        }

        return $deductions;
    }

    /**
     * Calculate other deductions
     */
    protected function calculateOtherDeductions($employee, $additionalData)
    {
        $deductions = [];

        // Loan Deductions
        if (isset($additionalData['loan_deduction'])) {
            $deductions[] = [
                'type' => 'loan_deduction',
                'amount' => $additionalData['loan_deduction'],
                'description' => 'Loan Deduction',
            ];
        }

        // Advance Salary Deduction
        if (isset($additionalData['advance_deduction'])) {
            $deductions[] = [
                'type' => 'advance_deduction',
                'amount' => $additionalData['advance_deduction'],
                'description' => 'Advance Salary Deduction',
            ];
        }

        return $deductions;
    }

    /**
     * Get working days in the pay period
     */
    protected function getWorkingDays($startDate, $endDate)
    {
        $workingDays = 0;
        $current = $startDate->copy();

        while ($current <= $endDate) {
            // Skip weekends (Saturday = 6, Sunday = 0)
            if (! in_array($current->dayOfWeek, [0, 6])) {
                $workingDays++;
            }
            $current->addDay();
        }

        return $workingDays;
    }

    /**
     * Get attendance data for the employee in the pay period
     */
    protected function getAttendanceData($employee, $startDate, $endDate)
    {
        // This would integrate with the attendance system
        // For now, returning mock data - should be replaced with actual attendance queries

        return [
            'present_days' => 22,
            'absent_days' => 1,
            'leave_days' => 2,
            'overtime_hours' => 10,
        ];
    }

    /**
     * Process bulk payroll for multiple employees
     */
    public function processBulkPayroll($employeeIds, $payPeriodStart, $payPeriodEnd, $processedBy)
    {
        $results = [];

        foreach ($employeeIds as $employeeId) {
            $employee = User::find($employeeId);
            if (! $employee) {
                continue;
            }

            try {
                $calculation = $this->calculatePayroll($employee, $payPeriodStart, $payPeriodEnd);

                // Create payroll record
                $payroll = Payroll::create([
                    'user_id' => $employee->id,
                    'pay_period_start' => $payPeriodStart,
                    'pay_period_end' => $payPeriodEnd,
                    'basic_salary' => $calculation['basic_salary'],
                    'gross_salary' => $calculation['gross_salary'],
                    'total_deductions' => $calculation['total_deductions'],
                    'net_salary' => $calculation['net_salary'],
                    'working_days' => $calculation['working_days'],
                    'present_days' => $calculation['present_days'],
                    'absent_days' => $calculation['absent_days'],
                    'leave_days' => $calculation['leave_days'],
                    'overtime_hours' => $calculation['overtime_hours'],
                    'overtime_amount' => $calculation['overtime_amount'],
                    'status' => 'draft',
                    'processed_by' => $processedBy,
                ]);

                // Add allowances
                foreach ($calculation['allowances'] as $allowance) {
                    PayrollAllowance::create([
                        'payroll_id' => $payroll->id,
                        'allowance_type' => $allowance['type'],
                        'amount' => $allowance['amount'],
                        'is_taxable' => $allowance['is_taxable'],
                        'description' => $allowance['description'],
                    ]);
                }

                // Add deductions
                $allDeductions = array_merge(
                    $calculation['tax_deductions'],
                    $calculation['statutory_deductions'],
                    $calculation['other_deductions']
                );

                foreach ($allDeductions as $deduction) {
                    PayrollDeduction::create([
                        'payroll_id' => $payroll->id,
                        'deduction_type' => $deduction['type'],
                        'amount' => $deduction['amount'],
                        'description' => $deduction['description'],
                    ]);
                }

                $results[] = [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->name,
                    'payroll_id' => $payroll->id,
                    'status' => 'success',
                    'net_salary' => $calculation['net_salary'],
                ];
            } catch (\Exception $e) {
                $results[] = [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->name,
                    'status' => 'error',
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }
}
