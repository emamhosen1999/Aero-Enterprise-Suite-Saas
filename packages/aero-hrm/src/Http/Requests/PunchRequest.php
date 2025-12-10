<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PunchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
            'qr_code' => 'nullable|string|max:255|regex:/^[A-Za-z0-9]+$/',
            'nfc_tag' => 'nullable|string|max:255',
            'device_fingerprint' => 'nullable|string|max:1000',
            'wifi_ssid' => 'nullable|string|max:100',
        ];
    }

    public function messages(): array
    {
        return [
            'lat.between' => 'Invalid latitude coordinate.',
            'lng.between' => 'Invalid longitude coordinate.',
            'qr_code.regex' => 'Invalid QR code format.',
        ];
    }

    protected function prepareForValidation()
    {
        // Sanitize inputs
        if ($this->has('qr_code')) {
            $this->merge([
                'qr_code' => preg_replace('/[^A-Za-z0-9]/', '', $this->qr_code),
            ]);
        }
    }
}
