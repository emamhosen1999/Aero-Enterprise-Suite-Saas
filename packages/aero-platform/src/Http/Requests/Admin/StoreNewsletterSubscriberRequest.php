<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Requests\Admin;

use Aero\Platform\Models\NewsletterSubscriber;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Store Newsletter Subscriber Request
 */
class StoreNewsletterSubscriberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'in:' . implode(',', array_keys(NewsletterSubscriber::getSourceOptions()))],
            'preferences' => ['nullable', 'array'],
            'preferences.*' => ['string', 'max:50'],
            'skip_confirmation' => ['boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'source.in' => 'Please select a valid subscription source.',
        ];
    }
}
