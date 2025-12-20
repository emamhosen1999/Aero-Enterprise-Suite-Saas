<?php

namespace Aero\Rfi\Http\Requests\Objection;

use Aero\Rfi\Models\Objection;
use Illuminate\Foundation\Http\FormRequest;

class UpdateObjectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $objection = $this->route('objection');

        // Only allow updates to draft objections
        if ($objection->status !== Objection::STATUS_DRAFT) {
            return false;
        }

        return $this->user()->can('update', $objection);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'category' => ['sometimes', 'required', 'string', 'in:'.implode(',', Objection::$categories)],
            'chainage_from' => ['nullable', 'string', 'max:100'],
            'chainage_to' => ['nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:5000'],
            'reason' => ['nullable', 'string', 'max:5000'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category.in' => 'The category must be one of: '.implode(', ', array_values(Objection::$categoryLabels)),
        ];
    }
}
