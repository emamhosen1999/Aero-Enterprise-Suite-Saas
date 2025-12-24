<?php

namespace Aero\HRM\Http\Requests\HR;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

/**
 * Form Request for Employee Document Upload
 *
 * Validates document uploads for employee profiles.
 * Enforces PDF/JPG/PNG file types and 2MB max size.
 */
class StoreEmployeeDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Allow if user has document management permission or is uploading their own document
        $userId = $this->route('user')?->id ?? $this->route('userId');

        return Auth::check() && (
            Auth::user()->can('hr.documents.create') ||
            Auth::id() === (int) $userId
        );
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'document' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png',
                'max:2048', // 2MB max
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'document_type' => [
                'required',
                'string',
                'in:identity,passport,contract,certificate,license,visa,work_permit,tax_document,other',
            ],
            'document_number' => [
                'nullable',
                'string',
                'max:100',
            ],
            'issue_date' => [
                'nullable',
                'date',
                'before_or_equal:today',
            ],
            'expiry_date' => [
                'nullable',
                'date',
                'after:issue_date',
            ],
            'issued_by' => [
                'nullable',
                'string',
                'max:255',
            ],
            'issued_country' => [
                'nullable',
                'string',
                'size:3', // ISO 3166-1 alpha-3 country code
            ],
            'notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'is_confidential' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'document.required' => 'Please select a document to upload.',
            'document.file' => 'The uploaded file is invalid.',
            'document.mimes' => 'Only PDF, JPG, JPEG, and PNG files are allowed.',
            'document.max' => 'The document must not exceed 2MB in size.',
            'name.required' => 'Please provide a name for the document.',
            'name.max' => 'The document name must not exceed 255 characters.',
            'document_type.required' => 'Please select a document type.',
            'document_type.in' => 'The selected document type is invalid.',
            'issue_date.before_or_equal' => 'The issue date cannot be in the future.',
            'expiry_date.after' => 'The expiry date must be after the issue date.',
            'issued_country.size' => 'Please use a valid 3-letter country code (e.g., USA, GBR, BGD).',
        ];
    }

    /**
     * Get custom attribute names for error messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'document' => 'document file',
            'document_type' => 'document type',
            'document_number' => 'document number',
            'issue_date' => 'issue date',
            'expiry_date' => 'expiry date',
            'issued_by' => 'issuing authority',
            'issued_country' => 'country of issue',
            'is_confidential' => 'confidentiality flag',
        ];
    }
}
