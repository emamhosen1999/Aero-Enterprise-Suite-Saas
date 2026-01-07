<?php

namespace Aero\Rfi\Imports;

use Aero\Rfi\Models\Rfi;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class RfiImport implements ToModel, WithHeadingRow, WithValidation
{
    /**
     * Map each row to a Rfi model.
     */
    public function model(array $row): Rfi
    {
        return new Rfi([
            'date' => $row['date'] ?? $row[0] ?? null,
            'number' => $row['number'] ?? $row['rfi_number'] ?? $row[1] ?? null,
            'type' => $row['type'] ?? $row['work_type'] ?? $row[2] ?? null,
            'description' => $row['description'] ?? $row[3] ?? null,
            'location' => $row['location'] ?? $row['chainage'] ?? $row[4] ?? null,
            'side' => $row['side'] ?? $row[5] ?? null,
            'qty_layer' => $row['qty_layer'] ?? $row['quantity'] ?? $row[6] ?? null,
            'planned_time' => $row['planned_time'] ?? $row[7] ?? null,
            'status' => $row['status'] ?? 'new',
        ]);
    }

    /**
     * Validation rules for imported data.
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date'],
            'number' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'location' => ['nullable', 'string', 'max:255'],
            'side' => ['nullable', 'string', 'max:50'],
            'qty_layer' => ['nullable', 'integer', 'min:0'],
            'planned_time' => ['nullable', 'string', 'max:100'],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function customValidationMessages(): array
    {
        return [
            'date.required' => 'The date field is required.',
            'date.date' => 'The date must be a valid date format.',
            'number.required' => 'The RFI number is required.',
            'type.required' => 'The work type is required.',
        ];
    }
}
