<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Leave;
use Aero\Core\Models\User;
use App\Notifications\LeaveApprovalNotification;
use App\Notifications\LeaveApprovedNotification;
use App\Notifications\LeaveRejectedNotification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeaveApprovalService
{
    /**
     * Build approval chain for a leave request based on organizational hierarchy
     */
    public function buildApprovalChain(Leave $leave): array
    {
        $user = $leave->user;
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

        // Level 1: Direct Manager (report_to)
        if ($user->report_to_id) {
            $approvalChain[] = [
                'level' => 1,
                'approver_id' => $user->report_to_id,
                'approver_name' => $user->reportTo->name ?? 'Unknown',
                'status' => 'pending',
                'approved_at' => null,
                'comments' => null,
            ];
        }

        // Level 2: Department Head (if different from direct manager)
        $employee = $user->employee;
        $departmentHead = $employee ? Employee::where('department_id', $employee->department_id)
            ->where('designation_id', function ($query) {
                $query->selectRaw('MIN(id)') // Lowest designation_id = highest rank
                    ->from('designations')
                    ->whereColumn('id', 'employees.designation_id');
            })
            ->where('user_id', '!=', $user->id)
            ->where('user_id', '!=', $user->report_to_id)
            ->with('user')
            ->first() : null;

        if ($departmentHead) {
            $approvalChain[] = [
                'level' => 2,
                'approver_id' => $departmentHead->user_id,
                'approver_name' => $departmentHead->user->name ?? 'Unknown',
                'status' => 'pending',
                'approved_at' => null,
                'comments' => null,
            ];
        }

        // Level 3: HR Manager (for leaves > 5 days or special leave types)
        if ($leave->no_of_days > 5 || in_array($leave->leave_type_id, $this->getSpecialLeaveTypes())) {
            $hrManager = User::whereHas('roles', function ($query) {
                $query->where('name', 'HR Manager')
                    ->orWhere('name', 'HR Head')
                    ->orWhere('name', 'Super Admin');
            })->first();

            if ($hrManager) {
                $approvalChain[] = [
                    'level' => 3,
                    'approver_id' => $hrManager->id,
                    'approver_name' => $hrManager->name,
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
                'user_id' => $leave->user_id,
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
    public function approve(Leave $leave, User $approver, ?string $comments = null): array
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
                if ($level['level'] === $currentLevel && $level['approver_id'] === $approver->id) {
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
                $leave->user->notify(new LeaveApprovedNotification($leave));

                DB::commit();
                Log::info("Leave #{$leave->id} fully approved", [
                    'final_approver' => $approver->id,
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
    public function reject(Leave $leave, User $approver, string $reason): array
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
                if ($level['level'] === $currentLevel && $level['approver_id'] === $approver->id) {
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
                'rejected_by' => $approver->id,
            ]);

            // Notify employee
            $leave->user->notify(new LeaveRejectedNotification($leave, $reason));

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
     * Check if user can approve this leave at current level
     */
    public function canApprove(Leave $leave, User $user): bool
    {
        if ($leave->status !== 'pending') {
            return false;
        }

        $approvalChain = $leave->approval_chain;
        $currentLevel = $leave->current_approval_level;

        foreach ($approvalChain as $level) {
            if ($level['level'] === $currentLevel && $level['approver_id'] === $user->id && $level['status'] === 'pending') {
                return true;
            }
        }

        return false;
    }

    /**
     * Get current approver for a leave request
     */
    public function getCurrentApprover(Leave $leave): ?User
    {
        if ($leave->status !== 'pending' || ! $leave->approval_chain) {
            return null;
        }

        $currentLevel = $leave->current_approval_level;
        $approvalChain = $leave->approval_chain;

        foreach ($approvalChain as $level) {
            if ($level['level'] === $currentLevel && $level['status'] === 'pending') {
                return User::find($level['approver_id']);
            }
        }

        return null;
    }

    /**
     * Notify current approver
     */
    protected function notifyCurrentApprover(Leave $leave): void
    {
        $approver = $this->getCurrentApprover($leave);

        if ($approver) {
            $approver->notify(new LeaveApprovalNotification($leave));
        }
    }

    /**
     * Get leave types requiring HR approval
     */
    protected function getSpecialLeaveTypes(): array
    {
        // Get IDs for maternity, paternity, unpaid leave, etc.
        return \App\Models\LeaveSetting::whereIn('leave_type', [
            'Maternity Leave',
            'Paternity Leave',
            'Unpaid Leave',
            'Sabbatical',
        ])->pluck('id')->toArray();
    }

    /**
     * Get leaves pending approval for a user
     */
    public function getPendingApprovalsForUser(User $user): \Illuminate\Database\Eloquent\Collection
    {
        return Leave::where('status', 'pending')
            ->whereNotNull('approval_chain')
            ->get()
            ->filter(function ($leave) use ($user) {
                return $this->canApprove($leave, $user);
            });
    }

    /**
     * Get approval statistics for a user
     */
    public function getApprovalStats(User $user): array
    {
        $pending = $this->getPendingApprovalsForUser($user)->count();

        $approved = Leave::whereNotNull('approval_chain')
            ->where('status', 'approved')
            ->get()
            ->filter(function ($leave) use ($user) {
                foreach ($leave->approval_chain as $level) {
                    if ($level['approver_id'] === $user->id && $level['status'] === 'approved') {
                        return true;
                    }
                }

                return false;
            })
            ->count();

        $rejected = Leave::whereNotNull('approval_chain')
            ->where('status', 'rejected')
            ->get()
            ->filter(function ($leave) use ($user) {
                foreach ($leave->approval_chain as $level) {
                    if ($level['approver_id'] === $user->id && $level['status'] === 'rejected') {
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
