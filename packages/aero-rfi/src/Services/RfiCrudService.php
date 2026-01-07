<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Traits\WorkLocationMatcher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * RfiCrudService
 *
 * Service for RFI CRUD operations.
 */
class RfiCrudService
{
    use WorkLocationMatcher;

    protected RfiValidationService $validationService;

    public function __construct(RfiValidationService $validationService)
    {
        $this->validationService = $validationService;
    }

    /**
     * Create a new RFI entry
     */
    public function create(Request $request): array
    {
        return DB::transaction(function () use ($request) {
            $validatedData = $this->validationService->validateAddRequest($request);

            // Check if RFI with same number already exists
            $existingRfi = Rfi::where('number', $validatedData['number'])->first();
            if ($existingRfi) {
                throw ValidationException::withMessages([
                    'number' => 'An RFI with the same number already exists.',
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

            // Create new RFI
            $rfi = new Rfi($validatedData);
            $rfi->status = Rfi::STATUS_NEW;
            $rfi->save();

            return [
                'message' => 'RFI created successfully',
                'rfi' => $rfi->fresh(['inchargeUser', 'assignedUser', 'workLocation']),
            ];
        });
    }

    /**
     * Update an existing RFI entry
     */
    public function update(Request $request): array
    {
        return DB::transaction(function () use ($request) {
            $validatedData = $this->validationService->validateUpdateRequest($request);

            $rfi = Rfi::findOrFail($validatedData['id']);

            // Check if another RFI with same number exists (excluding current)
            $existingRfi = Rfi::where('number', $validatedData['number'])
                ->where('id', '!=', $validatedData['id'])
                ->first();

            if ($existingRfi) {
                throw ValidationException::withMessages([
                    'number' => 'An RFI with the same number already exists.',
                ]);
            }

            // Find work location for the location if location changed and work_location_id not provided
            if ($rfi->location !== $validatedData['location'] && empty($validatedData['work_location_id'])) {
                $workLocation = $this->findWorkLocationForLocation($validatedData['location']);
                if ($workLocation) {
                    $validatedData['work_location_id'] = $workLocation->id;
                    $validatedData['incharge_user_id'] = $workLocation->incharge_user_id;
                }
            }

            // Update RFI
            $rfi->update($validatedData);

            return [
                'message' => 'RFI updated successfully',
                'rfi' => $rfi->fresh(['inchargeUser', 'assignedUser', 'workLocation']),
            ];
        });
    }

    /**
     * Delete an RFI entry
     */
    public function delete(Request $request): array
    {
        return DB::transaction(function () use ($request) {
            $request->validate([
                'id' => 'required|integer|exists:daily_works,id',
            ]);

            $rfi = Rfi::findOrFail($request->id);

            // Store RFI info for response
            $rfiInfo = [
                'id' => $rfi->id,
                'number' => $rfi->number,
                'description' => $rfi->description,
            ];

            // Delete the RFI (soft delete)
            $rfi->delete();

            return [
                'message' => "RFI '{$rfiInfo['number']}' deleted successfully",
                'deletedRfi' => $rfiInfo,
            ];
        });
    }

    /**
     * Get latest timestamp for synchronization
     */
    public function getLatestTimestamp(): string
    {
        return Rfi::max('updated_at') ?? Carbon::now()->toISOString();
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
