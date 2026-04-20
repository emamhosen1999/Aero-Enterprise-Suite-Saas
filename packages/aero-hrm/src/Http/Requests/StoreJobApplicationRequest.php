<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreJobApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'job_id' => ['required', 'exists:jobs,id'],
            'applicant_name' => ['required', 'string', 'max:255'],
            'applicant_email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'resume' => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'cover_letter' => ['nullable', 'string', 'max:5000'],
            'experience_years' => ['nullable', 'integer', 'min:0'],
            'current_salary' => ['nullable', 'numeric', 'min:0'],
            'expected_salary' => ['nullable', 'numeric', 'min:0'],
            'notice_period' => ['nullable', 'integer', 'min:0'],
            'source' => ['nullable', 'in:website,referral,linkedin,indeed,other'],
        ];
    }

    public function messages(): array
    {
        return [
            'job_id.required' => 'Job posting is required.',
            'job_id.exists' => 'Selected job posting does not exist.',
            'applicant_name.required' => 'Applicant name is required.',
            'applicant_name.max' => 'Applicant name must not exceed 255 characters.',
            'applicant_email.required' => 'Applicant email is required.',
            'applicant_email.email' => 'Please provide a valid email address.',
            'applicant_email.max' => 'Email must not exceed 255 characters.',
            'phone.max' => 'Phone number must not exceed 20 characters.',
            'resume.file' => 'Resume must be a valid file.',
            'resume.mimes' => 'Resume must be a PDF, DOC, or DOCX file.',
            'resume.max' => 'Resume file size must not exceed 5MB.',
            'cover_letter.max' => 'Cover letter must not exceed 5000 characters.',
            'experience_years.integer' => 'Experience years must be a whole number.',
            'experience_years.min' => 'Experience years cannot be negative.',
            'current_salary.numeric' => 'Current salary must be a valid number.',
            'current_salary.min' => 'Current salary cannot be negative.',
            'expected_salary.numeric' => 'Expected salary must be a valid number.',
            'expected_salary.min' => 'Expected salary cannot be negative.',
            'notice_period.integer' => 'Notice period must be a whole number.',
            'notice_period.min' => 'Notice period cannot be negative.',
            'source.in' => 'Source must be website, referral, linkedin, indeed, or other.',
        ];
    }
}
