<?php

namespace Aero\HRM\Http\Requests\HR;

use Illuminate\Foundation\Http\FormRequest;

class StoreOffboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('hr.offboarding.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'employee_id' => 'required|exists:users,id',
            'initiation_date' => 'required|date',
            'last_working_date' => 'required|date|after_or_equal:initiation_date',
            'exit_interview_date' => 'nullable|date|after_or_equal:initiation_date',
            'reason' => 'required|string|in:resignation,termination,retirement,end-of-contract,other',
            'status' => 'sometimes|in:pending,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'tasks' => 'array',
            'tasks.*.task' => 'required|string',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.due_date' => 'nullable|date|after_or_equal:initiation_date',
            'tasks.*.assigned_to' => 'nullable|exists:users,id',
        ];
    }

    public function prepareForValidation(): void
    {
        if (! $this->has('tasks')) {
            $this->merge(['tasks' => []]);
        }
    }
}
