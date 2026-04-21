<?php

namespace Aero\HRM\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ApplyTalentOpportunityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cover_note' => ['nullable', 'string', 'max:2000'],
            'match_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'cover_note.max' => 'Cover note must not exceed 2000 characters.',
            'match_score.numeric' => 'Match score must be a number.',
            'match_score.min' => 'Match score must be at least 0.',
            'match_score.max' => 'Match score must not exceed 100.',
        ];
    }
}
