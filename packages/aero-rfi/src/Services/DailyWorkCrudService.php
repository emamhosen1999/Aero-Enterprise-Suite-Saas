<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\DailyWork;
use Aero\Rfi\Traits\WorkLocationMatcher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * DailyWorkCrudService
 *
 * Service for Daily Work CRUD operations.
 */
class DailyWorkCrudService
{
    use WorkLocationMatcher;

    protected DailyWorkValidationService $validationService;

    public function __construct(DailyWorkValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

    /**
     * Create a new daily work entry
     */
    public function create(Request $request): array
    {
        return DB::transaction(function () use ($request) {
            $validatedData = $this->validationService->validateAddRequest($request);

            // Check if daily work with same number already exists
            $existingDailyWork = DailyWork::where('number', $validatedData['number'])->first();
            if ($existingDailyWork) {
                throw ValidationException::withMessages([
                    'number' => 'A daily work with the same RFI number already exists.',
                ]);
            }

            // Find work location for the location if not provided
            if (empty($validatedData['work_location_id'])) {
                $workLocation = $this->findWorkLocationForLocation($validatedData['location']);
                if ($workLocation) {
                    $validatedData['work_location_id'] = $workLocation->id;
                    $validatedData['incharge_user_id'] = $workLocation->incharge_user_id;
                }
            }

            // Create new daily work
            $dailyWork = new DailyWork($validatedData);
            $dailyWork->status = DailyWork::STATUS_NEW;
            $dailyWork->save();

            return [
                'message' => 'Daily work added successfully',
                'dailyWork' => $dailyWork->fresh(['inchargeUser', 'assignedUser', 'workLocation']),
            ];
        });
    }

    /**
     * Update an existing daily work entry
     */
    public function update(Request $request): array
    {
        return DB::transaction(function () use ($request) {
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

            // Find work location for the location if location changed and work_location_id not provided
            if ($dailyWork->location !== $validatedData['location'] && empty($validatedData['work_location_id'])) {
                $workLocation = $this->findWorkLocationForLocation($validatedData['location']);
                if ($workLocation) {
                    $validatedData['work_location_id'] = $workLocation->id;
                    $validatedData['incharge_user_id'] = $workLocation->incharge_user_id;
                }
            }

            // Update daily work
            $dailyWork->update($validatedData);

            return [
                'message' => 'Daily work updated successfully',
                'dailyWork' => $dailyWork->fresh(['inchargeUser', 'assignedUser', 'workLocation']),
            ];
        });
    }

    /**
     * Delete a daily work entry
     */
    public function delete(Request $request): array
    {
        return DB::transaction(function () use ($request) {
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

            // Delete the daily work (soft delete)
            $dailyWork->delete();

            return [
                'message' => "Daily work '{$dailyWorkInfo['number']}' deleted successfully",
                'deletedDailyWork' => $dailyWorkInfo,
            ];
        });
    }

    /**
     * Get latest timestamp for synchronization
     */
    public function getLatestTimestamp(): string
    {
        return DailyWork::max('updated_at') ?? Carbon::now()->toISOString();
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
