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
            'plan_id' => ['nullable', 'string', 'uuid', 'exists:plans,id'],
            'modules' => ['nullable', 'array'],
            'modules.*' => ['string', Rule::in($allowedModules)],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $planId = $this->input('plan_id');
            $modules = $this->input('modules', []);

            // Ensure at least one selection is made (plan OR modules)
            if (empty($planId) && empty($modules)) {
                $validator->errors()->add('selection', 'Please select a plan or at least one module to continue.');
            }
        });
    }

    protected function prepareForValidation(): void
    {
        // Ensure modules is always an array
        if (! $this->has('modules') || ! is_array($this->input('modules'))) {
            $this->merge(['modules' => []]);
        }
    }
}
