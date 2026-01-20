<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Requests\Admin;

use Aero\Platform\Models\ProspectLead;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Update Lead Request
 */
class UpdateLeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['nullable', 'string', 'max:255'],
            'company_name' => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:50'],
            'country' => ['nullable', 'string', 'max:100'],
            'source' => ['nullable', 'string', 'in:' . implode(',', array_keys(ProspectLead::getSourceOptions()))],
            'source_detail' => ['nullable', 'string', 'max:500'],
            'interest_level' => ['nullable', 'string', 'in:low,medium,high'],
            'interests' => ['nullable', 'array'],
            'interests.*' => ['string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:5000'],
            'status' => ['nullable', 'string', 'in:' . implode(',', array_keys(ProspectLead::getStatusOptions()))],
        ];
    }

    public function messages(): array
    {
        return [
            'source.in' => 'Please select a valid lead source.',
            'interest_level.in' => 'Interest level must be low, medium, or high.',
            'status.in' => 'Please select a valid status.',
        ];
    }
}
