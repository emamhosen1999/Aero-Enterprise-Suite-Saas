<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileDoesNotExist;
use Spatie\MediaLibrary\MediaCollections\Exceptions\FileIsTooBig;

class ProfileImageController extends Controller
{
    /**
     * Upload or update user's profile image
     */
    public function upload(Request $request): JsonResponse
    {
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

            // Clear any existing profile images (ensure only one image per user)
            if ($user->hasMedia('profile_images')) {
                $user->clearMediaCollection('profile_images');
            }

            // Upload new profile image
            $media = $user->addMediaFromRequest('profile_image')
                ->usingName($user->name.' Profile Image')
                ->usingFileName(time().'_profile.'.$request->file('profile_image')->getClientOriginalExtension())
                ->toMediaCollection('profile_images');

            // Save user to refresh model state
            $user->save();

            // Get fresh user data
            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Profile image uploaded successfully',
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'profile_image_url' => $user->profile_image_url,
                ],
                'profile_image_url' => $user->profile_image_url,
                'media_id' => $media->id,
            ]);

        } catch (FileDoesNotExist $e) {
            return response()->json([
                'success' => false,
                'message' => 'File does not exist or is not accessible',
            ], 400);
        } catch (FileIsTooBig $e) {
            return response()->json([
                'success' => false,
                'message' => 'File is too large. Maximum size is 2MB.',
            ], 400);
        } catch (\Exception $e) {
            Log::error('Profile image upload error: '.$e->getMessage(), [
                'user_id' => $request->user_id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload profile image: '.$e->getMessage(),
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
     */
    private function canUpdateUserProfile(User $user): bool
    {
        /** @var User $currentUser */
        $currentUser = Auth::user();

        // User can update their own profile
        if ($currentUser->id === $user->id) {
            return true;
        }

        // Admin users can update any profile
        if ($currentUser->hasRole('Super Administrator') || $currentUser->hasRole('Administrator')) {
            return true;
        }

        // HR users can update employee profiles
        if ($currentUser->hasRole('HR Manager') && $user->hasRole('Employee')) {
            return true;
        }

        return false;
    }
}
