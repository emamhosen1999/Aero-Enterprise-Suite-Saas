<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreGoalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'type' => ['required', 'in:individual,team,department,company'],
            'priority' => ['nullable', 'in:low,medium,high,critical'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'target_value' => ['nullable', 'numeric', 'min:0'],
            'metric_unit' => ['nullable', 'string', 'max:50'],
            'employee_id' => ['nullable', 'exists:employees,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'parent_goal_id' => ['nullable', 'exists:goals,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'The goal title is required.',
            'type.required' => 'The goal type is required.',
            'type.in' => 'The goal type must be one of: individual, team, department, company.',
            'priority.in' => 'The priority must be one of: low, medium, high, critical.',
            'start_date.required' => 'The start date is required.',
            'end_date.required' => 'The end date is required.',
            'end_date.after' => 'The end date must be after the start date.',
            'target_value.min' => 'The target value must be at least 0.',
            'employee_id.exists' => 'The selected employee does not exist.',
            'department_id.exists' => 'The selected department does not exist.',
            'parent_goal_id.exists' => 'The selected parent goal does not exist.',
        ];
    }
}
