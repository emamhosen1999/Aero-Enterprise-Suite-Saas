<?php

namespace Aero\Platform\Http\Controllers\Notification;

use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NotificationController extends Controller
{
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
