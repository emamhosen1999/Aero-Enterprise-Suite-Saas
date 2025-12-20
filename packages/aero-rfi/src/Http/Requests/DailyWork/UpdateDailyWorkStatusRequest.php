<?php

namespace Aero\Rfi\Http\Requests\DailyWork;

use Aero\Rfi\Models\DailyWork;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * UpdateDailyWorkStatusRequest
 *
 * Validates requests to update daily work status.
 */
class UpdateDailyWorkStatusRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $dailyWork = DailyWork::find($this->input('id'));

        if (! $dailyWork) {
            return false;
        }

        return $this->user()->can('update', $dailyWork);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id' => ['required', 'exists:daily_works,id'],
            'status' => ['required', Rule::in(DailyWork::$statuses)],
            'inspection_result' => ['nullable', Rule::in(DailyWork::$inspectionResults)],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        $validStatuses = implode(', ', DailyWork::$statuses);
        $validResults = implode(', ', DailyWork::$inspectionResults);

        return [
            'id.required' => 'Daily Work ID is required.',
            'id.exists' => 'Daily Work not found.',
            'status.required' => 'Status is required.',
            'status.in' => "Status must be one of: {$validStatuses}.",
            'inspection_result.in' => "Inspection result must be one of: {$validResults}.",
        ];
    }
}
