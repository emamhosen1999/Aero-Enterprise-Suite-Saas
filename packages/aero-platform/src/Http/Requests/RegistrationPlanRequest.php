<?php

namespace Aero\Platform\Http\Requests;

use Aero\Platform\Models\Plan;
use Illuminate\Contracts\Validation\ValidationRule;
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'billing_cycle' => ['required', Rule::in(['monthly', 'yearly'])],
            // Fix #22: Restrict to active plans only (inactive/archived plans must not be selectable).
            'plan_id' => ['nullable', 'string', Rule::exists('plans', 'id')->where('is_active', true)],
            'modules' => ['nullable', 'array'],
            // Module codes are alphanumeric identifiers (e.g. 'hrm', 'crm').
            // Per-plan module whitelisting is enforced in withValidator() below.
            // We intentionally do not restrict to a DB-driven list here because
            // discovered modules come from Composer packages and are not necessarily
            // registered in any plan — the controller handles final filtering.
            'modules.*' => ['string', 'max:100', 'regex:/^[a-z0-9_-]+$/'],
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

            // If a plan is selected, enforce that modules are a subset of the plan's modules
            if ($planId) {
                $plan = Plan::with('modules:code')->find($planId);

                if (! $plan) {
                    $validator->errors()->add('plan_id', 'Selected plan is invalid.');

                    return;
                }

                $allowed = $plan->module_codes ?? $plan->modules->pluck('code')->all();
                $allowed = array_values(array_filter($allowed));

                // Intersect with allowed modules; if none provided, use full allowed set
                $cleanModules = ! empty($modules)
                    ? array_values(array_intersect($modules, $allowed))
                    : $allowed;

                // If user requested modules not in plan, reject
                $invalid = array_diff($modules, $allowed);
                if (! empty($invalid)) {
                    $validator->errors()->add('modules', 'Selected modules are not included in this plan.');
                }

                // Normalize modules back onto the request so controller uses sanitized data
                $this->merge(['modules' => $cleanModules]);
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
