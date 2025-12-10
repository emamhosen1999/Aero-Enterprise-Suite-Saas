<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Firebase Config
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for Firebase services.
    |
    */

    'project_id' => env('FIREBASE_PROJECT_ID', 'aero-hr'),
    'credentials' => [
        'file' => env('FIREBASE_CREDENTIALS', storage_path('app/firebase-credentials.json')),
        'auto_discovery' => true,
    ],
    'auth' => [
        'tenant_id' => env('FIREBASE_AUTH_TENANT_ID'),
    ],
    'cache_store' => env('FIREBASE_CACHE_STORE', 'file'),
    'http_request_log_channel' => env('FIREBASE_HTTP_REQUEST_LOG_CHANNEL'),
    'http_request_debug_logging' => env('FIREBASE_HTTP_REQUEST_DEBUG_LOGGING', env('APP_DEBUG', false)),
    'messaging' => [
        'default_validate_only' => env('FIREBASE_MESSAGING_DEFAULT_VALIDATE_ONLY', false),
        'default_data' => [
            // Default data to include in all messages
        ],
        'android_config' => [
            'priority' => 'high',
            'ttl' => '86400s', // 24 hours
        ],
        'apns_config' => [
            'headers' => [
                'apns-priority' => '10',
            ],
            'payload' => [
                'aps' => [
                    'content-available' => 1,
                ],
            ],
        ],
    ],
    'database' => [
        'default_url' => env('FIREBASE_DATABASE_URL'),
        'default_authentication' => 'service_account',
    ],
    'storage' => [
        'default_storage_bucket' => env('FIREBASE_STORAGE_BUCKET'),
    ],
];
