<?php

namespace Aero\Rfi\Http\Requests\Objection;

use Aero\Rfi\Models\Objection;
use Illuminate\Foundation\Http\FormRequest;

class StoreObjectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Objection::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'in:'.implode(',', Objection::$categories)],
            'chainage_from' => ['nullable', 'string', 'max:100'],
            'chainage_to' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:5000'],
            'reason' => ['nullable', 'string', 'max:5000'],
            'attach_to_rfi_ids' => ['nullable', 'array'],
            'attach_to_rfi_ids.*' => ['integer', 'exists:daily_works,id'],
            'files' => ['nullable', 'array'],
            'files.*' => ['file', 'mimes:jpeg,jpg,png,webp,gif,pdf,doc,docx,xls,xlsx,dwg,dxf', 'max:20480'],
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
            'title.required' => 'The objection title is required.',
            'category.required' => 'The objection category is required.',
            'category.in' => 'The category must be one of: '.implode(', ', array_values(Objection::$categoryLabels)),
            'attach_to_rfi_ids.*.exists' => 'One or more selected RFIs do not exist.',
            'files.*.max' => 'Each file must not exceed 20MB.',
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
            'chainage_from' => 'start chainage',
            'chainage_to' => 'end chainage',
            'attach_to_rfi_ids' => 'RFIs to attach',
        ];
    }
}
