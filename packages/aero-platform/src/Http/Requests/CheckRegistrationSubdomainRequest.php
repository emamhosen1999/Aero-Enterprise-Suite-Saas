<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CheckRegistrationSubdomainRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'subdomain' => ['required', 'string', 'max:63'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('subdomain')) {
            $this->merge([
                'subdomain' => strtolower((string) $this->input('subdomain')),
            ]);
        }
    }
}
