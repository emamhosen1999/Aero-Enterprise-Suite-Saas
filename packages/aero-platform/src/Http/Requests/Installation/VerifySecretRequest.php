<?php

namespace Aero\Platform\Http\Requests\Installation;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

class VerifySecretRequest extends FormRequest
{
    public function rules(): array
    {
        return ['secret_code' => ['required', 'string']];
    }

    public function authenticate(): void
    {
        $key = 'install_attempts:' . $this->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);
            throw ValidationException::withMessages([
                'secret_code' => "Too many attempts. Try again in {$seconds} seconds."
            ]);
        }

        $hash = config('app.installation_secret_hash');
        if (!$hash || !Hash::check($this->input('secret_code'), $hash)) {
            RateLimiter::hit($key, 900);
            throw ValidationException::withMessages(['secret_code' => 'Invalid secret code.']);
        }

        RateLimiter::clear($key);
        session(['installation_verified' => true]);
    }
}