<?php

namespace Aero\Core\Services\Profile;

use Aero\Core\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProfileMediaService
{
    /**
     * Handle profile image upload and update
     */
    public function handleProfileImageUpload(User $user, Request $request): array
    {
        $messages = [];

        if (! $request->hasFile('profile_image')) {
            return $messages;
        }

        $newProfileImage = $request->file('profile_image');

        // Enhanced security validation
        try {
            $this->validateImageSecurity($newProfileImage);
        } catch (\Exception $e) {
            throw new \Illuminate\Validation\ValidationException(
                \Illuminate\Support\Facades\Validator::make([], []),
                ['profile_image' => [$e->getMessage()]]
            );
        }

        // Check if the profile image is the same as the existing one
        $existingMedia = $user->getFirstMedia('profile_images');

        if ($existingMedia && $existingMedia->getPath() === $newProfileImage->getPath()) {
            $messages[] = 'Profile image is already up-to-date.';

            return $messages;
        }

        // Remove old profile image if exists
        if ($user->hasMedia('profile_images')) {
            $user->clearMediaCollection('profile_images');
        }

        // Clear the old profile_image field to force use of MediaLibrary
        $user->profile_image = null;
        $user->save();

        // Add new profile image using MediaLibrary standard method
        try {
            $media = $user->addMediaFromRequest('profile_image')
                ->toMediaCollection('profile_images');

            $messages[] = 'Profile image uploaded successfully';
        } catch (\Exception $e) {
            throw new \Illuminate\Validation\ValidationException(
                \Illuminate\Support\Facades\Validator::make([], []),
                ['profile_image' => ['Failed to upload profile image: '.$e->getMessage()]]
            );
        }

        return $messages;
    }

    /**
     * Handle profile image removal
     */
    public function handleProfileImageRemoval(User $user): array
    {
        $messages = [];

        try {
            // Check if user has profile images
            if ($user->hasMedia('profile_images')) {
                $user->clearMediaCollection('profile_images');
                $messages[] = 'Profile image removed successfully';
            } else {
                $messages[] = 'No profile image to remove';
            }

            // Clear the old profile_image field to ensure removal
            $user->profile_image = null;
            $user->save();

        } catch (\Exception $e) {
            throw new \Illuminate\Validation\ValidationException(
                \Illuminate\Support\Facades\Validator::make([], []),
                ['profile_image' => ['Failed to remove profile image: '.$e->getMessage()]]
            );
        }

        return $messages;
    }

    /**
     * Get profile image URL for a user
     */
    public function getProfileImageUrl(User $user): ?string
    {
        try {
            // Use MediaLibrary standard method to get the first media URL
            $url = $user->getFirstMediaUrl('profile_images');

            // Return null if no media found (empty string from getFirstMediaUrl means no media)
            return empty($url) ? null : $url;
        } catch (\Exception $e) {
            // Log error and return null if there's an exception
            Log::warning('Failed to get profile image URL for user '.$user->id.': '.$e->getMessage());

            return null;
        }
    }

    /**
     * Check if user has profile image
     */
    public function hasProfileImage(User $user): bool
    {
        try {
            return $user->hasMedia('profile_images');
        } catch (\Exception $e) {
            Log::warning('Failed to check profile image for user '.$user->id.': '.$e->getMessage());

            return false;
        }
    }

    /**
     * Validate image security
     */
    private function validateImageSecurity($file): void
    {
        // Check file size (max 2MB)
        if ($file->getSize() > 2048 * 1024) {
            throw new \Exception('Image file too large. Maximum size is 2MB.');
        }

        // Check image dimensions and type
        $imageInfo = getimagesize($file->getPathname());
        if ($imageInfo === false) {
            throw new \Exception('Invalid image file.');
        }

        // Check dimensions
        [$width, $height] = $imageInfo;
        if ($width < 100 || $height < 100) {
            throw new \Exception('Image dimensions too small. Minimum size is 100x100 pixels.');
        }

        if ($width > 2000 || $height > 2000) {
            throw new \Exception('Image dimensions too large. Maximum size is 2000x2000 pixels.');
        }

        // Validate MIME type matches extension
        $allowedMimes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (! in_array($file->getMimeType(), $allowedMimes)) {
            throw new \Exception('Invalid image type. Only JPEG, PNG, JPG, and WebP are allowed.');
        }

        // Additional security: Check for executable code in file
        $fileContent = file_get_contents($file->getPathname());
        $suspiciousPatterns = [
            '<?php',
            '<script',
            'javascript:',
            'vbscript:',
            'onload=',
            'onerror=',
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (stripos($fileContent, $pattern) !== false) {
                throw new \Exception('Security violation: Suspicious content detected in image file.');
            }
        }
    }
}
