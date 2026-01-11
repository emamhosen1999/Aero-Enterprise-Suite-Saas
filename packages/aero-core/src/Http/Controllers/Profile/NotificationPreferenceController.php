<?php

namespace Aero\Core\Http\Controllers\Profile;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Models\UserNotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationPreferenceController extends Controller
{
    /**
     * Display user notification preferences page.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $user = auth()->user();
        $preferences = UserNotificationPreference::getForUser($user->id);
        $quietHours = UserNotificationPreference::getQuietHoursForUser($user->id);
        $digestFrequency = UserNotificationPreference::getDigestFrequencyForUser($user->id);

        if ($request->wantsJson()) {
            return response()->json([
                'preferences' => $preferences,
                'quiet_hours' => $quietHours,
                'digest_frequency' => $digestFrequency,
            ]);
        }

        return Inertia::render('Profile/NotificationPreferences', [
            'title' => 'Notification Preferences',
            'preferences' => $preferences,
            'quiet_hours' => $quietHours,
            'digest_frequency' => $digestFrequency,
        ]);
    }

    /**
     * Update a single notification preference.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'event_type' => ['required', 'string'],
            'channel' => ['required', 'string', 'in:database,mail,sms,push'],
            'enabled' => ['required', 'boolean'],
        ]);

        $user = auth()->user();

        UserNotificationPreference::setForUser(
            $user->id,
            $request->input('event_type'),
            $request->input('channel'),
            $request->input('enabled')
        );

        return response()->json([
            'success' => true,
            'message' => 'Preference updated successfully',
        ]);
    }

    /**
     * Update global settings (quiet hours, digest frequency).
     */
    public function updateGlobal(Request $request): JsonResponse
    {
        $request->validate([
            'quiet_hours' => ['sometimes', 'array'],
            'quiet_hours.enabled' => ['sometimes', 'boolean'],
            'quiet_hours.start' => ['sometimes', 'string'],
            'quiet_hours.end' => ['sometimes', 'string'],
            'digest_frequency' => ['sometimes', 'string', 'in:instant,hourly,daily,weekly'],
        ]);

        $user = auth()->user();

        // Update or create a preference record with global settings
        // We use a special event_type '_global' to store these
        $quietHours = $request->input('quiet_hours');
        $digestFrequency = $request->input('digest_frequency');

        if ($quietHours) {
            UserNotificationPreference::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'event_type' => '_global',
                    'channel' => 'all',
                ],
                [
                    'enabled' => true,
                    'quiet_hours_start' => $quietHours['enabled'] ? $quietHours['start'] : null,
                    'quiet_hours_end' => $quietHours['enabled'] ? $quietHours['end'] : null,
                    'digest_frequency' => $digestFrequency,
                ]
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Global settings updated successfully',
        ]);
    }

    /**
     * Reset all preferences to defaults.
     */
    public function reset(): JsonResponse
    {
        $user = auth()->user();

        UserNotificationPreference::resetForUser($user->id);

        return response()->json([
            'success' => true,
            'message' => 'Preferences reset to defaults',
        ]);
    }
}
