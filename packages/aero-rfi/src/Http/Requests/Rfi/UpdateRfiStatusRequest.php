<?php

namespace Aero\Rfi\Http\Requests\Rfi;

use Aero\Rfi\Models\Rfi;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UpdateRfiStatusRequest
 *
 * Validates requests to update RFI status.
 */
class UpdateRfiStatusRequest extends FormRequest
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

        return $this->user()->can('update', $rfi);
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
            'status' => ['required', Rule::in(Rfi::$statuses)],
            'inspection_result' => ['nullable', Rule::in(Rfi::$inspectionResults)],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $validStatuses = implode(', ', Rfi::$statuses);
        $validResults = implode(', ', Rfi::$inspectionResults);

        return [
            'id.required' => 'RFI ID is required.',
            'id.exists' => 'RFI not found.',
            'status.required' => 'Status is required.',
            'status.in' => "Status must be one of: {$validStatuses}.",
            'inspection_result.in' => "Inspection result must be one of: {$validResults}.",
        ];
    }
}
