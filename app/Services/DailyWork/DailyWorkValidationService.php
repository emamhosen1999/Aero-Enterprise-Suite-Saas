<?php

namespace App\Services\DailyWork;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class DailyWorkValidationService
{
    /**
     * Validate import file request
     */
    public function validateImportFile(Request $request): void
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,csv',
        ]);
    }

    /**
     * Validate imported daily works data
     */
    public function validateImportedData(array $importedDailyWorks, int $sheetIndex): array
    {
        $index = $sheetIndex + 1;
        $referenceDate = $importedDailyWorks[0][0] ?? null;

        if (! $referenceDate) {
            throw ValidationException::withMessages([
                'date' => "Sheet {$index} is missing a reference date.",
            ]);
        }

        $customAttributes = $this->buildCustomAttributes($importedDailyWorks, $index);
        $rules = $this->getImportValidationRules($referenceDate);
        $messages = $this->getImportValidationMessages();

        $validator = Validator::make($importedDailyWorks, $rules, $messages, $customAttributes);

        if ($validator->fails()) {
            throw ValidationException::withMessages($validator->errors()->toArray());
        }

        return [
            'referenceDate' => $referenceDate,
            'validated' => true,
        ];
    }

    /**
     * Validate add daily work request
     */
    public function validateAddRequest(Request $request): array
    {
        return $request->validate([
            'date' => 'required|date',
            'number' => 'required|string',
            'time' => 'required|string',
            'status' => 'required|in:new,completed,resubmission,emergency',
            'inspection_result' => $request->input('status') === 'completed' ? 'required|in:pass,fail' : 'nullable|in:pass,fail',
            'type' => 'required|string',
            'description' => 'required|string',
            'location' => 'required|string|custom_location',
            'side' => 'required|string',
            'qty_layer' => $request->input('type') === 'Embankment' ? 'required|string' : '',
            'completion_time' => $request->input('status') === 'completed' ? 'required|string' : '',
            'inspection_details' => 'nullable|string',
        ], [
            'date.required' => 'RFI Date is required.',
            'number.required' => 'RFI Number is required.',
            'time.required' => 'RFI Time is required.',
            'time.string' => 'RFI Time is not string.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be one of: new, completed, resubmission, emergency.',
            'inspection_result.required' => 'Inspection result (Pass/Fail) is required for completed work.',
            'inspection_result.in' => 'Inspection result must be either pass or fail.',
            'type.required' => 'Type is required.',
            'description.required' => 'Description is required.',
            'location.required' => 'Location is required.',
            'location.custom_location' => 'The :attribute must start with \'K\' and be in the range K0 to K48.',
            'side.required' => 'Road Type is required.',
            'qty_layer.required' => $request->input('type') === 'Embankment' ? 'Layer No. is required when the type is Embankment.' : '',
            'completion_time.required' => 'Completion time is required.',
            'qty_layer.string' => 'Quantity/Layer No. is not string',
        ]);
    }

    /**
     * Validate update daily work request
     */
    public function validateUpdateRequest(Request $request): array
    {
        return $request->validate([
            'id' => 'required|integer|exists:daily_works,id',
            'date' => 'required|date',
            'number' => 'required|string',
            'planned_time' => 'required|string',
            'status' => 'required|in:new,completed,resubmission,emergency',
            'inspection_result' => $request->input('status') === 'completed' ? 'required|in:pass,fail' : 'nullable|in:pass,fail',
            'type' => 'required|string',
            'description' => 'required|string',
            'location' => 'required|string|custom_location',
            'side' => 'required|string',
            'qty_layer' => $request->input('type') === 'Embankment' ? 'required|string' : '',
            'completion_time' => $request->input('status') === 'completed' ? 'required|string' : '',
            'inspection_details' => 'nullable|string',
        ], [
            'id.required' => 'Daily Work ID is required.',
            'id.integer' => 'Daily Work ID must be an integer.',
            'id.exists' => 'Daily Work not found.',
            'date.required' => 'RFI Date is required.',
            'number.required' => 'RFI Number is required.',
            'planned_time.required' => 'RFI Time is required.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be one of: new, completed, resubmission, emergency.',
            'inspection_result.required' => 'Inspection result (Pass/Fail) is required for completed work.',
            'inspection_result.in' => 'Inspection result must be either pass or fail.',
            'type.required' => 'Type is required.',
            'description.required' => 'Description is required.',
            'location.required' => 'Location is required.',
            'location.custom_location' => 'The :attribute must start with \'K\' and be in the range K0 to K48.',
            'side.required' => 'Road Type is required.',
            'qty_layer.required' => $request->input('type') === 'Embankment' ? 'Layer No. is required when the type is Embankment.' : '',
            'completion_time.required' => 'Completion time is required when status is completed.',
        ]);
    }

    /**
     * Build custom attributes for validation messages
     */
    private function buildCustomAttributes(array $importedDailyWorks, int $sheetIndex): array
    {
        $customAttributes = [];

        foreach ($importedDailyWorks as $rowIndex => $importedDailyWork) {
            $taskNumber = $importedDailyWork[1] ?? 'unknown';
            $date = $importedDailyWork[0] ?? 'unknown';

            $customAttributes["$rowIndex.0"] = "Sheet {$sheetIndex} - Daily Work number {$taskNumber}'s date {$date}";
            $customAttributes["$rowIndex.1"] = "Sheet {$sheetIndex} - Daily Work number {$taskNumber}'s RFI number";
            $customAttributes["$rowIndex.2"] = "Sheet {$sheetIndex} - Daily Work number {$taskNumber}'s type";
            $customAttributes["$rowIndex.3"] = "Sheet {$sheetIndex} - Daily Work number {$taskNumber}'s description";
            $customAttributes["$rowIndex.4"] = "Sheet {$sheetIndex} - Daily Work number {$taskNumber}'s location";
        }

        return $customAttributes;
    }

    /**
     * Get validation rules for import data
     */
    private function getImportValidationRules(string $referenceDate): array
    {
        return [
            '*.0' => [
                'required',
                'date_format:Y-m-d',
                function ($attribute, $value, $fail) use ($referenceDate) {
                    if ($value !== $referenceDate) {
                        $fail("The $attribute must match the reference date {$referenceDate}.");
                    }
                },
            ],
            '*.1' => 'required|string',
            '*.2' => 'required|string|in:Embankment,Structure,Pavement',
            '*.3' => 'required|string',
            '*.4' => 'required|string|custom_location',
        ];
    }

    /**
     * Get validation messages for import data
     */
    private function getImportValidationMessages(): array
    {
        return [
            '*.0.required' => ':attribute must have a valid date.',
            '*.0.date_format' => ':attribute must be in the format Y-m-d.',
            '*.1.required' => ':attribute must have a value.',
            '*.2.required' => ':attribute must have a value.',
            '*.2.in' => ':attribute must be either Embankment, Structure, or Pavement.',
            '*.3.required' => ':attribute must have a value.',
            '*.4.required' => ':attribute must have a value.',
        ];
    }
}