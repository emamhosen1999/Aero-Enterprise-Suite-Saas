<?php

namespace Aero\Rfi\Http\Requests\WorkLocation;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkLocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('workLocation'));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'start_chainage' => ['nullable', 'string', 'max:100'],
            'end_chainage' => ['nullable', 'string', 'max:100'],
            'incharge_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'is_active' => ['boolean'],
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
            'incharge_user_id.exists' => 'The selected incharge user does not exist.',
        ];
    }
}
