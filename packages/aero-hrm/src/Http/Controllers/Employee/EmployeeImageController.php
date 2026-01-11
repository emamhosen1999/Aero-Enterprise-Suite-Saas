<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\Employee;
use Aero\HRM\Services\HRMAuthorizationService;
use Aero\HRM\Services\EmployeeResolutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileDoesNotExist;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileIsTooBig;

/**
 * Employee Image Controller
 *
 * Manages employee images for HR purposes (badges, org charts, ID cards).
 * This is SEPARATE from User profile images which are managed in Core.
 *
 * Architecture:
 * - User Profile Image (Core): For authentication/identity purposes
 * - Employee Image (HRM): For HR/work purposes (badges, org charts, ID cards)
 *
 * @see \Aero\HRM\Models\Employee
 */
class EmployeeImageController extends Controller
{
    public function __construct(
        protected HRMAuthorizationService $authService,
        protected EmployeeResolutionService $employeeResolver
    ) {}

    /**
     * Upload or update employee's HR image.
     *
     * This image is used for HR purposes like:
     * - Employee badges/ID cards
     * - Organization charts
     * - HR directory
     * - Internal employee profiles
     */
    public function upload(Request $request): JsonResponse
    {
        Log::info('[EmployeeImageUpload] Request received', [
            'employee_id' => $request->employee_id ?? 'not provided',
            'has_file' => $request->hasFile('employee_image'),
            'file_valid' => $request->hasFile('employee_image') ? $request->file('employee_image')->isValid() : false,
            'file_size' => $request->hasFile('employee_image') ? $request->file('employee_image')->getSize() : null,
            'file_mime' => $request->hasFile('employee_image') ? $request->file('employee_image')->getMimeType() : null,
            'auth_user_id' => Auth::id(),
        ]);

        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'employee_id' => 'required|integer|exists:employees,id',
                'employee_image' => [
                    'required',
                    'image',
                    'mimes:jpeg,png,jpg,webp',
                    'max:2048', // 2MB max
                    'dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000',
                ],
            ]);

            if ($validator->fails()) {
                Log::warning('[EmployeeImageUpload] Validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'employee_id' => $request->employee_id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed: ' . implode(', ', $validator->errors()->all()),
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Get the employee
            $employee = Employee::findOrFail($request->employee_id);
            Log::info('[EmployeeImageUpload] Employee found', [
                'employee_id' => $employee->id,
                'employee_code' => $employee->employee_code,
            ]);

            // Check authorization
            if (!$this->canUpdateEmployeeImage($employee)) {
                Log::warning('[EmployeeImageUpload] Authorization failed', [
                    'auth_user_id' => Auth::id(),
                    'target_employee_id' => $employee->id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this employee\'s image',
                ], 403);
            }

            Log::info('[EmployeeImageUpload] Authorization passed, proceeding with upload');

            // Clear any existing employee images (single file collection)
            if ($employee->hasMedia('employee_images')) {
                Log::info('[EmployeeImageUpload] Clearing existing employee image');
                $employee->clearMediaCollection('employee_images');
            }

            // Upload new employee image
            Log::info('[EmployeeImageUpload] Adding media from request');
            $media = $employee->addMediaFromRequest('employee_image')
                ->usingName($employee->employee_code . ' Employee Image')
                ->usingFileName(time() . '_employee.' . $request->file('employee_image')->getClientOriginalExtension())
                ->toMediaCollection('employee_images');

            Log::info('[EmployeeImageUpload] Media added successfully', [
                'media_id' => $media->id,
                'media_url' => $media->getUrl(),
            ]);

            // Get fresh employee data with image URLs
            $employee->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Employee image uploaded successfully',
                'employee' => [
                    'id' => $employee->id,
                    'employee_code' => $employee->employee_code,
                    'employee_image_url' => $employee->getEmployeeImageUrl(),
                    'employee_image_thumb' => $employee->getEmployeeImageUrl('thumb'),
                    'employee_image_medium' => $employee->getEmployeeImageUrl('medium'),
                ],
            ]);

        } catch (FileDoesNotExist $e) {
            Log::error('[EmployeeImageUpload] File does not exist', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'The uploaded file could not be found',
            ], 400);

        } catch (FileIsTooBig $e) {
            Log::error('[EmployeeImageUpload] File is too big', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'The uploaded file is too large. Maximum size is 2MB.',
            ], 400);

        } catch (\Exception $e) {
            Log::error('[EmployeeImageUpload] Unexpected error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload employee image: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove employee's HR image.
     */
    public function remove(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|integer|exists:employees,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $employee = Employee::findOrFail($request->employee_id);

            // Check authorization
            if (!$this->canUpdateEmployeeImage($employee)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to remove this employee\'s image',
                ], 403);
            }

            // Remove the employee image
            if ($employee->hasMedia('employee_images')) {
                $employee->clearMediaCollection('employee_images');

                Log::info('Employee image removed', [
                    'employee_id' => $employee->id,
                    'removed_by' => Auth::id(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Employee image removed successfully',
                    'employee' => [
                        'id' => $employee->id,
                        'employee_code' => $employee->employee_code,
                        'employee_image_url' => null,
                    ],
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'No employee image to remove',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to remove employee image', [
                'employee_id' => $request->employee_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to remove employee image: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get employee's image details.
     */
    public function show(int $employeeId): JsonResponse
    {
        try {
            $employee = Employee::findOrFail($employeeId);

            return response()->json([
                'success' => true,
                'employee' => [
                    'id' => $employee->id,
                    'employee_code' => $employee->employee_code,
                    'name' => $employee->user?->name ?? 'Unknown',
                    'has_employee_image' => $employee->hasEmployeeImage(),
                    'employee_image_url' => $employee->getEmployeeImageUrl(),
                    'employee_image_thumb' => $employee->getEmployeeImageUrl('thumb'),
                    'employee_image_medium' => $employee->getEmployeeImageUrl('medium'),
                    'employee_image_large' => $employee->getEmployeeImageUrl('large'),
                    // Also include user's profile image for comparison
                    'user_profile_image_url' => $employee->user?->profile_image_url,
                ],
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Employee not found',
            ], 404);
        }
    }

    /**
     * Check if the current user can update the given employee's image.
     *
     * Uses HRMAuthorizationService for permission-based access control.
     */
    private function canUpdateEmployeeImage(Employee $employee): bool
    {
        /** @var \Aero\Core\Models\User $currentUser */
        $currentUser = Auth::user();

        if (!$currentUser) {
            return false;
        }

        // Employees can update their own image
        if ($currentUser->id === $employee->user_id) {
            return true;
        }

        // Check if user has employee management permissions
        if ($this->authService->canManageEmployees($currentUser)) {
            return true;
        }

        // Check if current user is the manager of the employee
        if ($employee->manager_id === $currentUser->id) {
            return true;
        }

        return false;
    }
}
