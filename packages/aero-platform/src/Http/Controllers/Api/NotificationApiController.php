<?php

namespace Aero\Platform\Http\Controllers\Api;

use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationApiController extends Controller
{
    /**
     * Get paginated notifications for authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $limit = min((int) $request->get('limit', 15), 50);
        $unreadOnly = $request->boolean('unread_only');

        $query = $user->notifications()
            ->when($unreadOnly, fn ($q) => $q->whereNull('read_at'))
            ->latest();

        $notifications = $query->take($limit)->get()->map(function ($notification) {
            return [
                'id' => $notification->id,
                'type' => class_basename($notification->type),
                'data' => $notification->data,
                'read_at' => $notification->read_at?->toISOString(),
                'created_at' => $notification->created_at->toISOString(),
                'time_ago' => $notification->created_at->diffForHumans(),
            ];
        });

        return response()->json([
            'data' => $notifications,
            'unread_count' => $user->unreadNotifications()->count(),
            'total_count' => $user->notifications()->count(),
        ]);
    }

    /**
     * Mark a single notification as read.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notification = $user->notifications()->find($id);

        if (! $notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
            'notification' => [
                'id' => $notification->id,
                'read_at' => $notification->read_at->toISOString(),
            ],
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $count = $user->unreadNotifications()->count();
        $user->unreadNotifications->markAsRead();

        return response()->json([
            'success' => true,
            'message' => "{$count} notifications marked as read",
            'count' => $count,
        ]);
    }

    /**
     * Delete a specific notification.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notification = $user->notifications()->find($id);

        if (! $notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
        ]);
    }

    /**
     * Clear all read notifications (older than X days).
     */
    public function clearRead(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $daysOld = (int) $request->get('days', 30);

        $count = $user->notifications()
            ->whereNotNull('read_at')
            ->where('read_at', '<', now()->subDays($daysOld))
            ->delete();

        return response()->json([
            'success' => true,
            'message' => "{$count} old notifications cleared",
            'count' => $count,
        ]);
    }

    /**
     * Get notification preferences for user.
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $preferences = $user->notification_preferences ?? $this->defaultPreferences();

        return response()->json([
            'data' => $preferences,
        ]);
    }

    /**
     * Update notification preferences for user.
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $validated = $request->validate([
            'email' => 'sometimes|boolean',
            'sms' => 'sometimes|boolean',
            'push' => 'sometimes|boolean',
            'in_app' => 'sometimes|boolean',
            'digest' => 'sometimes|in:none,daily,weekly',
            'quiet_hours' => 'sometimes|array',
            'quiet_hours.enabled' => 'boolean',
            'quiet_hours.start' => 'date_format:H:i',
            'quiet_hours.end' => 'date_format:H:i',
            'channels' => 'sometimes|array',
            'channels.*' => 'array',
            'channels.*.email' => 'boolean',
            'channels.*.sms' => 'boolean',
            'channels.*.push' => 'boolean',
        ]);

        $currentPrefs = $user->notification_preferences ?? $this->defaultPreferences();
        $newPrefs = array_merge($currentPrefs, $validated);

        $user->update([
            'notification_preferences' => $newPrefs,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Preferences updated',
            'data' => $newPrefs,
        ]);
    }

    /**
     * Get unread notification count (lightweight endpoint).
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $user = Auth::user();

        if (! $user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return response()->json([
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Default notification preferences.
     */
    private function defaultPreferences(): array
    {
        return [
            'email' => true,
            'sms' => false,
            'push' => true,
            'in_app' => true,
            'digest' => 'none',
            'quiet_hours' => [
                'enabled' => false,
                'start' => '22:00',
                'end' => '08:00',
            ],
            'channels' => [
                'system' => ['email' => true, 'sms' => false, 'push' => true],
                'billing' => ['email' => true, 'sms' => true, 'push' => true],
                'security' => ['email' => true, 'sms' => true, 'push' => true],
                'updates' => ['email' => true, 'sms' => false, 'push' => false],
            ],
        ];
    }
}
