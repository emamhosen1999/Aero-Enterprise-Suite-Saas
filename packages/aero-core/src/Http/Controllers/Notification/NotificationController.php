<?php

namespace Aero\Core\Http\Controllers\Notification;

use Aero\Core\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    /**
     * Display the notifications management page.
     */
    public function index(): Response
    {
        return Inertia::render('Pages/Core/Notifications/Index', [
            'title' => 'Notifications',
        ]);
    }

    /**
     * Get paginated notifications for the current user.
     */
    public function list(Request $request)
    {
        $user = Auth::user();
        $perPage = $request->get('per_page', 15);
        $filter = $request->get('filter', 'all');

        $query = $user->notifications();

        if ($filter === 'unread') {
            $query->whereNull('read_at');
        } elseif ($filter === 'read') {
            $query->whereNotNull('read_at');
        }

        $notifications = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json([
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
            'unread_count' => $user->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(string $id)
    {
        $notification = Auth::user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if ($notification) {
            $notification->markAsRead();
        }

        return response()->json([
            'message' => 'Notification marked as read',
            'unread_count' => Auth::user()->unreadNotifications()->count(),
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        Auth::user()->unreadNotifications->markAsRead();

        return response()->json([
            'message' => 'All notifications marked as read',
            'unread_count' => 0,
        ]);
    }

    /**
     * Delete a notification.
     */
    public function destroy(string $id)
    {
        $notification = Auth::user()
            ->notifications()
            ->where('id', $id)
            ->first();

        if ($notification) {
            $notification->delete();
        }

        return response()->json([
            'message' => 'Notification deleted',
        ]);
    }

    public function sendPushNotification($token, $title, $body): \Illuminate\Http\JsonResponse
    {

        // Obtain an OAuth 2.0 access token
        $accessToken = $this->getAccessToken(); // Implement this method to retrieve the access token

        // Firebase API URL - Replace 'myproject-ID' with your actual project ID
        $firebaseUrl = 'https://fcm.googleapis.com/v1/projects/dbedc-erp/messages:send';

        // Notification payload
        $notificationData = [
            'message' => [
                'token' => $token, // FCM token of the device
                'notification' => [
                    'title' => $title,
                    'body' => $body,
                ],
                'data' => [  // Custom data
                    'click_action' => 'FLUTTER_NOTIFICATION_CLICK',  // Adjust based on your frontend
                    'type' => 'Reminder',
                ],
            ],
        ];

        Log::info($accessToken);

        // Send POST request to Firebase Cloud Messaging
        $response = Http::withHeaders([
            'Authorization' => 'Bearer '.$accessToken,
            'Content-Type' => 'application/json',
        ])->post($firebaseUrl, $notificationData);

        Log::info($response);

        // Handle response
        if ($response->successful()) {
            return response()->json(['success' => true, 'message' => 'Notification sent successfully']);
        } else {
            return response()->json(['success' => false, 'message' => 'Failed to send notification'], 500);
        }
    }

    private function getAccessToken()
    {
        // Load your service account credentials
        $keyFilePath = env('GOOGLE_APPLICATION_CREDENTIALS'); // Path to your service account JSON file
        $credentials = json_decode(file_get_contents($keyFilePath), true);

        // Create JWT client and get the access token
        $client = new \Google_Client;
        $client->setAuthConfig($keyFilePath);
        $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
        $client->setSubject($credentials['client_email']);

        // Get access token
        if ($client->isAccessTokenExpired()) {
            $client->fetchAccessTokenWithAssertion();
        }

        return $client->getAccessToken()['access_token'];
    }
}
