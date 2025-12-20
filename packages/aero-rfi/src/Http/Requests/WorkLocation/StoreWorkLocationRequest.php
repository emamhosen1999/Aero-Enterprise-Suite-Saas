<?php

namespace Aero\Rfi\Http\Requests\WorkLocation;

use Aero\Rfi\Models\WorkLocation;
use Illuminate\Foundation\Http\FormRequest;

class StoreWorkLocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', WorkLocation::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
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
            'name.required' => 'The work location name is required.',
            'incharge_user_id.exists' => 'The selected incharge user does not exist.',
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
            'start_chainage' => 'start chainage',
            'end_chainage' => 'end chainage',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('is_active')) {
            $this->merge(['is_active' => true]);
        }
    }
}
