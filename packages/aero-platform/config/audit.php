<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Audit Log Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for audit logging channel.
    | This is used to track plan mutations and other security-relevant events.
    |
    */

    'audit' => [
        'driver' => 'daily',
        'path' => storage_path('logs/audit.log'),
        'level' => env('AUDIT_LOG_LEVEL', 'info'),
        'days' => 90, // Keep audit logs for 90 days
        'permission' => 0644,
        'locking' => false,
    ],
];
