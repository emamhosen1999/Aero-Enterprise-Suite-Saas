<?php

namespace Aero\HRM\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeaveValidationService
{
    /**
     * Get validation rules for leave creation/update
     */
    public function getLeaveValidationRules(): array
    {
        return [
            'id' => 'nullable|exists:leaves,id',
            'user_id' => 'required|exists:users,id',
            'leaveType' => 'required|exists:leave_settings,type',
            'fromDate' => 'required|date|before_or_equal:toDate',
            'toDate' => 'required|date|after_or_equal:fromDate|before:'.now()->addYear()->format('Y-m-d'),
            'daysCount' => 'required|integer|min:1|max:365',
            'leaveReason' => 'required|string|max:500|min:5',
            'status' => 'nullable|in:new,pending,approved,rejected,New,Pending,Approved,Rejected',
        ];
    }

    /**
     * Get custom validation messages
     */
    public function getValidationMessages(): array
    {
        return [
            'fromDate.after_or_equal' => 'Leave cannot be applied for past dates.',
            'toDate.before' => 'Leave cannot be applied more than one year in advance.',
            'daysCount.max' => 'Leave duration cannot exceed 365 days.',
            'daysCount.min' => 'Leave duration must be at least 1 day.',
            'leaveReason.min' => 'Leave reason must be at least 5 characters long.',
            'leaveReason.max' => 'Leave reason cannot exceed 500 characters.',
            'leaveType.required' => 'Please select a leave type.',
            'leaveType.exists' => 'The selected leave type is invalid.',
            'user_id.required' => 'User ID is required.',
            'user_id.exists' => 'The selected user does not exist.',
        ];
    }

    /**
     * Get validation rules for delete operation
     */
    public function getDeleteValidationRules(): array
    {
        return [
            'id' => 'required|exists:leaves,id',
        ];
    }

    /**
     * Validate leave creation/update request
     */
    public function validateLeaveRequest(Request $request): \Illuminate\Contracts\Validation\Validator
    {
        return Validator::make($request->all(), $this->getLeaveValidationRules(), $this->getValidationMessages());
    }

    /**
     * Validate delete request
     */
    public function validateDeleteRequest(Request $request): array
    {
        return $request->validate($this->getDeleteValidationRules());
    }
}
