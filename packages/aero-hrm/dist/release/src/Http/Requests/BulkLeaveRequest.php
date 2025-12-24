<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BulkLeaveRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Check if user has permission to create leaves
        return $this->user()->can('leaves.create') ||
               $this->user()->hasPermissionTo('leaves.create') ||
               in_array('leaves.create', $this->user()->permissions ?? []);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'user_id' => 'required|exists:users,id',
            'dates' => 'required|array|min:1|max:50',
            'dates.*' => 'required|date',
            'leave_type_id' => 'required|exists:leave_settings,id',
            'reason' => 'required|string|min:5|max:500',
            'allow_partial_success' => 'boolean',
            'force_overwrite' => 'boolean',
        ];
    }

    /**
     * Get custom validation messages
     */
    public function messages(): array
    {
        return [
            'user_id.required' => 'User selection is required.',
            'user_id.exists' => 'The selected user does not exist.',
            'dates.required' => 'At least one date must be selected.',
            'dates.min' => 'At least one date must be selected.',
            'dates.max' => 'Cannot select more than 50 dates at once.',
            'dates.*.date' => 'All selected dates must be valid dates.',
            'leave_type_id.required' => 'Leave type selection is required.',
            'leave_type_id.exists' => 'The selected leave type is invalid.',
            'reason.required' => 'Leave reason is required.',
            'reason.min' => 'Leave reason must be at least 5 characters.',
            'reason.max' => 'Leave reason cannot exceed 500 characters.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation()
    {
        // If user_id is not provided, use the authenticated user's ID
        if (! $this->has('user_id') && $this->user()) {
            $this->merge([
                'user_id' => $this->user()->id,
            ]);
        }

        // Ensure allow_partial_success is boolean
        if ($this->has('allow_partial_success')) {
            $this->merge([
                'allow_partial_success' => filter_var($this->allow_partial_success, FILTER_VALIDATE_BOOLEAN),
            ]);
        }

        // Ensure force_overwrite is boolean
        if ($this->has('force_overwrite')) {
            $this->merge([
                'force_overwrite' => filter_var($this->force_overwrite, FILTER_VALIDATE_BOOLEAN),
            ]);
        }
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            // Custom validation for date range
            $dates = $this->input('dates', []);

            if (count($dates) > 0) {
                $minDate = min($dates);
                $maxDate = max($dates);

                try {
                    $minCarbon = \Carbon\Carbon::parse($minDate);
                    $maxCarbon = \Carbon\Carbon::parse($maxDate);

                    // Check if date range is more than 1 year
                    if ($maxCarbon->diffInDays($minCarbon) > 365) {
                        $validator->errors()->add('dates', 'Date range cannot exceed 365 days.');
                    }

                    // Check if any date is more than 1 year in the future
                    $oneYearFromNow = now()->addYear();
                    foreach ($dates as $date) {
                        $carbonDate = \Carbon\Carbon::parse($date);
                        if ($carbonDate->isAfter($oneYearFromNow)) {
                            $validator->errors()->add('dates', 'Cannot apply leave more than one year in advance.');
                            break;
                        }
                    }
                } catch (\Exception $e) {
                    $validator->errors()->add('dates', 'One or more dates are invalid.');
                }
            }
        });
    }
}
