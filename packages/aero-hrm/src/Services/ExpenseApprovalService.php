<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\ExpenseClaim;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExpenseApprovalService
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_MANAGER_APPROVED = 'manager_approved';

    public const STATUS_HR_APPROVED = 'hr_approved';

    public const STATUS_FINANCE_APPROVED = 'finance_approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_REIMBURSED = 'reimbursed';

    /**
     * Submit an expense claim for approval.
     */
    public function submitClaim(ExpenseClaim $claim): ExpenseClaim
    {
        if ($claim->status !== self::STATUS_DRAFT) {
            throw new \RuntimeException('Only draft claims can be submitted.');
        }

        $claim->update([
            'status' => self::STATUS_SUBMITTED,
            'submitted_at' => now(),
        ]);

        Log::info('Expense claim submitted', [
            'claim_id' => $claim->id,
            'employee_id' => $claim->employee_id,
            'amount' => $claim->total_amount,
        ]);

        return $claim->fresh();
    }

    /**
     * Approve expense at manager level.
     */
    public function managerApprove(ExpenseClaim $claim, int $approverId, ?string $notes = null): ExpenseClaim
    {
        return $this->processApproval($claim, self::STATUS_SUBMITTED, self::STATUS_MANAGER_APPROVED, $approverId, $notes);
    }

    /**
     * Approve expense at HR level.
     */
    public function hrApprove(ExpenseClaim $claim, int $approverId, ?string $notes = null): ExpenseClaim
    {
        return $this->processApproval($claim, self::STATUS_MANAGER_APPROVED, self::STATUS_HR_APPROVED, $approverId, $notes);
    }

    /**
     * Approve expense at finance level (final approval).
     */
    public function financeApprove(ExpenseClaim $claim, int $approverId, ?string $notes = null): ExpenseClaim
    {
        return $this->processApproval($claim, self::STATUS_HR_APPROVED, self::STATUS_FINANCE_APPROVED, $approverId, $notes);
    }

    /**
     * Reject an expense claim at any approval stage.
     */
    public function reject(ExpenseClaim $claim, int $rejectedBy, string $reason): ExpenseClaim
    {
        return DB::transaction(function () use ($claim, $rejectedBy, $reason) {
            $claim->update([
                'status' => self::STATUS_REJECTED,
                'rejected_by' => $rejectedBy,
                'rejection_reason' => $reason,
                'rejected_at' => now(),
            ]);

            Log::info('Expense claim rejected', [
                'claim_id' => $claim->id,
                'rejected_by' => $rejectedBy,
                'reason' => $reason,
            ]);

            return $claim->fresh();
        });
    }

    /**
     * Mark an approved claim as reimbursed.
     */
    public function markReimbursed(ExpenseClaim $claim, array $paymentData = []): ExpenseClaim
    {
        if ($claim->status !== self::STATUS_FINANCE_APPROVED) {
            throw new \RuntimeException('Only finance-approved claims can be reimbursed.');
        }

        $claim->update([
            'status' => self::STATUS_REIMBURSED,
            'reimbursed_at' => now(),
            'payment_reference' => $paymentData['reference'] ?? null,
            'payment_method' => $paymentData['method'] ?? 'bank_transfer',
        ]);

        Log::info('Expense claim reimbursed', [
            'claim_id' => $claim->id,
            'amount' => $claim->total_amount,
        ]);

        return $claim->fresh();
    }

    /**
     * Check if claim amount exceeds department/employee budget.
     */
    public function checkBudgetCompliance(ExpenseClaim $claim): array
    {
        $employee = $claim->employee;
        $monthlyLimit = $this->getMonthlyLimit($employee);

        $monthlySpent = ExpenseClaim::where('employee_id', $employee->id)
            ->whereMonth('submitted_at', now()->month)
            ->whereYear('submitted_at', now()->year)
            ->whereNotIn('status', [self::STATUS_REJECTED, self::STATUS_DRAFT])
            ->where('id', '!=', $claim->id)
            ->sum('total_amount');

        $remainingBudget = $monthlyLimit - $monthlySpent;
        $exceedsBudget = $claim->total_amount > $remainingBudget;

        return [
            'monthly_limit' => $monthlyLimit,
            'monthly_spent' => $monthlySpent,
            'remaining_budget' => $remainingBudget,
            'claim_amount' => $claim->total_amount,
            'exceeds_budget' => $exceedsBudget,
            'over_by' => $exceedsBudget ? $claim->total_amount - $remainingBudget : 0,
        ];
    }

    /**
     * Get pending claims for a specific approver role.
     */
    public function getPendingForApproval(string $approvalLevel, ?int $departmentId = null): Collection
    {
        $statusMap = [
            'manager' => self::STATUS_SUBMITTED,
            'hr' => self::STATUS_MANAGER_APPROVED,
            'finance' => self::STATUS_HR_APPROVED,
        ];

        $status = $statusMap[$approvalLevel] ?? self::STATUS_SUBMITTED;

        $query = ExpenseClaim::where('status', $status)
            ->with(['employee', 'category'])
            ->orderBy('submitted_at');

        if ($departmentId) {
            $query->whereHas('employee', function ($q) use ($departmentId) {
                $q->where('department_id', $departmentId);
            });
        }

        return $query->get();
    }

    /**
     * Get expense analytics for a period.
     */
    public function getExpenseAnalytics(?string $startDate = null, ?string $endDate = null): array
    {
        $startDate = $startDate ?? now()->startOfMonth()->toDateString();
        $endDate = $endDate ?? now()->endOfMonth()->toDateString();

        $claims = ExpenseClaim::whereBetween('submitted_at', [$startDate, $endDate])
            ->whereNotIn('status', [self::STATUS_DRAFT])
            ->get();

        return [
            'period' => ['start' => $startDate, 'end' => $endDate],
            'total_claims' => $claims->count(),
            'total_amount' => $claims->sum('total_amount'),
            'approved_amount' => $claims->whereIn('status', [self::STATUS_FINANCE_APPROVED, self::STATUS_REIMBURSED])->sum('total_amount'),
            'pending_amount' => $claims->whereIn('status', [self::STATUS_SUBMITTED, self::STATUS_MANAGER_APPROVED, self::STATUS_HR_APPROVED])->sum('total_amount'),
            'rejected_amount' => $claims->where('status', self::STATUS_REJECTED)->sum('total_amount'),
            'by_category' => $claims->groupBy('expense_category_id')
                ->map(fn (Collection $group) => [
                    'count' => $group->count(),
                    'total' => $group->sum('total_amount'),
                ])->toArray(),
            'avg_processing_days' => $this->calculateAvgProcessingDays($claims),
        ];
    }

    private function processApproval(ExpenseClaim $claim, string $requiredStatus, string $newStatus, int $approverId, ?string $notes): ExpenseClaim
    {
        if ($claim->status !== $requiredStatus) {
            throw new \RuntimeException("Claim cannot be approved at this stage. Current status: {$claim->status}, required: {$requiredStatus}");
        }

        return DB::transaction(function () use ($claim, $newStatus, $approverId, $notes) {
            $claim->update([
                'status' => $newStatus,
                'last_approved_by' => $approverId,
                'last_approval_notes' => $notes,
                'last_approved_at' => now(),
            ]);

            Log::info('Expense claim approved', [
                'claim_id' => $claim->id,
                'new_status' => $newStatus,
                'approved_by' => $approverId,
            ]);

            return $claim->fresh();
        });
    }

    private function getMonthlyLimit(Employee $employee): float
    {
        return $employee->expense_monthly_limit
            ?? $employee->designation?->expense_limit
            ?? config('aero-hrm.default_expense_monthly_limit', 5000);
    }

    private function calculateAvgProcessingDays(Collection $claims): float
    {
        $processed = $claims->whereIn('status', [self::STATUS_FINANCE_APPROVED, self::STATUS_REIMBURSED])
            ->filter(fn ($c) => $c->submitted_at && $c->last_approved_at);

        if ($processed->isEmpty()) {
            return 0;
        }

        $totalDays = $processed->sum(function ($claim) {
            return $claim->submitted_at->diffInDays($claim->last_approved_at);
        });

        return round($totalDays / $processed->count(), 1);
    }
}
