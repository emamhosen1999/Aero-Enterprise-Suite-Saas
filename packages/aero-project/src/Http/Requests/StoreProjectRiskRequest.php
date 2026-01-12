<?php

declare(strict_types=1);

namespace Aero\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Store Project Risk Request
 */
class StoreProjectRiskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'type' => ['required', 'in:risk,issue'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['required', 'in:open,mitigating,resolved,closed,accepted'],
            'probability' => ['required', 'in:low,medium,high,critical'],
            'impact' => ['required', 'in:low,medium,high,critical'],
            'mitigation_plan' => ['nullable', 'string', 'max:5000'],
            'contingency_plan' => ['nullable', 'string', 'max:5000'],
            'owner_id' => ['nullable', 'integer'],
            'target_resolution_date' => ['nullable', 'date'],
            'related_task_id' => ['nullable', 'exists:project_tasks,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'Please specify whether this is a risk or an issue.',
            'type.in' => 'Type must be either risk or issue.',
            'title.required' => 'A title is required.',
            'title.max' => 'Title cannot exceed 255 characters.',
            'status.required' => 'Please select a status.',
            'probability.required' => 'Please select a probability level.',
            'impact.required' => 'Please select an impact level.',
        ];
    }
}
