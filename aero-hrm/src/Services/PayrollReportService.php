<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Payroll;
use App\Exports\PayrollReportExport;
use Carbon\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class PayrollReportService
{
    /**
     * Generate monthly payroll summary report
     */
    public function generateMonthlySummary($month, $year)
    {
        $startDate = Carbon::create($year, $month, 1);
        $endDate = $startDate->copy()->endOfMonth();

        $payrolls = Payroll::with(['employee', 'allowances', 'deductions'])
            ->whereBetween('pay_period_start', [$startDate, $endDate])
            ->where('status', 'processed')
            ->get();

        $summary = [
            'period' => $startDate->format('F Y'),
            'total_employees' => $payrolls->count(),
            'total_gross_salary' => $payrolls->sum('gross_salary'),
            'total_deductions' => $payrolls->sum('total_deductions'),
            'total_net_salary' => $payrolls->sum('net_salary'),
            'average_salary' => $payrolls->avg('net_salary'),
            'department_wise' => $this->getDepartmentWiseBreakdown($payrolls),
            'allowance_breakdown' => $this->getAllowanceBreakdown($payrolls),
            'deduction_breakdown' => $this->getDeductionBreakdown($payrolls),
            'generated_at' => now(),
        ];

        return $summary;
    }

    /**
     * Generate tax report
     */
    public function generateTaxReport($startDate, $endDate)
    {
        $payrolls = Payroll::with(['employee', 'deductions'])
            ->whereBetween('pay_period_start', [$startDate, $endDate])
            ->where('status', 'processed')
            ->get();

        $taxData = [];

        foreach ($payrolls as $payroll) {
            $employee = $payroll->employee;
            $taxDeductions = $payroll->deductions->whereIn('deduction_type', [
                'income_tax',
                'professional_tax',
                'pf_deduction',
                'esi_deduction',
            ]);

            $incomeTax = $taxDeductions->where('deduction_type', 'income_tax')->sum('amount');
            $professionalTax = $taxDeductions->where('deduction_type', 'professional_tax')->sum('amount');
            $pf = $taxDeductions->where('deduction_type', 'pf_deduction')->sum('amount');
            $esi = $taxDeductions->where('deduction_type', 'esi_deduction')->sum('amount');

            $taxData[] = [
                'employee_id' => $employee->employee_id ?? $employee->id,
                'employee_name' => $employee->name,
                'pan_number' => $employee->pan_number ?? 'N/A',
                'gross_salary' => $payroll->gross_salary,
                'income_tax' => $incomeTax,
                'professional_tax' => $professionalTax,
                'pf_deduction' => $pf,
                'esi_deduction' => $esi,
                'total_tax' => $incomeTax + $professionalTax + $pf + $esi,
                'net_salary' => $payroll->net_salary,
                'pay_period' => $payroll->pay_period_start->format('M Y'),
            ];
        }

        return [
            'period' => $startDate->format('M Y').' to '.$endDate->format('M Y'),
            'total_employees' => count($taxData),
            'total_income_tax' => collect($taxData)->sum('income_tax'),
            'total_professional_tax' => collect($taxData)->sum('professional_tax'),
            'total_pf' => collect($taxData)->sum('pf_deduction'),
            'total_esi' => collect($taxData)->sum('esi_deduction'),
            'employee_tax_data' => $taxData,
            'generated_at' => now(),
        ];
    }

    /**
     * Generate bank transfer report
     */
    public function generateBankTransferReport($payrollIds)
    {
        $payrolls = Payroll::with(['employee'])
            ->whereIn('id', $payrollIds)
            ->where('status', 'processed')
            ->get();

        $bankTransferData = [];
        $totalAmount = 0;

        foreach ($payrolls as $payroll) {
            $employee = $payroll->employee;

            $bankTransferData[] = [
                'employee_id' => $employee->employee_id ?? $employee->id,
                'employee_name' => $employee->name,
                'account_number' => $employee->bank_account ?? 'N/A',
                'ifsc_code' => $employee->ifsc_code ?? 'N/A',
                'bank_name' => $employee->bank_name ?? 'N/A',
                'net_salary' => $payroll->net_salary,
                'pay_period' => $payroll->pay_period_start->format('M Y'),
                'remarks' => 'Salary for '.$payroll->pay_period_start->format('M Y'),
            ];

            $totalAmount += $payroll->net_salary;
        }

        return [
            'transfer_date' => now()->format('Y-m-d'),
            'total_employees' => count($bankTransferData),
            'total_amount' => $totalAmount,
            'bank_transfer_data' => $bankTransferData,
            'generated_at' => now(),
        ];
    }

    /**
     * Generate statutory compliance report
     */
    public function generateStatutoryReport($month, $year)
    {
        $startDate = Carbon::create($year, $month, 1);
        $endDate = $startDate->copy()->endOfMonth();

        $payrolls = Payroll::with(['employee', 'deductions'])
            ->whereBetween('pay_period_start', [$startDate, $endDate])
            ->where('status', 'processed')
            ->get();

        $pfData = [];
        $esiData = [];
        $professionalTaxData = [];

        foreach ($payrolls as $payroll) {
            $employee = $payroll->employee;
            $deductions = $payroll->deductions;

            // PF Data
            $pfAmount = $deductions->where('deduction_type', 'pf_deduction')->sum('amount');
            if ($pfAmount > 0) {
                $pfData[] = [
                    'employee_id' => $employee->employee_id ?? $employee->id,
                    'employee_name' => $employee->name,
                    'uan_number' => $employee->uan_number ?? 'N/A',
                    'pf_number' => $employee->pf_number ?? 'N/A',
                    'basic_salary' => $payroll->basic_salary,
                    'employee_pf' => $pfAmount,
                    'employer_pf' => $pfAmount, // Employer contribution same as employee
                    'total_pf' => $pfAmount * 2,
                ];
            }

            // ESI Data
            $esiAmount = $deductions->where('deduction_type', 'esi_deduction')->sum('amount');
            if ($esiAmount > 0) {
                $esiData[] = [
                    'employee_id' => $employee->employee_id ?? $employee->id,
                    'employee_name' => $employee->name,
                    'esi_number' => $employee->esi_number ?? 'N/A',
                    'gross_salary' => $payroll->gross_salary,
                    'employee_esi' => $esiAmount,
                    'employer_esi' => $esiAmount * 3.25 / 0.75, // Employer: 3.25%, Employee: 0.75%
                    'total_esi' => $esiAmount + ($esiAmount * 3.25 / 0.75),
                ];
            }

            // Professional Tax Data
            $ptAmount = $deductions->where('deduction_type', 'professional_tax')->sum('amount');
            if ($ptAmount > 0) {
                $professionalTaxData[] = [
                    'employee_id' => $employee->employee_id ?? $employee->id,
                    'employee_name' => $employee->name,
                    'gross_salary' => $payroll->gross_salary,
                    'professional_tax' => $ptAmount,
                ];
            }
        }

        return [
            'period' => $startDate->format('F Y'),
            'pf_report' => [
                'total_employees' => count($pfData),
                'total_employee_pf' => collect($pfData)->sum('employee_pf'),
                'total_employer_pf' => collect($pfData)->sum('employer_pf'),
                'total_pf' => collect($pfData)->sum('total_pf'),
                'employee_data' => $pfData,
            ],
            'esi_report' => [
                'total_employees' => count($esiData),
                'total_employee_esi' => collect($esiData)->sum('employee_esi'),
                'total_employer_esi' => collect($esiData)->sum('employer_esi'),
                'total_esi' => collect($esiData)->sum('total_esi'),
                'employee_data' => $esiData,
            ],
            'professional_tax_report' => [
                'total_employees' => count($professionalTaxData),
                'total_professional_tax' => collect($professionalTaxData)->sum('professional_tax'),
                'employee_data' => $professionalTaxData,
            ],
            'generated_at' => now(),
        ];
    }

    /**
     * Generate salary comparison report
     */
    public function generateSalaryComparisonReport($currentMonth, $currentYear, $previousMonth, $previousYear)
    {
        $currentData = $this->generateMonthlySummary($currentMonth, $currentYear);
        $previousData = $this->generateMonthlySummary($previousMonth, $previousYear);

        return [
            'current_period' => $currentData,
            'previous_period' => $previousData,
            'comparison' => [
                'employee_change' => $currentData['total_employees'] - $previousData['total_employees'],
                'salary_change' => $currentData['total_net_salary'] - $previousData['total_net_salary'],
                'percentage_change' => $previousData['total_net_salary'] > 0
                    ? (($currentData['total_net_salary'] - $previousData['total_net_salary']) / $previousData['total_net_salary']) * 100
                    : 0,
                'average_salary_change' => $currentData['average_salary'] - $previousData['average_salary'],
            ],
            'generated_at' => now(),
        ];
    }

    /**
     * Export report to Excel
     */
    public function exportToExcel($reportData, $reportType, $filename = null)
    {
        if (! $filename) {
            $filename = $reportType.'_report_'.now()->format('Y_m_d_H_i_s').'.xlsx';
        }

        return Excel::download(new PayrollReportExport($reportData, $reportType), $filename);
    }

    /**
     * Get department-wise breakdown
     */
    protected function getDepartmentWiseBreakdown($payrolls)
    {
        $departmentData = [];

        foreach ($payrolls as $payroll) {
            $department = $payroll->employee->department ?? 'Unknown';

            if (! isset($departmentData[$department])) {
                $departmentData[$department] = [
                    'employee_count' => 0,
                    'total_gross' => 0,
                    'total_deductions' => 0,
                    'total_net' => 0,
                ];
            }

            $departmentData[$department]['employee_count']++;
            $departmentData[$department]['total_gross'] += $payroll->gross_salary;
            $departmentData[$department]['total_deductions'] += $payroll->total_deductions;
            $departmentData[$department]['total_net'] += $payroll->net_salary;
        }

        return $departmentData;
    }

    /**
     * Get allowance breakdown
     */
    protected function getAllowanceBreakdown($payrolls)
    {
        $allowanceData = [];

        foreach ($payrolls as $payroll) {
            foreach ($payroll->allowances as $allowance) {
                $type = $allowance->allowance_type;

                if (! isset($allowanceData[$type])) {
                    $allowanceData[$type] = [
                        'description' => $this->formatAllowanceType($type),
                        'total_amount' => 0,
                        'employee_count' => 0,
                    ];
                }

                $allowanceData[$type]['total_amount'] += $allowance->amount;
                $allowanceData[$type]['employee_count']++;
            }
        }

        return $allowanceData;
    }

    /**
     * Get deduction breakdown
     */
    protected function getDeductionBreakdown($payrolls)
    {
        $deductionData = [];

        foreach ($payrolls as $payroll) {
            foreach ($payroll->deductions as $deduction) {
                $type = $deduction->deduction_type;

                if (! isset($deductionData[$type])) {
                    $deductionData[$type] = [
                        'description' => $this->formatDeductionType($type),
                        'total_amount' => 0,
                        'employee_count' => 0,
                    ];
                }

                $deductionData[$type]['total_amount'] += $deduction->amount;
                $deductionData[$type]['employee_count']++;
            }
        }

        return $deductionData;
    }

    /**
     * Format allowance type
     */
    protected function formatAllowanceType($type)
    {
        $types = [
            'housing_allowance' => 'Housing Allowance',
            'transport_allowance' => 'Transport Allowance',
            'medical_allowance' => 'Medical Allowance',
            'performance_bonus' => 'Performance Bonus',
            'special_allowance' => 'Special Allowance',
        ];

        return $types[$type] ?? ucwords(str_replace('_', ' ', $type));
    }

    /**
     * Format deduction type
     */
    protected function formatDeductionType($type)
    {
        $types = [
            'income_tax' => 'Income Tax',
            'professional_tax' => 'Professional Tax',
            'pf_deduction' => 'Provident Fund',
            'esi_deduction' => 'Employee State Insurance',
            'loan_deduction' => 'Loan Deduction',
            'advance_deduction' => 'Advance Salary',
        ];

        return $types[$type] ?? ucwords(str_replace('_', ' ', $type));
    }
}
