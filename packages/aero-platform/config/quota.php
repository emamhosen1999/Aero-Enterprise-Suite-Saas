<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Quota Enforcement Configuration
    |--------------------------------------------------------------------------
    |
    | Configure default quota enforcement behavior, warning thresholds,
    | grace periods, and notification settings.
    |
    */

    'enforcement' => [
        // Default warning threshold percentages
        'warning_threshold' => env('QUOTA_WARNING_THRESHOLD', 80),
        'critical_threshold' => env('QUOTA_CRITICAL_THRESHOLD', 90),
        'block_threshold' => env('QUOTA_BLOCK_THRESHOLD', 100),
        
        // Grace period in days before blocking after reaching limit
        'grace_period_days' => env('QUOTA_GRACE_PERIOD_DAYS', 10),
        
        // Enable/disable enforcement globally
        'enabled' => env('QUOTA_ENFORCEMENT_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Warning Escalation Schedule
    |--------------------------------------------------------------------------
    |
    | Define when and how quota warnings are escalated based on usage percentage.
    | Frequencies: 'once', 'daily', 'hourly', 'real-time'
    |
    */

    'escalation' => [
        80 => 'daily',      // 80-89%: Daily email
        90 => 'daily',      // 90-94%: Daily email + SMS
        95 => 'hourly',     // 95-98%: Hourly email + SMS
        99 => 'real-time',  // 99%+: Real-time critical alerts
    ],

    /*
    |--------------------------------------------------------------------------
    | Notification Channels
    |--------------------------------------------------------------------------
    |
    | Configure which notification channels to use for quota warnings.
    |
    */

    'notifications' => [
        'email' => [
            'enabled' => env('QUOTA_EMAIL_NOTIFICATIONS', true),
            'super_admin_email' => env('SUPER_ADMIN_EMAIL', 'admin@example.com'),
        ],
        
        'sms' => [
            'enabled' => env('QUOTA_SMS_NOTIFICATIONS', true),
            'super_admin_phone' => env('SUPER_ADMIN_PHONE', null),
        ],
        
        'slack' => [
            'enabled' => env('QUOTA_SLACK_NOTIFICATIONS', false),
            'webhook_url' => env('QUOTA_SLACK_WEBHOOK_URL', null),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Quota Types Configuration
    |--------------------------------------------------------------------------
    |
    | Define available quota types and their default settings.
    |
    */

    'types' => [
        'users' => [
            'name' => 'Users',
            'description' => 'Maximum number of active users',
            'unit' => 'users',
        ],
        'storage' => [
            'name' => 'Storage',
            'description' => 'Maximum storage space',
            'unit' => 'GB',
        ],
        'api_calls' => [
            'name' => 'API Calls',
            'description' => 'Maximum API requests per month',
            'unit' => 'requests',
        ],
        'employees' => [
            'name' => 'Employees',
            'description' => 'Maximum number of employees',
            'unit' => 'employees',
        ],
        'projects' => [
            'name' => 'Projects',
            'description' => 'Maximum number of active projects',
            'unit' => 'projects',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | API Throttling Configuration
    |--------------------------------------------------------------------------
    |
    | Progressive API throttling based on quota usage percentage.
    |
    */

    'api_throttling' => [
        'enabled' => env('API_QUOTA_THROTTLING_ENABLED', true),
        
        // Delay in seconds based on usage percentage
        'delays' => [
            95 => 1,  // 95-98%: 1 second delay (75% speed)
            99 => 2,  // 99%: 2 second delay (50% speed)
        ],
        
        // Hard block at 100%
        'block_at_limit' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage Monitoring
    |--------------------------------------------------------------------------
    |
    | Configure storage monitoring and calculation settings.
    |
    */

    'storage' => [
        // Base storage path within tenant directory
        'paths' => [
            'uploads',
            'documents',
            'media',
            'attachments',
            'exports',
            'backups',
        ],
        
        // Scan frequency (daily via MonitorStorageUsageJob)
        'scan_frequency' => 'daily',
        
        // Storage calculation method
        'calculation' => [
            'include_database' => env('QUOTA_STORAGE_INCLUDE_DB', false),
            'round_to_decimal_places' => 2,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Warning History
    |--------------------------------------------------------------------------
    |
    | Configure how long to keep warning history records.
    |
    */

    'history' => [
        'retention_days' => env('QUOTA_WARNING_RETENTION_DAYS', 90),
        'cleanup_frequency' => 'weekly',
    ],
];
