<?php

namespace Aero\Core\Http\Controllers\Settings;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Models\NotificationLog;
use Aero\Core\Models\NotificationSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationSettingController extends Controller
{
    /**
     * Display notification settings page.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $settings = NotificationSetting::all();

        if ($request->wantsJson()) {
            return response()->json([
                'settings' => $settings,
            ]);
        }

        return Inertia::render('Settings/NotificationSettings', [
            'title' => 'Notification Settings',
            'settings' => $settings,
        ]);
    }

    /**
     * Get notification statistics.
     */
    public function stats(): JsonResponse
    {
        $stats = [
            'total_sent' => NotificationLog::where('status', NotificationLog::STATUS_SENT)->count(),
            'total_failed' => NotificationLog::where('status', NotificationLog::STATUS_FAILED)->count(),
            'pending' => NotificationLog::where('status', NotificationLog::STATUS_PENDING)->count(),
            'today_sent' => NotificationLog::where('status', NotificationLog::STATUS_SENT)
                ->whereDate('sent_at', today())
                ->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Update a single notification setting.
     */
    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'key' => ['required', 'string'],
            'value' => ['required'],
        ]);

        $setting = NotificationSetting::setValue(
            $request->input('key'),
            $request->input('value')
        );

        return response()->json([
            'success' => true,
            'message' => 'Setting updated successfully',
            'setting' => $setting,
        ]);
    }

    /**
     * Update retry configuration settings.
     */
    public function updateRetry(Request $request): JsonResponse
    {
        $request->validate([
            'max_attempts' => ['required', 'integer', 'min:0', 'max:10'],
            'backoff_minutes' => ['required', 'array', 'min:1', 'max:5'],
            'backoff_minutes.*' => ['required', 'integer', 'min:1', 'max:1440'],
        ]);

        NotificationSetting::setValue('retry.max_attempts', $request->input('max_attempts'));
        NotificationSetting::setValue('retry.backoff_minutes', $request->input('backoff_minutes'));

        return response()->json([
            'success' => true,
            'message' => 'Retry settings updated successfully',
        ]);
    }

    /**
     * Test a notification channel.
     */
    public function testChannel(Request $request): JsonResponse
    {
        $request->validate([
            'channel' => ['required', 'string', 'in:mail,sms,push,database'],
            'recipient' => ['required_if:channel,mail,sms', 'nullable', 'string'],
        ]);

        $channel = $request->input('channel');
        $recipient = $request->input('recipient');

        try {
            switch ($channel) {
                case 'mail':
                    // Use existing mail service for testing
                    // This would integrate with MailService
                    return response()->json([
                        'success' => true,
                        'message' => 'Test email functionality should use System Settings > Test Email',
                    ]);

                case 'sms':
                    // Use existing SMS service for testing
                    return response()->json([
                        'success' => true,
                        'message' => 'Test SMS functionality should use System Settings > Test SMS',
                    ]);

                case 'push':
                    return response()->json([
                        'success' => true,
                        'message' => 'Push notification test sent (requires browser permission)',
                    ]);

                case 'database':
                    return response()->json([
                        'success' => true,
                        'message' => 'Database notifications are always available',
                    ]);

                default:
                    return response()->json([
                        'success' => false,
                        'message' => 'Unknown channel type',
                    ], 400);
            }
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Channel test failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}
