<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobOfferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'application_id' => ['required', 'exists:job_applications,id'],
            'offered_salary' => ['required', 'numeric', 'min:0'],
            'joining_date' => ['required', 'date', 'after:today'],
            'offer_expiry' => ['required', 'date', 'after:today'],
            'position' => ['required', 'string', 'max:255'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'designation_id' => ['nullable', 'exists:designations,id'],
            'benefits' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'application_id.required' => 'The job application is required.',
            'application_id.exists' => 'The selected job application does not exist.',
            'offered_salary.required' => 'The offered salary is required.',
            'offered_salary.min' => 'The offered salary must be at least 0.',
            'joining_date.required' => 'The joining date is required.',
            'joining_date.after' => 'The joining date must be a future date.',
            'offer_expiry.required' => 'The offer expiry date is required.',
            'offer_expiry.after' => 'The offer expiry date must be a future date.',
            'position.required' => 'The position is required.',
            'department_id.exists' => 'The selected department does not exist.',
            'designation_id.exists' => 'The selected designation does not exist.',
        ];
    }
}
