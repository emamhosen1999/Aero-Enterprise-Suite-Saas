<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\LeaveSetting;
use App\Notifications\LeaveApprovalNotification;
use App\Notifications\LeaveApprovedNotification;
use App\Notifications\LeaveRejectedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeaveApprovalService
{
    public function __construct(
        private EmployeeResolutionService $resolutionService,
        private HRMAuthorizationService $authService
    ) {}

    /**
     * Build approval chain for a leave request based on organizational hierarchy
     */
    public function buildApprovalChain(Leave $leave): array
    {
        $employee = $leave->employee;
        $leaveSetting = $leave->leaveSetting;

        // Check if approval is required for this leave type
        if (! $leaveSetting->requires_approval) {
            return [];
        }

        // Check if auto-approval is enabled for this leave type
        if ($leaveSetting->auto_approve) {
            return [];
        }

        $approvalChain = [];

        // Level 1: Direct Manager (reporting_manager_id)
        if ($employee->reporting_manager_id) {
            $manager = Employee::find($employee->reporting_manager_id);
            if ($manager) {
                $approvalChain[] = [
                    'level' => 1,
                    'approver_employee_id' => $manager->id,
                    'approver_name' => $manager->full_name,
                    'status' => 'pending',
                    'approved_at' => null,
                    'comments' => null,
                ];
            }
        }

        // Level 2: Department Head (if different from direct manager)
        // Level 2: Department Head (if different from direct manager)
        $departmentHead = Employee::where('department_id', $employee->department_id)
            ->where('designation_id', function ($query) {
                $query->selectRaw('MIN(id)') // Lowest designation_id = highest rank
                    ->from('designations')
                    ->whereColumn('id', 'employees.designation_id');
            })
            ->where('id', '!=', $employee->id)
            ->where('id', '!=', $employee->reporting_manager_id)
            ->first();

        if ($departmentHead) {
            $approvalChain[] = [
                'level' => 2,
                'approver_employee_id' => $departmentHead->id,
                'approver_name' => $departmentHead->full_name,
                'status' => 'pending',
                'approved_at' => null,
                'comments' => null,
            ];
        }

        // Level 3: HR Manager (for leaves > 5 days or special leave types)
        if ($leave->no_of_days > 5 || in_array($leave->leave_type_id, $this->getSpecialLeaveTypes())) {
            // Find employees authorized for HR leave approval
            $hrManagers = Employee::where('is_active', true)
                ->get()
                ->filter(function ($emp) {
                    return $this->authService->canApproveLeave($emp);
                })
                ->first();

            if ($hrManagers) {
                $approvalChain[] = [
                    'level' => 3,
                    'approver_employee_id' => $hrManagers->id,
                    'approver_name' => $hrManagers->full_name,
                    'status' => 'pending',
                    'approved_at' => null,
                    'comments' => null,
                ];
            }
        }

        return $approvalChain;
    }

    /**
     * Submit leave request for approval
     */
    public function submitForApproval(Leave $leave): bool
    {
        DB::beginTransaction();
        try {
            // Build approval chain
            $approvalChain = $this->buildApprovalChain($leave);

            if (empty($approvalChain)) {
                // Auto-approve if no approvers found
                $leave->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                ]);

                Log::info("Leave #{$leave->id} auto-approved - no approvers in chain");

                return true;
            }

            // Update leave with approval chain
            $leave->update([
                'approval_chain' => $approvalChain,
                'current_approval_level' => 1,
                'status' => 'pending',
                'submitted_at' => now(),
            ]);

            // Notify first approver
            $this->notifyCurrentApprover($leave);

            DB::commit();
            Log::info("Leave #{$leave->id} submitted for approval", [
                'employee_id' => $leave->employee_id,
                'levels' => count($approvalChain),
            ]);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to submit leave #{$leave->id} for approval", [
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Approve leave at current level
     */
    public function approve(Leave $leave, Employee $approver, ?string $comments = null): array
    {
        DB::beginTransaction();
        try {
            $approvalChain = $leave->approval_chain;
            $currentLevel = $leave->current_approval_level;

            // Validate approver
            if (! $this->canApprove($leave, $approver)) {
                return [
                    'success' => false,
                    'message' => 'You are not authorized to approve this leave request.',
                ];
            }

            // Update current level in chain
            foreach ($approvalChain as &$level) {
                if ($level['level'] === $currentLevel && $level['approver_employee_id'] === $approver->id) {
                    $level['status'] = 'approved';
                    $level['approved_at'] = now()->toDateTimeString();
                    $level['comments'] = $comments;
                    break;
                }
            }

            // Check if more levels exist
            $hasMoreLevels = collect($approvalChain)
                ->where('level', '>', $currentLevel)
                ->isNotEmpty();

            if ($hasMoreLevels) {
                // Move to next level
                $leave->update([
                    'approval_chain' => $approvalChain,
                    'current_approval_level' => $currentLevel + 1,
                ]);

                // Notify next approver
                $this->notifyCurrentApprover($leave);

                DB::commit();

                return [
                    'success' => true,
                    'message' => 'Leave approved. Forwarded to next level.',
                    'status' => 'pending',
                ];
            } else {
                // Final approval - mark as approved
                $leave->update([
                    'approval_chain' => $approvalChain,
                    'status' => 'approved',
                    'approved_at' => now(),
                ]);

                // Notify employee
                $leave->employee->user->notify(new LeaveApprovedNotification($leave));

                DB::commit();
                Log::info("Leave #{$leave->id} fully approved", [
                    'final_approver_employee_id' => $approver->id,
                ]);

                return [
                    'success' => true,
                    'message' => 'Leave request approved successfully.',
                    'status' => 'approved',
                ];
            }
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to approve leave #{$leave->id}", [
                'error' => $e->getMessage(),
                'approver' => $approver->id,
            ]);

            return [
                'success' => false,
                'message' => 'Failed to approve leave request.',
            ];
        }
    }

    /**
     * Reject leave request
     */
    public function reject(Leave $leave, Employee $approver, string $reason): array
    {
        DB::beginTransaction();
        try {
            if (! $this->canApprove($leave, $approver)) {
                return [
                    'success' => false,
                    'message' => 'You are not authorized to reject this leave request.',
                ];
            }

            $approvalChain = $leave->approval_chain;
            $currentLevel = $leave->current_approval_level;

            // Update current level in chain
            foreach ($approvalChain as &$level) {
                if ($level['level'] === $currentLevel && $level['approver_employee_id'] === $approver->id) {
                    $level['status'] = 'rejected';
                    $level['approved_at'] = now()->toDateTimeString();
                    $level['comments'] = $reason;
                    break;
                }
            }

            $leave->update([
                'approval_chain' => $approvalChain,
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'rejected_by_employee_id' => $approver->id,
            ]);

            // Notify employee
            $leave->employee->user->notify(new LeaveRejectedNotification($leave, $reason));

            DB::commit();
            Log::info("Leave #{$leave->id} rejected", [
                'rejector' => $approver->id,
                'reason' => $reason,
            ]);

            return [
                'success' => true,
                'message' => 'Leave request rejected.',
                'status' => 'rejected',
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Failed to reject leave #{$leave->id}", [
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to reject leave request.',
            ];
        }
    }

    /**
     * Check if employee can approve this leave at current level
     */
    public function canApprove(Leave $leave, Employee $employee): bool
    {
        if ($leave->status !== 'pending') {
            return false;
        }

        $approvalChain = $leave->approval_chain;
        $currentLevel = $leave->current_approval_level;

        foreach ($approvalChain as $level) {
            if ($level['level'] === $currentLevel && $level['approver_employee_id'] === $employee->id && $level['status'] === 'pending') {
                return true;
            }
        }

        return false;
    }

    /**
     * Get current approver employee for a leave request
     */
    public function getCurrentApprover(Leave $leave): ?Employee
    {
        if ($leave->status !== 'pending' || ! $leave->approval_chain) {
            return null;
        }

        $currentLevel = $leave->current_approval_level;
        $approvalChain = $leave->approval_chain;

        foreach ($approvalChain as $level) {
            if ($level['level'] === $currentLevel && $level['status'] === 'pending') {
                return Employee::find($level['approver_employee_id']);
            }
        }

        return null;
    }

    /**
     * Notify current approver
     */
    protected function notifyCurrentApprover(Leave $leave): void
    {
        $approverEmployee = $this->getCurrentApprover($leave);

        if ($approverEmployee && $approverEmployee->user) {
            $approverEmployee->user->notify(new LeaveApprovalNotification($leave));
        }
    }

    /**
     * Get leave types requiring HR approval
     */
    protected function getSpecialLeaveTypes(): array
    {
        // Get IDs for maternity, paternity, unpaid leave, etc.
        return LeaveSetting::whereIn('name', [
            'Maternity Leave',
            'Paternity Leave',
            'Unpaid Leave',
            'Sabbatical',
        ])->pluck('id')->toArray();
    }

    /**
     * Get leaves pending approval for an employee
     */
    public function getPendingApprovalsForEmployee(Employee $employee): \Illuminate\Database\Eloquent\Collection
    {
        return Leave::where('status', 'pending')
            ->whereNotNull('approval_chain')
            ->get()
            ->filter(function ($leave) use ($employee) {
                return $this->canApprove($leave, $employee);
            });
    }

    /**
     * Get approval statistics for an employee
     */
    public function getApprovalStats(Employee $employee): array
    {
        $pending = $this->getPendingApprovalsForEmployee($employee)->count();

        $approved = Leave::whereNotNull('approval_chain')
            ->where('status', 'approved')
            ->get()
            ->filter(function ($leave) use ($employee) {
                foreach ($leave->approval_chain as $level) {
                    if ($level['approver_employee_id'] === $employee->id && $level['status'] === 'approved') {
                        return true;
                    }
                }

                return false;
            })
            ->count();

        $rejected = Leave::whereNotNull('approval_chain')
            ->where('status', 'rejected')
            ->get()
            ->filter(function ($leave) use ($employee) {
                foreach ($leave->approval_chain as $level) {
                    if ($level['approver_employee_id'] === $employee->id && $level['status'] === 'rejected') {
                        return true;
                    }
                }

                return false;
            })
            ->count();

        return [
            'pending' => $pending,
            'approved' => $approved,
            'rejected' => $rejected,
            'total' => $pending + $approved + $rejected,
        ];
    }
}
