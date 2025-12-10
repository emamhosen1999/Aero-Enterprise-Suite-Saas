<?php

namespace Aero\Core\Actions\Fortify\Actions\Fortify;

trait PasswordValidationRules
{
    /**
     * Get the validation rules used to validate passwords.
     *
     * @return array<int, \Illuminate\Contracts\Validation\Rule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return [
            'password' => [
                'required',
                'string',
                'min:12',
                'regex:/[a-z]/',      // at least one lowercase
                'regex:/[A-Z]/',      // at least one uppercase
                'regex:/[0-9]/',      // at least one digit
                'regex:/[@$!%*?&#]/', // at least one special character
                'confirmed',
            ],
        ];
    }
}
