<?php

namespace Aero\Platform\Http\Requests\Installation;

use Illuminate\Foundation\Http\FormRequest;

class SavePlatformRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'app_name' => ['required', 'string', 'max:255'],
            'app_url' => ['required', 'url'],
            'mail_mailer' => ['required', 'string'],
            'mail_host' => ['required', 'string'],
            'mail_port' => ['required', 'integer'],
            'mail_username' => ['nullable', 'string'],
            'mail_password' => ['nullable', 'string'],
            'mail_encryption' => ['nullable', 'string'],
            'mail_from_address' => ['required', 'email'],
            'mail_from_name' => ['required', 'string'],
            // Add any other fields you need here
        ];
    }
}