<?php

declare(strict_types=1);

namespace Aero\Project\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Update Project Risk Request
 */
class UpdateProjectRiskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorization handled by middleware
    }

    public function rules(): array
    {
        return [
            'type' => ['sometimes', 'in:risk,issue'],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'status' => ['sometimes', 'in:open,mitigating,resolved,closed,accepted'],
            'probability' => ['sometimes', 'in:low,medium,high,critical'],
            'impact' => ['sometimes', 'in:low,medium,high,critical'],
            'mitigation_plan' => ['nullable', 'string', 'max:5000'],
            'contingency_plan' => ['nullable', 'string', 'max:5000'],
            'owner_id' => ['nullable', 'integer'],
            'target_resolution_date' => ['nullable', 'date'],
            'resolved_date' => ['nullable', 'date'],
            'related_task_id' => ['nullable', 'exists:project_tasks,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'type.in' => 'Type must be either risk or issue.',
            'title.max' => 'Title cannot exceed 255 characters.',
        ];
    }
}
