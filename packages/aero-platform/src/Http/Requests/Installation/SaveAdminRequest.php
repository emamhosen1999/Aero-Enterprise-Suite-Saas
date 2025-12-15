<?php

namespace Aero\Platform\Http\Requests\Installation;

use Illuminate\Foundation\Http\FormRequest;

class SaveAdminRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'admin_name' => ['required', 'string'],
            'admin_email' => ['required', 'email'],
            'admin_password' => ['required', 'confirmed', 'min:8'],
        ];
    }
}