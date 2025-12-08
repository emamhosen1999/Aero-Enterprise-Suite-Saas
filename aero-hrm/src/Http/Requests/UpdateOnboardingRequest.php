<?php

namespace Aero\HRM\Http\Requests\HR;

use Aero\HRM\Models\Onboarding;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $onboarding = $this->route('id') ? Onboarding::find($this->route('id')) : null;
        if (! $onboarding) {
            return false;
        }

        return $this->user()?->can('hr.onboarding.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'start_date' => 'required|date',
            'expected_completion_date' => 'required|date|after_or_equal:start_date',
            'actual_completion_date' => 'nullable|date|after_or_equal:start_date',
            'status' => 'required|in:pending,in_progress,completed,cancelled',
            'notes' => 'nullable|string',
            'tasks' => 'array',
            'tasks.*.id' => 'nullable|exists:onboarding_tasks,id',
            'tasks.*.task' => 'required|string',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.due_date' => 'nullable|date|after_or_equal:start_date',
            'tasks.*.completed_date' => 'nullable|date|after_or_equal:start_date',
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
