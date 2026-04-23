<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SaveRegistrationProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'step' => ['required', 'string', Rule::in([
                'account',
                'details',
                'verification',
                'verify-email',
                'verify-phone',
                'plan',
                'trial',
                'payment',
                'provisioning',
            ])],
            'data' => ['required', 'array'],
            'data.account' => ['sometimes', 'array'],
            'data.details' => ['sometimes', 'array'],
            'data.verification' => ['sometimes', 'array'],
            'data.plan' => ['sometimes', 'array'],
            'data.trial' => ['sometimes', 'array'],
            'data.payment' => ['sometimes', 'array'],
            'data.provisioning' => ['sometimes', 'array'],
        ];
    }
}
