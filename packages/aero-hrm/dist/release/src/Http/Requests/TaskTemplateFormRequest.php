<?php

namespace AeroHRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TaskTemplateFormRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Authorization handled by policy
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $templateId = $this->route('task_template')?->id;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:task_templates,name,' . $templateId . ',id,department_id,' . ($this->department_id ?? 'NULL'),
            ],
            'department_id' => 'nullable|exists:departments,id',
            'role' => 'nullable|string|max:255',
            'tasks' => 'required|array|min:1',
            'tasks.*.title' => 'required|string|max:255',
            'tasks.*.description' => 'nullable|string',
            'tasks.*.due_days' => 'required|integer|min:0',
            'tasks.*.priority' => 'required|in:low,medium,high',
            'tasks.*.is_required' => 'required|boolean',
            'is_default' => 'required|boolean',
            'is_active' => 'required|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Template name is required.',
            'name.unique' => 'A template with this name already exists for the selected department.',
            'tasks.required' => 'At least one task is required.',
            'tasks.min' => 'At least one task is required.',
            'tasks.*.title.required' => 'Task title is required.',
            'tasks.*.due_days.required' => 'Due days is required for each task.',
            'tasks.*.priority.required' => 'Priority is required for each task.',
        ];
    }
}
