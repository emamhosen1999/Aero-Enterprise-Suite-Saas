<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Leave;
use Aero\HRM\Models\LeaveSetting;
use Carbon\Carbon;

class LeaveCrudService
{
    protected $approvalService;

    public function __construct(LeaveApprovalService $approvalService)
    {
        $this->approvalService = $approvalService;
    }

    /**
     * Create a new leave record
     */
    public function createLeave(array $data): Leave
    {
        $fromDate = Carbon::parse($data['fromDate']);
        $toDate = Carbon::parse($data['toDate']);
        
        $leaveTypeId = LeaveSetting::where('type', $data['leaveType'])->value('id');
        $leaveSetting = LeaveSetting::find($leaveTypeId);

        $leave = Leave::create([
            'user_id' => $data['user_id'],
            'leave_type' => $leaveTypeId,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'no_of_days' => $data['daysCount'],
            'reason' => $data['leaveReason'],
            'status' => 'New',
        ]);

        // Check if approval is required or auto-approve is enabled
        if ($leaveSetting && (!$leaveSetting->requires_approval || $leaveSetting->auto_approve)) {
            // Auto-approve the leave
            $leave->update([
                'status' => 'Approved',
                'approved_at' => now(),
            ]);
        } else {
            // Build and submit approval chain
            $this->approvalService->submitForApproval($leave);
        }

        return $leave->fresh(); // Ensure we return the latest data
    }

    /**
     * Update an existing leave record
     */
    public function updateLeave(int $leaveId, array $data): Leave
    {
        $leave = Leave::findOrFail($leaveId);

        // Parse dates correctly for consistent format
        $fromDate = Carbon::parse($data['fromDate']);
        $toDate = Carbon::parse($data['toDate']);

        // Get leave type ID
        $leaveTypeId = LeaveSetting::where('type', $data['leaveType'])->value('id');
        if (! $leaveTypeId) {
            // Fallback to current leave_type if not found
            $leaveTypeId = $leave->leave_type;
        }

        $leave->update([
            'user_id' => $data['user_id'],
            'leave_type' => $leaveTypeId,
            'from_date' => $fromDate,
            'to_date' => $toDate,
            'no_of_days' => $data['daysCount'],
            'reason' => $data['leaveReason'],
            'status' => $data['status'] ?? $leave->status,
        ]);

        return $leave->fresh(); // Ensure we return the latest data with relationships
    }

    /**
     * Update leave status
     */
    public function updateLeaveStatus(int $leaveId, string $status, int $approvedBy): array
    {
        $leave = Leave::findOrFail($leaveId);

        if ($leave->status !== $status) {
            $leave->update([
                'status' => $status,
                'approved_by' => $approvedBy,
            ]);

            return [
                'success' => true,
                'updated' => true,
                'message' => 'Leave application status updated to '.$status,
            ];
        }

        return [
            'success' => false,
            'updated' => false,
            'message' => 'Leave status remains unchanged.',
        ];
    }

    /**
     * Delete a leave record
     */
    public function deleteLeave(int $leaveId): bool
    {
        $leave = Leave::findOrFail($leaveId);

        return $leave->delete();
    }

    /**
     * Find leave by ID
     */
    public function findLeave(int $leaveId): Leave
    {
        return Leave::findOrFail($leaveId);
    }
}
