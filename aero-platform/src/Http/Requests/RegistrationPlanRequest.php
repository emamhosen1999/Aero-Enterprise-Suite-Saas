<?php

namespace Aero\Platform\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegistrationPlanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $allowedModules = array_values(array_filter(array_map(
            static fn ($module) => $module['code'] ?? null,
            config('platform.registration.modules', [])
        )));

        return [
            'billing_cycle' => ['required', Rule::in(['monthly', 'yearly'])],
            'modules' => ['required', 'array', 'min:1'],
            'modules.*' => ['string', Rule::in($allowedModules)],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('modules') || empty($this->input('modules'))) {
            $this->merge([
                'modules' => config('platform.registration.default_modules', ['hr']),
            ]);
        }
    }
}
