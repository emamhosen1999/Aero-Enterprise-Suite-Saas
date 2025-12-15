<?php

namespace Aero\Platform\Http\Requests\Installation;

use Illuminate\Foundation\Http\FormRequest;

class TestDatabaseRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'host' => ['required', 'string'],
            'port' => ['required', 'integer'],
            'database' => ['required', 'string'],
            'username' => ['required', 'string'],
            'password' => ['nullable', 'string'],
        ];
    }
}