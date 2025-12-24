<?php

namespace Aero\HRM\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Loan Deduction Service
 *
 * Manages employee loans, advances, and automatic payroll deductions.
 * Supports various loan types with flexible repayment schedules.
 */
class LoanDeductionService
{
    /**
     * Loan types.
     */
    public const TYPE_SALARY_ADVANCE = 'salary_advance';
    public const TYPE_PERSONAL_LOAN = 'personal_loan';
    public const TYPE_EMERGENCY_LOAN = 'emergency_loan';
    public const TYPE_HOUSING_LOAN = 'housing_loan';
    public const TYPE_VEHICLE_LOAN = 'vehicle_loan';
    public const TYPE_EDUCATION_LOAN = 'education_loan';

    /**
     * Loan statuses.
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_ACTIVE = 'active';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_DEFAULTED = 'defaulted';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Repayment frequencies.
     */
    public const FREQUENCY_MONTHLY = 'monthly';
    public const FREQUENCY_BI_WEEKLY = 'bi_weekly';
    public const FREQUENCY_WEEKLY = 'weekly';

    /**
     * Apply for a loan.
     */
    public function applyForLoan(array $data): array
    {
        // Validate loan eligibility
        $eligibility = $this->checkEligibility($data['employee_id'], $data['type'], $data['amount']);

        if (!$eligibility['eligible']) {
            return [
                'success' => false,
                'error' => $eligibility['reason'],
                'eligibility' => $eligibility,
            ];
        }

        $loanId = Str::uuid()->toString();

        // Calculate repayment schedule
        $schedule = $this->calculateRepaymentSchedule(
            $data['amount'],
            $data['interest_rate'] ?? $this->getDefaultInterestRate($data['type']),
            $data['tenure_months'],
            $data['start_date'] ?? now()->addMonth()->startOfMonth(),
            $data['frequency'] ?? self::FREQUENCY_MONTHLY
        );

        $loan = [
            'id' => $loanId,
            'employee_id' => $data['employee_id'],
            'type' => $data['type'],
            'status' => self::STATUS_PENDING,
            'principal_amount' => $data['amount'],
            'interest_rate' => $data['interest_rate'] ?? $this->getDefaultInterestRate($data['type']),
            'tenure_months' => $data['tenure_months'],
            'frequency' => $data['frequency'] ?? self::FREQUENCY_MONTHLY,
            'emi_amount' => $schedule['emi_amount'],
            'total_interest' => $schedule['total_interest'],
            'total_payable' => $schedule['total_payable'],
            'disbursement_date' => null,
            'first_deduction_date' => $data['start_date'] ?? now()->addMonth()->startOfMonth()->toDateString(),
            'last_deduction_date' => $schedule['end_date'],
            'purpose' => $data['purpose'] ?? null,
            'guarantor_id' => $data['guarantor_id'] ?? null,
            'documents' => $data['documents'] ?? [],
            'applied_at' => now()->toIso8601String(),
            'approved_by' => null,
            'approved_at' => null,
            'remarks' => null,
            'repayment_schedule' => $schedule['installments'],
            'metadata' => [
                'eligibility_check' => $eligibility,
            ],
        ];

        Log::info('Loan application submitted', [
            'loan_id' => $loanId,
            'employee_id' => $data['employee_id'],
            'type' => $data['type'],
            'amount' => $data['amount'],
        ]);

        return [
            'success' => true,
            'loan' => $loan,
            'schedule' => $schedule,
        ];
    }

    /**
     * Approve or reject loan application.
     */
    public function processApplication(
        string $loanId,
        string $action,
        int $processedBy,
        ?string $remarks = null
    ): array {
        // In production, fetch loan from database
        $loan = $this->getLoan($loanId);

        if (!$loan) {
            return ['success' => false, 'error' => 'Loan not found'];
        }

        if ($loan['status'] !== self::STATUS_PENDING) {
            return ['success' => false, 'error' => 'Loan is not in pending status'];
        }

        if ($action === 'approve') {
            $loan['status'] = self::STATUS_APPROVED;
            $loan['approved_by'] = $processedBy;
            $loan['approved_at'] = now()->toIso8601String();
            $loan['remarks'] = $remarks;

            Log::info('Loan approved', ['loan_id' => $loanId, 'approved_by' => $processedBy]);
        } elseif ($action === 'reject') {
            $loan['status'] = self::STATUS_REJECTED;
            $loan['rejected_by'] = $processedBy;
            $loan['rejected_at'] = now()->toIso8601String();
            $loan['rejection_reason'] = $remarks;

            Log::info('Loan rejected', ['loan_id' => $loanId, 'rejected_by' => $processedBy]);
        } else {
            return ['success' => false, 'error' => 'Invalid action'];
        }

        return [
            'success' => true,
            'loan' => $loan,
        ];
    }

    /**
     * Disburse approved loan.
     */
    public function disburseLoan(string $loanId, array $disbursementDetails = []): array
    {
        $loan = $this->getLoan($loanId);

        if (!$loan) {
            return ['success' => false, 'error' => 'Loan not found'];
        }

        if ($loan['status'] !== self::STATUS_APPROVED) {
            return ['success' => false, 'error' => 'Loan must be approved before disbursement'];
        }

        $loan['status'] = self::STATUS_ACTIVE;
        $loan['disbursement_date'] = now()->toDateString();
        $loan['disbursement_method'] = $disbursementDetails['method'] ?? 'bank_transfer';
        $loan['disbursement_reference'] = $disbursementDetails['reference'] ?? null;
        $loan['balance_remaining'] = $loan['total_payable'];
        $loan['installments_paid'] = 0;
        $loan['total_paid'] = 0;

        Log::info('Loan disbursed', [
            'loan_id' => $loanId,
            'amount' => $loan['principal_amount'],
        ]);

        return [
            'success' => true,
            'loan' => $loan,
        ];
    }

    /**
     * Record loan repayment (deduction from payroll).
     */
    public function recordRepayment(
        string $loanId,
        float $amount,
        string $payrollId,
        ?Carbon $paymentDate = null
    ): array {
        $loan = $this->getLoan($loanId);

        if (!$loan) {
            return ['success' => false, 'error' => 'Loan not found'];
        }

        if ($loan['status'] !== self::STATUS_ACTIVE) {
            return ['success' => false, 'error' => 'Loan is not active'];
        }

        $repaymentId = Str::uuid()->toString();
        $paymentDate = $paymentDate ?? now();

        // Split payment into principal and interest
        $allocation = $this->allocatePayment($loan, $amount);

        $repayment = [
            'id' => $repaymentId,
            'loan_id' => $loanId,
            'payroll_id' => $payrollId,
            'payment_date' => $paymentDate->toDateString(),
            'amount' => $amount,
            'principal_portion' => $allocation['principal'],
            'interest_portion' => $allocation['interest'],
            'balance_after' => $loan['balance_remaining'] - $amount,
            'installment_number' => $loan['installments_paid'] + 1,
            'created_at' => now()->toIso8601String(),
        ];

        // Update loan balance
        $loan['balance_remaining'] -= $amount;
        $loan['total_paid'] += $amount;
        $loan['installments_paid']++;
        $loan['last_payment_date'] = $paymentDate->toDateString();

        // Check if loan is fully paid
        if ($loan['balance_remaining'] <= 0) {
            $loan['status'] = self::STATUS_COMPLETED;
            $loan['completed_at'] = now()->toIso8601String();

            Log::info('Loan completed', ['loan_id' => $loanId]);
        }

        Log::info('Loan repayment recorded', [
            'loan_id' => $loanId,
            'amount' => $amount,
            'balance_remaining' => $loan['balance_remaining'],
        ]);

        return [
            'success' => true,
            'repayment' => $repayment,
            'loan' => $loan,
        ];
    }

    /**
     * Get deductions for payroll processing.
     */
    public function getPayrollDeductions(int $employeeId, Carbon $payrollDate): array
    {
        // Get all active loans for the employee
        $loans = $this->getActiveLoans($employeeId);

        $deductions = [];
        $totalDeduction = 0;

        foreach ($loans as $loan) {
            // Check if deduction is due for this payroll period
            $installment = $this->getDueInstallment($loan, $payrollDate);

            if ($installment) {
                $deductions[] = [
                    'loan_id' => $loan['id'],
                    'loan_type' => $loan['type'],
                    'installment_number' => $installment['number'],
                    'amount' => $installment['amount'],
                    'principal' => $installment['principal'],
                    'interest' => $installment['interest'],
                    'balance_after' => $installment['balance_after'],
                    'is_final' => $installment['is_final'],
                ];
                $totalDeduction += $installment['amount'];
            }
        }

        return [
            'employee_id' => $employeeId,
            'payroll_date' => $payrollDate->toDateString(),
            'deductions' => $deductions,
            'total_deduction' => $totalDeduction,
            'loans_count' => count($deductions),
        ];
    }

    /**
     * Get loan summary for an employee.
     */
    public function getEmployeeLoanSummary(int $employeeId): array
    {
        $loans = $this->getEmployeeLoans($employeeId);

        $summary = [
            'employee_id' => $employeeId,
            'total_loans' => count($loans),
            'active_loans' => 0,
            'completed_loans' => 0,
            'pending_loans' => 0,
            'total_borrowed' => 0,
            'total_outstanding' => 0,
            'total_repaid' => 0,
            'monthly_obligation' => 0,
            'loans_by_type' => [],
        ];

        foreach ($loans as $loan) {
            $summary['total_borrowed'] += $loan['principal_amount'];

            if ($loan['status'] === self::STATUS_ACTIVE) {
                $summary['active_loans']++;
                $summary['total_outstanding'] += $loan['balance_remaining'] ?? 0;
                $summary['monthly_obligation'] += $loan['emi_amount'];
            } elseif ($loan['status'] === self::STATUS_COMPLETED) {
                $summary['completed_loans']++;
                $summary['total_repaid'] += $loan['total_paid'] ?? $loan['total_payable'];
            } elseif ($loan['status'] === self::STATUS_PENDING) {
                $summary['pending_loans']++;
            }

            $type = $loan['type'];
            if (!isset($summary['loans_by_type'][$type])) {
                $summary['loans_by_type'][$type] = [
                    'count' => 0,
                    'total_amount' => 0,
                    'outstanding' => 0,
                ];
            }
            $summary['loans_by_type'][$type]['count']++;
            $summary['loans_by_type'][$type]['total_amount'] += $loan['principal_amount'];
            $summary['loans_by_type'][$type]['outstanding'] += $loan['balance_remaining'] ?? 0;
        }

        return $summary;
    }

    /**
     * Get loan statement.
     */
    public function getLoanStatement(string $loanId): array
    {
        $loan = $this->getLoan($loanId);

        if (!$loan) {
            return ['success' => false, 'error' => 'Loan not found'];
        }

        // Get all repayments
        $repayments = $this->getLoanRepayments($loanId);

        return [
            'success' => true,
            'loan' => [
                'id' => $loan['id'],
                'type' => $loan['type'],
                'status' => $loan['status'],
                'principal_amount' => $loan['principal_amount'],
                'interest_rate' => $loan['interest_rate'],
                'total_payable' => $loan['total_payable'],
                'emi_amount' => $loan['emi_amount'],
                'disbursement_date' => $loan['disbursement_date'],
            ],
            'repayments' => $repayments,
            'summary' => [
                'total_paid' => $loan['total_paid'] ?? 0,
                'balance_remaining' => $loan['balance_remaining'] ?? $loan['total_payable'],
                'installments_paid' => $loan['installments_paid'] ?? 0,
                'installments_remaining' => $loan['tenure_months'] - ($loan['installments_paid'] ?? 0),
                'next_due_date' => $this->getNextDueDate($loan),
            ],
        ];
    }

    /**
     * Prepay loan (partial or full).
     */
    public function prepayLoan(string $loanId, float $amount, string $paymentMethod = 'bank_transfer'): array
    {
        $loan = $this->getLoan($loanId);

        if (!$loan) {
            return ['success' => false, 'error' => 'Loan not found'];
        }

        if ($loan['status'] !== self::STATUS_ACTIVE) {
            return ['success' => false, 'error' => 'Loan is not active'];
        }

        $balanceRemaining = $loan['balance_remaining'] ?? $loan['total_payable'];

        if ($amount > $balanceRemaining) {
            $amount = $balanceRemaining; // Cap at remaining balance
        }

        $prepaymentId = Str::uuid()->toString();

        $prepayment = [
            'id' => $prepaymentId,
            'loan_id' => $loanId,
            'type' => 'prepayment',
            'amount' => $amount,
            'payment_method' => $paymentMethod,
            'balance_before' => $balanceRemaining,
            'balance_after' => $balanceRemaining - $amount,
            'is_full_prepayment' => $amount >= $balanceRemaining,
            'payment_date' => now()->toDateString(),
            'created_at' => now()->toIso8601String(),
        ];

        // Update loan
        $loan['balance_remaining'] = $balanceRemaining - $amount;
        $loan['total_paid'] = ($loan['total_paid'] ?? 0) + $amount;

        if ($prepayment['is_full_prepayment']) {
            $loan['status'] = self::STATUS_COMPLETED;
            $loan['completed_at'] = now()->toIso8601String();
            $loan['closure_type'] = 'prepayment';
        } else {
            // Recalculate remaining schedule
            $loan['repayment_schedule'] = $this->recalculateSchedule($loan);
        }

        Log::info('Loan prepayment processed', [
            'loan_id' => $loanId,
            'amount' => $amount,
            'is_full' => $prepayment['is_full_prepayment'],
        ]);

        return [
            'success' => true,
            'prepayment' => $prepayment,
            'loan' => $loan,
        ];
    }

    /**
     * Get loan policy configuration.
     */
    public function getPolicyConfiguration(): array
    {
        return [
            'loan_types' => [
                self::TYPE_SALARY_ADVANCE => [
                    'label' => 'Salary Advance',
                    'max_amount_ratio' => 2.0, // 2x monthly salary
                    'max_tenure_months' => 6,
                    'interest_rate' => 0, // No interest
                    'min_service_months' => 3,
                    'requires_guarantor' => false,
                    'requires_documents' => false,
                ],
                self::TYPE_PERSONAL_LOAN => [
                    'label' => 'Personal Loan',
                    'max_amount_ratio' => 6.0,
                    'max_tenure_months' => 24,
                    'interest_rate' => 8.0,
                    'min_service_months' => 12,
                    'requires_guarantor' => false,
                    'requires_documents' => true,
                ],
                self::TYPE_EMERGENCY_LOAN => [
                    'label' => 'Emergency Loan',
                    'max_amount_ratio' => 3.0,
                    'max_tenure_months' => 12,
                    'interest_rate' => 5.0,
                    'min_service_months' => 6,
                    'requires_guarantor' => false,
                    'requires_documents' => true,
                ],
                self::TYPE_HOUSING_LOAN => [
                    'label' => 'Housing Loan',
                    'max_amount' => 2000000,
                    'max_tenure_months' => 120,
                    'interest_rate' => 6.5,
                    'min_service_months' => 24,
                    'requires_guarantor' => true,
                    'requires_documents' => true,
                ],
            ],
            'deduction_rules' => [
                'max_deduction_ratio' => 0.5, // Max 50% of salary
                'priority_order' => [
                    self::TYPE_SALARY_ADVANCE,
                    self::TYPE_EMERGENCY_LOAN,
                    self::TYPE_PERSONAL_LOAN,
                    self::TYPE_HOUSING_LOAN,
                ],
            ],
        ];
    }

    /**
     * Check loan eligibility.
     */
    public function checkEligibility(int $employeeId, string $loanType, float $amount): array
    {
        $policy = $this->getPolicyConfiguration()['loan_types'][$loanType] ?? null;

        if (!$policy) {
            return [
                'eligible' => false,
                'reason' => 'Invalid loan type',
            ];
        }

        $issues = [];

        // Check service duration
        $serviceMonths = $this->getEmployeeServiceMonths($employeeId);
        if ($serviceMonths < $policy['min_service_months']) {
            $issues[] = "Minimum {$policy['min_service_months']} months of service required";
        }

        // Check existing loans
        $existingLoans = $this->getActiveLoans($employeeId);
        $existingOfSameType = array_filter($existingLoans, fn($l) => $l['type'] === $loanType);
        if (!empty($existingOfSameType)) {
            $issues[] = 'You already have an active loan of this type';
        }

        // Check deduction ratio
        $salary = $this->getEmployeeSalary($employeeId);
        $currentDeductions = $this->getCurrentMonthlyDeductions($employeeId);
        $newEmi = $this->calculateEmi($amount, $policy['interest_rate'], $policy['max_tenure_months']);
        $totalDeductionRatio = ($currentDeductions + $newEmi) / $salary;

        if ($totalDeductionRatio > 0.5) {
            $issues[] = 'Total loan deductions cannot exceed 50% of salary';
        }

        // Check max amount
        $maxAmount = isset($policy['max_amount'])
            ? $policy['max_amount']
            : $salary * $policy['max_amount_ratio'];

        if ($amount > $maxAmount) {
            $issues[] = "Maximum loan amount is " . number_format($maxAmount, 2);
        }

        return [
            'eligible' => empty($issues),
            'reason' => empty($issues) ? null : implode('; ', $issues),
            'issues' => $issues,
            'max_eligible_amount' => $maxAmount,
            'current_deduction_ratio' => $currentDeductions / $salary,
            'projected_deduction_ratio' => $totalDeductionRatio,
        ];
    }

    /**
     * Calculate repayment schedule.
     */
    protected function calculateRepaymentSchedule(
        float $principal,
        float $annualInterestRate,
        int $tenureMonths,
        Carbon $startDate,
        string $frequency = self::FREQUENCY_MONTHLY
    ): array {
        $monthlyRate = $annualInterestRate / 100 / 12;
        $emi = $this->calculateEmi($principal, $annualInterestRate, $tenureMonths);

        $installments = [];
        $balance = $principal;
        $totalInterest = 0;
        $currentDate = $startDate->copy();

        for ($i = 1; $i <= $tenureMonths; $i++) {
            $interest = $balance * $monthlyRate;
            $principalPortion = $emi - $interest;
            $balance -= $principalPortion;
            $totalInterest += $interest;

            $installments[] = [
                'number' => $i,
                'due_date' => $currentDate->toDateString(),
                'amount' => round($emi, 2),
                'principal' => round($principalPortion, 2),
                'interest' => round($interest, 2),
                'balance_after' => max(0, round($balance, 2)),
                'status' => 'pending',
            ];

            // Advance date based on frequency
            $currentDate = match ($frequency) {
                self::FREQUENCY_WEEKLY => $currentDate->addWeek(),
                self::FREQUENCY_BI_WEEKLY => $currentDate->addWeeks(2),
                default => $currentDate->addMonth(),
            };
        }

        return [
            'emi_amount' => round($emi, 2),
            'total_interest' => round($totalInterest, 2),
            'total_payable' => round($principal + $totalInterest, 2),
            'end_date' => $installments[count($installments) - 1]['due_date'],
            'installments' => $installments,
        ];
    }

    /**
     * Calculate EMI using standard formula.
     */
    protected function calculateEmi(float $principal, float $annualRate, int $months): float
    {
        if ($annualRate == 0) {
            return $principal / $months;
        }

        $monthlyRate = $annualRate / 100 / 12;
        $emi = $principal * $monthlyRate * pow(1 + $monthlyRate, $months) / (pow(1 + $monthlyRate, $months) - 1);

        return $emi;
    }

    /**
     * Allocate payment between principal and interest.
     */
    protected function allocatePayment(array $loan, float $amount): array
    {
        $balance = $loan['balance_remaining'];
        $monthlyRate = ($loan['interest_rate'] ?? 0) / 100 / 12;

        $interest = $balance * $monthlyRate;
        $principal = $amount - $interest;

        return [
            'principal' => max(0, round($principal, 2)),
            'interest' => round($interest, 2),
        ];
    }

    /**
     * Get default interest rate for loan type.
     */
    protected function getDefaultInterestRate(string $loanType): float
    {
        $policy = $this->getPolicyConfiguration()['loan_types'][$loanType] ?? null;
        return $policy['interest_rate'] ?? 10.0;
    }

    /**
     * Recalculate remaining schedule after prepayment.
     */
    protected function recalculateSchedule(array $loan): array
    {
        $balance = $loan['balance_remaining'];
        $remainingMonths = $loan['tenure_months'] - ($loan['installments_paid'] ?? 0);

        return $this->calculateRepaymentSchedule(
            $balance,
            $loan['interest_rate'],
            $remainingMonths,
            now()->addMonth()->startOfMonth(),
            $loan['frequency']
        )['installments'];
    }

    // Placeholder methods for database operations
    protected function getLoan(string $loanId): ?array { return null; }
    protected function getActiveLoans(int $employeeId): array { return []; }
    protected function getEmployeeLoans(int $employeeId): array { return []; }
    protected function getLoanRepayments(string $loanId): array { return []; }
    protected function getDueInstallment(array $loan, Carbon $date): ?array { return null; }
    protected function getNextDueDate(array $loan): ?string { return null; }
    protected function getEmployeeServiceMonths(int $employeeId): int { return 24; }
    protected function getEmployeeSalary(int $employeeId): float { return 50000; }
    protected function getCurrentMonthlyDeductions(int $employeeId): float { return 0; }
}
