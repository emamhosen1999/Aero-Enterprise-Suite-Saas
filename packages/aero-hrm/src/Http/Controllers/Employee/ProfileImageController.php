<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\Core\Models\User;
use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\Employee;
use Aero\HRM\Services\HRMAuthorizationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileDoesNotExist;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileIsTooBig;

/**
 * User Profile Image Controller (HRM Package Wrapper)
 *
 * DEPRECATED: This controller is maintained for backward compatibility.
 * New implementations should use:
 * - \Aero\Core\Http\Controllers\Profile\UserProfileImageController for User profile images
 * - \Aero\HRM\Http\Controllers\Employee\EmployeeImageController for Employee HR images
 *
 * This controller manages User's profile image for identity/authentication purposes.
 * This is SEPARATE from Employee images which are managed by EmployeeImageController.
 *
 * Architecture:
 * - User Profile Image (this controller → delegates to Core): For authentication/identity purposes
 *   - Used in: login screens, account settings, general system UI
 *   - Stored on: User model (Core package)
 *
 * - Employee Image (EmployeeImageController): For HR/work purposes
 *   - Used in: badges, org charts, ID cards, HR directory
 *   - Stored on: Employee model (HRM package)
 *
 * @deprecated Use \Aero\Core\Http\Controllers\Profile\UserProfileImageController instead
 * @see \Aero\HRM\Http\Controllers\Employee\EmployeeImageController For employee HR images
 * @see \Aero\Core\Models\User For profile image storage
 */
class ProfileImageController extends Controller
{
    /**
     * Upload or update user's profile image
     *
     * This manages the User's identity/authentication profile image,
     * which is stored on the User model in the Core package.
     */
    public function upload(Request $request): JsonResponse
    {
        // Debug logging at start
        Log::info('[ProfileImageUpload] Request received', [
            'user_id' => $request->user_id ?? 'not provided',
            'has_file' => $request->hasFile('profile_image'),
            'file_valid' => $request->hasFile('profile_image') ? $request->file('profile_image')->isValid() : false,
            'file_size' => $request->hasFile('profile_image') ? $request->file('profile_image')->getSize() : null,
            'file_mime' => $request->hasFile('profile_image') ? $request->file('profile_image')->getMimeType() : null,
            'auth_user_id' => Auth::id(),
        ]);

        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer|exists:users,id',
                'profile_image' => [
                    'required',
                    'image',
                    'mimes:jpeg,png,jpg,webp',
                    'max:2048', // 2MB max
                    'dimensions:min_width=100,min_height=100,max_width=2000,max_height=2000',
                ],
            ]);

            if ($validator->fails()) {
                Log::warning('[ProfileImageUpload] Validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => $request->user_id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed: '.implode(', ', $validator->errors()->all()),
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Get the user
            $user = User::findOrFail($request->user_id);
            Log::info('[ProfileImageUpload] User found', ['target_user_id' => $user->id, 'target_user_name' => $user->name]);

            // Check if current user can update this user's profile
            if (! $this->canUpdateUserProfile($user)) {
                Log::warning('[ProfileImageUpload] Authorization failed', [
                    'auth_user_id' => Auth::id(),
                    'target_user_id' => $user->id,
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this user\'s profile image',
                ], 403);
            }

            Log::info('[ProfileImageUpload] Authorization passed, proceeding with upload');

            // Clear any existing profile images (ensure only one image per user)
            if ($user->hasMedia('profile_images')) {
                Log::info('[ProfileImageUpload] Clearing existing media');
                $user->clearMediaCollection('profile_images');
            }

            // Upload new profile image
            Log::info('[ProfileImageUpload] Adding media from request');
            $media = $user->addMediaFromRequest('profile_image')
                ->usingName($user->name.' Profile Image')
                ->usingFileName(time().'_profile.'.$request->file('profile_image')->getClientOriginalExtension())
                ->toMediaCollection('profile_images');

            Log::info('[ProfileImageUpload] Media added successfully', [
                'media_id' => $media->id,
                'media_url' => $media->getUrl(),
            ]);

            // Save user to refresh model state
            $user->save();

            // Get fresh user data
            $user->refresh();

            $responseData = [
                'success' => true,
                'message' => 'Profile image uploaded successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'profile_image_url' => $user->profile_image_url,
                ],
                'profile_image_url' => $user->profile_image_url,
                'media_id' => $media->id,
            ];

            Log::info('[ProfileImageUpload] Success', $responseData);

            return response()->json($responseData);

        } catch (FileDoesNotExist $e) {
            Log::error('[ProfileImageUpload] FileDoesNotExist exception', [
                'message' => $e->getMessage(),
                'user_id' => $request->user_id ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'File does not exist or is not accessible',
                'exception' => $e->getMessage(),
            ], 400);
        } catch (FileIsTooBig $e) {
            Log::error('[ProfileImageUpload] FileIsTooBig exception', [
                'message' => $e->getMessage(),
                'user_id' => $request->user_id ?? null,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'File is too large. Maximum size is 2MB.',
                'exception' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('[ProfileImageUpload] Unexpected exception', [
                'message' => $e->getMessage(),
                'exception_class' => get_class($e),
                'user_id' => $request->user_id ?? null,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload profile image: '.$e->getMessage(),
                'exception' => get_class($e).': '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove user's profile image
     */
    public function remove(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|integer|exists:users,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Get the user
            $user = User::findOrFail($request->user_id);

            // Check if current user can update this user's profile
            if (! $this->canUpdateUserProfile($user)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to update this user\'s profile image',
                ], 403);
            }

            // Remove profile images
            if ($user->hasMedia('profile_images')) {
                $user->clearMediaCollection('profile_images');
                $message = 'Profile image removed successfully';
            } else {
                $message = 'No profile image to remove';
            }

            // Save user to refresh model state
            $user->save();

            // Get fresh user data
            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => $message,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'profile_image_url' => null,
                ],
                'profile_image_url' => null,
            ]);

        } catch (\Exception $e) {
            Log::error('Profile image removal error: '.$e->getMessage(), [
                'user_id' => $request->user_id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to remove profile image: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check if current user can update the given user's profile
     *
     * Uses HRMAuthorizationService for permission-based access control
     * instead of hardcoded role checks.
     */
    private function canUpdateUserProfile(User $user): bool
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();

        // User can update their own profile
        if ($currentUser->id === $user->id) {
            return true;
        }

        // Use HRMAuthorizationService for permission-based checks
        $authService = app(HRMAuthorizationService::class);

        // Check if user has employee management permissions
        if ($authService->canManageEmployees($currentUser)) {
            return true;
        }

        // Check if current user is the manager of the target user's employee record
        $targetEmployee = Employee::where('user_id', $user->id)->first();
        if ($targetEmployee && $targetEmployee->manager_id === $currentUser->id) {
            return true;
        }

        return false;
    }
}
