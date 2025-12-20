<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\DailyWork;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * DailyWorkValidationService
 *
 * Service for validating Daily Work data.
 */
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
        $statusValidation = 'required|in:'.implode(',', DailyWork::$statuses);
        $inspectionValidation = $request->input('status') === DailyWork::STATUS_COMPLETED
            ? 'required|in:'.implode(',', DailyWork::$inspectionResults)
            : 'nullable|in:'.implode(',', DailyWork::$inspectionResults);
        $typeValidation = 'required|in:'.implode(',', DailyWork::$types);
        $sideValidation = 'required|in:'.implode(',', DailyWork::$sides);

        return $request->validate([
            'date' => 'required|date',
            'number' => 'required|string',
            'planned_time' => 'required|string',
            'status' => $statusValidation,
            'inspection_result' => $inspectionValidation,
            'type' => $typeValidation,
            'description' => 'required|string',
            'location' => 'required|string',
            'side' => $sideValidation,
            'qty_layer' => $request->input('type') === DailyWork::TYPE_EMBANKMENT ? 'required|string' : 'nullable|string',
            'completion_time' => $request->input('status') === DailyWork::STATUS_COMPLETED ? 'required|string' : 'nullable|string',
            'inspection_details' => 'nullable|string|max:1000',
            'work_location_id' => 'nullable|exists:work_locations,id',
        ], [
            'date.required' => 'RFI Date is required.',
            'number.required' => 'RFI Number is required.',
            'planned_time.required' => 'RFI Time is required.',
            'planned_time.string' => 'RFI Time must be a string.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be one of: '.implode(', ', DailyWork::$statuses).'.',
            'inspection_result.required' => 'Inspection result is required for completed work.',
            'inspection_result.in' => 'Inspection result must be one of: '.implode(', ', DailyWork::$inspectionResults).'.',
            'type.required' => 'Type is required.',
            'type.in' => 'Type must be one of: '.implode(', ', DailyWork::$types).'.',
            'description.required' => 'Description is required.',
            'location.required' => 'Location is required.',
            'side.required' => 'Road Type is required.',
            'side.in' => 'Road Type must be one of: '.implode(', ', DailyWork::$sides).'.',
            'qty_layer.required' => 'Layer No. is required when the type is Embankment.',
            'completion_time.required' => 'Completion time is required when status is completed.',
            'inspection_details.max' => 'Inspection details cannot exceed 1000 characters.',
        ]);
    }

    /**
     * Validate update daily work request
     */
    public function validateUpdateRequest(Request $request): array
    {
        $statusValidation = 'required|in:'.implode(',', DailyWork::$statuses);
        $inspectionValidation = $request->input('status') === DailyWork::STATUS_COMPLETED
            ? 'required|in:'.implode(',', DailyWork::$inspectionResults)
            : 'nullable|in:'.implode(',', DailyWork::$inspectionResults);
        $typeValidation = 'required|in:'.implode(',', DailyWork::$types);
        $sideValidation = 'required|in:'.implode(',', DailyWork::$sides);

        return $request->validate([
            'id' => 'required|integer|exists:daily_works,id',
            'date' => 'required|date',
            'number' => 'required|string',
            'planned_time' => 'required|string',
            'status' => $statusValidation,
            'inspection_result' => $inspectionValidation,
            'type' => $typeValidation,
            'description' => 'required|string',
            'location' => 'required|string',
            'side' => $sideValidation,
            'qty_layer' => $request->input('type') === DailyWork::TYPE_EMBANKMENT ? 'required|string' : 'nullable|string',
            'completion_time' => $request->input('status') === DailyWork::STATUS_COMPLETED ? 'required|string' : 'nullable|string',
            'inspection_details' => 'nullable|string|max:1000',
            'work_location_id' => 'nullable|exists:work_locations,id',
        ], [
            'id.required' => 'Daily Work ID is required.',
            'id.integer' => 'Daily Work ID must be an integer.',
            'id.exists' => 'Daily Work not found.',
            'date.required' => 'RFI Date is required.',
            'number.required' => 'RFI Number is required.',
            'planned_time.required' => 'RFI Time is required.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be one of: '.implode(', ', DailyWork::$statuses).'.',
            'inspection_result.required' => 'Inspection result is required for completed work.',
            'inspection_result.in' => 'Inspection result must be one of: '.implode(', ', DailyWork::$inspectionResults).'.',
            'type.required' => 'Type is required.',
            'type.in' => 'Type must be one of: '.implode(', ', DailyWork::$types).'.',
            'description.required' => 'Description is required.',
            'location.required' => 'Location is required.',
            'side.required' => 'Road Type is required.',
            'side.in' => 'Road Type must be one of: '.implode(', ', DailyWork::$sides).'.',
            'qty_layer.required' => 'Layer No. is required when the type is Embankment.',
            'completion_time.required' => 'Completion time is required when status is completed.',
            'inspection_details.max' => 'Inspection details cannot exceed 1000 characters.',
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
            '*.2' => 'required|string|in:'.implode(',', DailyWork::$types),
            '*.3' => 'required|string',
            '*.4' => 'required|string',
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
            '*.2.in' => ':attribute must be one of: '.implode(', ', DailyWork::$types).'.',
            '*.3.required' => ':attribute must have a value.',
            '*.4.required' => ':attribute must have a value.',
        ];
    }
}
