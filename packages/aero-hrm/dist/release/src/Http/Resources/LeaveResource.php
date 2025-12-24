<?php

namespace Aero\HRM\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaveResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'leave_type' => $this->leave_type,
            'from_date' => $this->formatDate($this->from_date),
            'to_date' => $this->formatDate($this->to_date),
            'no_of_days' => $this->no_of_days,
            'reason' => $this->reason,
            'status' => $this->status,
            'approved_by' => $this->approved_by,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

            // Approval workflow fields
            'approval_chain' => $this->approval_chain,
            'current_approval_level' => $this->current_approval_level,
            'approved_at' => $this->approved_at,
            'rejected_at' => $this->rejected_at,
            'rejected_by' => $this->rejected_by,
            'rejection_reason' => $this->rejection_reason,

            // Include employee data when available
            'employee' => $this->when($this->relationLoaded('employee') && $this->employee, function () {
                return [
                    'id' => $this->employee->id,
                    'name' => $this->employee->name,
                    'profile_image' => $this->employee->profile_image,
                    'department_id' => $this->employee->department_id,
                    'designation_id' => $this->employee->designation_id,
                ];
            }),

            // Include leave setting data when available
            'leave_setting' => $this->when($this->relationLoaded('leaveSetting') && $this->leaveSetting, function () {
                return [
                    'id' => $this->leaveSetting->id,
                    'type' => $this->leaveSetting->type,
                    'days' => $this->leaveSetting->days,
                ];
            }),
        ];
    }

    /**
     * Format date consistently to Y-m-d format
     */
    private function formatDate($date): ?string
    {
        if (! $date) {
            return null;
        }

        try {
            return Carbon::parse($date)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }
}
