<?php

namespace Aero\Rfi\Http\Requests\Rfi;

use Aero\Rfi\Models\Rfi;
use Illuminate\Foundation\Http\FormRequest;

/**
 * UpdateInspectionDetailsRequest
 *
 * Validates requests to update inspection details.
 */
class UpdateInspectionDetailsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $rfi = Rfi::find($this->input('id'));

        if (! $rfi) {
            return false;
        }

        return $this->user()->can('inspect', $rfi);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id' => ['required', 'exists:daily_works,id'],
            'inspection_details' => ['nullable', 'string', 'max:1000'],
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
            'id.required' => 'RFI ID is required.',
            'id.exists' => 'RFI not found.',
            'inspection_details.max' => 'Inspection details cannot exceed 1000 characters.',
        ];
    }
}
