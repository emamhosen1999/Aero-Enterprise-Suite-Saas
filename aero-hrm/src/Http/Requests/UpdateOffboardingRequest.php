<?php

namespace Aero\HRM\Http\Requests\HR;

use Aero\HRM\Models\Offboarding;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOffboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $offboarding = $this->route('id') ? Offboarding::find($this->route('id')) : null;
        if (! $offboarding) {
            return false;
        }

        return $this->user()?->can('hr.offboarding.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'initiation_date' => 'required|date',
            'last_working_date' => 'required|date|after_or_equal:initiation_date',
            'exit_interview_date' => 'nullable|date|after_or_equal:initiation_date',
            'reason' => 'required|string|in:resignation,termination,retirement,end-of-contract,other',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'tasks' => 'array',
            'tasks.*.id' => 'nullable|exists:offboarding_tasks,id',
            'tasks.*.task' => 'required|string',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.due_date' => 'nullable|date|after_or_equal:initiation_date',
            'tasks.*.completed_date' => 'nullable|date|after_or_equal:initiation_date',
            'tasks.*.status' => 'required|in:pending,in_progress,completed,not-applicable',
            'tasks.*.assigned_to' => 'nullable|exists:users,id',
            'tasks.*.notes' => 'nullable|string',
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('tasks')) {
            $this->merge(['tasks' => []]);
        }
    }
}
