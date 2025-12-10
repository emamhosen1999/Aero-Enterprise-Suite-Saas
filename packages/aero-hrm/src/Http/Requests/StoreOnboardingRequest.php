<?php

namespace Aero\HRM\Http\Requests\HR;

use Illuminate\Foundation\Http\FormRequest;

class StoreOnboardingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('hr.onboarding.create') ?? false;
    }

    public function rules(): array
    {
        return [
            'employee_id' => 'required|exists:users,id',
            'start_date' => 'required|date',
            'expected_completion_date' => 'required|date|after_or_equal:start_date',
            'notes' => 'nullable|string',
            'tasks' => 'array',
            'tasks.*.task' => 'required|string',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.due_date' => 'nullable|date|after_or_equal:start_date',
            'tasks.*.assigned_to' => 'nullable|exists:users,id',
        ];
    }

    public function prepareForValidation(): void
    {
        // Ensure tasks array key always exists to simplify controller logic
        if (! $this->has('tasks')) {
            $this->merge(['tasks' => []]);
        }
    }
}
