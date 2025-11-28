<?php

namespace App\Services\DailyWork;

use App\Models\DailyWork;
use App\Models\Jurisdiction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class DailyWorkCrudService
{
    private DailyWorkValidationService $validationService;

    public function __construct(DailyWorkValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

    /**
     * Create a new daily work entry
     */
    public function create(Request $request): array
    {
        $validatedData = $this->validationService->validateAddRequest($request);

        // Check if daily work with same number already exists
        $existingDailyWork = DailyWork::where('number', $validatedData['number'])->first();
        if ($existingDailyWork) {
            throw ValidationException::withMessages([
                'number' => 'A daily work with the same RFI number already exists.',
            ]);
        }

        // Find jurisdiction for the location
        $jurisdiction = $this->findJurisdictionForLocation($validatedData['location']);
        if (! $jurisdiction) {
            throw ValidationException::withMessages([
                'location' => 'No jurisdiction found for the specified location.',
            ]);
        }

        $inCharge = $jurisdiction->incharge;

        // Create new daily work
        $dailyWork = new DailyWork($validatedData);
        $dailyWork->incharge = $inCharge;
        $dailyWork->status = 'new';
        $dailyWork->save();

        return [
            'message' => 'Daily work added successfully',
            'dailyWork' => $dailyWork,
        ];
    }

    /**
     * Update an existing daily work entry
     */
    public function update(Request $request): array
    {
        $validatedData = $this->validationService->validateUpdateRequest($request);

        $dailyWork = DailyWork::findOrFail($validatedData['id']);

        // Check if another daily work with same number exists (excluding current)
        $existingDailyWork = DailyWork::where('number', $validatedData['number'])
            ->where('id', '!=', $validatedData['id'])
            ->first();

        if ($existingDailyWork) {
            throw ValidationException::withMessages([
                'number' => 'A daily work with the same RFI number already exists.',
            ]);
        }

        // Find jurisdiction for the location if location changed
        if ($dailyWork->location !== $validatedData['location']) {
            $jurisdiction = $this->findJurisdictionForLocation($validatedData['location']);
            if (! $jurisdiction) {
                throw ValidationException::withMessages([
                    'location' => 'No jurisdiction found for the specified location.',
                ]);
            }
            $validatedData['incharge'] = $jurisdiction->incharge;
        }

        // Update daily work
        $dailyWork->update($validatedData);

        return [
            'message' => 'Daily work updated successfully',
            'dailyWork' => $dailyWork,
        ];
    }

    /**
     * Delete a daily work entry
     */
    public function delete(Request $request): array
    {
        $request->validate([
            'id' => 'required|integer|exists:daily_works,id',
        ]);

        $dailyWork = DailyWork::findOrFail($request->id);

        // Store daily work info for response
        $dailyWorkInfo = [
            'id' => $dailyWork->id,
            'number' => $dailyWork->number,
            'description' => $dailyWork->description,
        ];

        // Delete the daily work
        $dailyWork->delete();

        return [
            'message' => "Daily work '{$dailyWorkInfo['number']}' deleted successfully",
            'deletedDailyWork' => $dailyWorkInfo,
        ];
    }

    /**
     * Get latest timestamp for synchronization
     */
    public function getLatestTimestamp(): string
    {
        return DailyWork::max('updated_at') ?? Carbon::now()->toISOString();
    }

    /**
     * Find jurisdiction for a given location
     */
    private function findJurisdictionForLocation(string $location): ?Jurisdiction
    {
        $chainageRegex = '/([A-Z]*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)-([A-Z]*K[0-9]+(?:\+[0-9]+(?:\.[0-9]+)?)?)|([A-Z]*K[0-9]+)(.*)/';

        if (! preg_match($chainageRegex, $location, $matches)) {
            return null;
        }

        // Extract start and end chainages
        $startChainage = $matches[1] === '' ? $matches[0] : $matches[1];
        $endChainage = $matches[2] === '' ? null : $matches[2];

        // Convert chainages to comparable format
        $startChainageFormatted = $this->formatChainage($startChainage);
        $endChainageFormatted = $endChainage ? $this->formatChainage($endChainage) : null;

        $jurisdictions = Jurisdiction::all();

        foreach ($jurisdictions as $jurisdiction) {
            $formattedStartJurisdiction = $this->formatChainage($jurisdiction->start_chainage);
            $formattedEndJurisdiction = $this->formatChainage($jurisdiction->end_chainage);

            // Check if the start chainage is within the jurisdiction's range
            if ($startChainageFormatted >= $formattedStartJurisdiction &&
                $startChainageFormatted <= $formattedEndJurisdiction) {
                Log::info('Jurisdiction Match Found: '.$formattedStartJurisdiction.'-'.$formattedEndJurisdiction);

                return $jurisdiction;
            }

            // If an end chainage exists, check if it's within the jurisdiction's range
            if ($endChainageFormatted &&
                $endChainageFormatted >= $formattedStartJurisdiction &&
                $endChainageFormatted <= $formattedEndJurisdiction) {
                Log::info('Jurisdiction Match Found for End Chainage: '.$formattedStartJurisdiction.'-'.$formattedEndJurisdiction);

                return $jurisdiction;
            }
        }

        return null;
    }

    /**
     * Format chainage for comparison
     */
    private function formatChainage(string $chainage): float
    {
        // Remove spaces and convert to uppercase
        $chainage = strtoupper(trim($chainage));

        // Extract K number and additional values
        if (preg_match('/K(\d+)(?:\+(\d+(?:\.\d+)?))?/', $chainage, $matches)) {
            $kNumber = (int) $matches[1];
            $additional = isset($matches[2]) ? (float) $matches[2] : 0;

            // Convert to a comparable format (e.g., K05+900 becomes 5.900)
            return $kNumber + ($additional / 1000);
        }

        return 0;
    }

    /**
     * Get ordinal number (1st, 2nd, 3rd, etc.)
     */
    public function getOrdinalNumber(int $number): string
    {
        $suffix = ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'];

        if ($number % 100 >= 11 && $number % 100 <= 19) {
            return $number.'th';
        }

        $lastDigit = $number % 10;

        return $number.$suffix[$lastDigit];
    }
}