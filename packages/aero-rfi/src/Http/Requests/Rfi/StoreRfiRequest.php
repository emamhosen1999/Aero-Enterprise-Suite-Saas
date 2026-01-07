<?php

namespace Aero\Rfi\Http\Requests\Rfi;

use Aero\Rfi\Models\Rfi;
use Illuminate\Foundation\Http\FormRequest;

class StoreRfiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Rfi::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'number' => ['required', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:'.implode(',', Rfi::$statuses)],
            'type' => ['required', 'string', 'in:'.implode(',', Rfi::$types)],
            'description' => ['nullable', 'string', 'max:5000'],
            'location' => ['nullable', 'string', 'max:500'],
            'work_location_id' => ['nullable', 'integer', 'exists:work_locations,id'],
            'side' => ['nullable', 'string', 'in:'.implode(',', Rfi::$sides)],
            'qty_layer' => ['nullable', 'integer', 'min:1'],
            'planned_time' => ['nullable', 'string', 'max:100'],
            'incharge_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'assigned_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'mimes:jpeg,jpg,png,webp,gif,pdf', 'max:10240'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'date.required' => 'The work date is required.',
            'number.required' => 'The RFI number is required.',
            'type.required' => 'The work type is required.',
            'type.in' => 'The work type must be one of: '.implode(', ', Rfi::$types),
            'side.in' => 'The side must be one of: '.implode(', ', Rfi::$sides),
            'status.in' => 'The status must be valid.',
            'work_location_id.exists' => 'The selected work location does not exist.',
            'incharge_user_id.exists' => 'The selected incharge user does not exist.',
            'assigned_user_id.exists' => 'The selected assigned user does not exist.',
            'files.*.max' => 'Each file must not exceed 10MB.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'incharge_user_id' => 'incharge',
            'assigned_user_id' => 'assigned user',
            'work_location_id' => 'work location',
            'qty_layer' => 'quantity/layer',
        ];
    }
}
