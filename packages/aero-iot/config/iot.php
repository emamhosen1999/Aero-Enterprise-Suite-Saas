<?php

return [
    /*
    |--------------------------------------------------------------------------
    | IoT Platform Settings
    |--------------------------------------------------------------------------
    |
    | Configuration for the IoT device management platform
    |
    */

    'enabled' => env('IOT_ENABLED', true),

    /*
    |--------------------------------------------------------------------------
    | MQTT Configuration
    |--------------------------------------------------------------------------
    |
    | MQTT broker settings for device communication
    |
    */
    'mqtt' => [
        'host' => env('MQTT_HOST', 'localhost'),
        'port' => env('MQTT_PORT', 1883),
        'username' => env('MQTT_USERNAME'),
        'password' => env('MQTT_PASSWORD'),
        'client_id' => env('MQTT_CLIENT_ID', 'aero-iot'),
        'keep_alive' => env('MQTT_KEEP_ALIVE', 60),
        'clean_session' => env('MQTT_CLEAN_SESSION', true),
        'ssl' => env('MQTT_SSL', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Device Configuration
    |--------------------------------------------------------------------------
    |
    | Default device settings and limits
    |
    */
    'devices' => [
        'max_per_tenant' => env('IOT_MAX_DEVICES_PER_TENANT', 1000),
        'heartbeat_interval' => env('IOT_HEARTBEAT_INTERVAL', 300), // seconds
        'offline_threshold' => env('IOT_OFFLINE_THRESHOLD', 900), // seconds
        'default_timeout' => env('IOT_COMMAND_TIMEOUT', 60), // seconds
        'max_retries' => env('IOT_MAX_COMMAND_RETRIES', 3),
    ],

    /*
    |--------------------------------------------------------------------------
    | Telemetry Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for telemetry data collection and processing
    |
    */
    'telemetry' => [
        'enabled' => env('IOT_TELEMETRY_ENABLED', true),
        'batch_size' => env('IOT_TELEMETRY_BATCH_SIZE', 100),
        'retention_days' => env('IOT_TELEMETRY_RETENTION_DAYS', 90),
        'compression' => env('IOT_TELEMETRY_COMPRESSION', false),
        'real_time_processing' => env('IOT_REAL_TIME_PROCESSING', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Alert Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for IoT alerts and notifications
    |
    */
    'alerts' => [
        'enabled' => env('IOT_ALERTS_ENABLED', true),
        'auto_resolve' => env('IOT_AUTO_RESOLVE_ALERTS', true),
        'auto_resolve_duration' => env('IOT_AUTO_RESOLVE_DURATION', 60), // minutes
        'escalation_enabled' => env('IOT_ALERT_ESCALATION', true),
        'escalation_interval' => env('IOT_ESCALATION_INTERVAL', 30), // minutes
        'notification_channels' => [
            'email' => env('IOT_EMAIL_NOTIFICATIONS', true),
            'sms' => env('IOT_SMS_NOTIFICATIONS', false),
            'slack' => env('IOT_SLACK_NOTIFICATIONS', false),
            'webhook' => env('IOT_WEBHOOK_NOTIFICATIONS', false),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Security Configuration
    |--------------------------------------------------------------------------
    |
    | IoT security and authentication settings
    |
    */
    'security' => [
        'device_authentication' => env('IOT_DEVICE_AUTH', 'certificate'),
        'encryption_enabled' => env('IOT_ENCRYPTION_ENABLED', true),
        'certificate_validation' => env('IOT_CERT_VALIDATION', true),
        'api_rate_limiting' => env('IOT_API_RATE_LIMIT', true),
        'max_requests_per_minute' => env('IOT_MAX_REQUESTS_PER_MINUTE', 100),
    ],

    /*
    |--------------------------------------------------------------------------
    | Edge Computing Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for edge computing and local processing
    |
    */
    'edge' => [
        'enabled' => env('IOT_EDGE_ENABLED', false),
        'local_processing' => env('IOT_LOCAL_PROCESSING', false),
        'sync_interval' => env('IOT_EDGE_SYNC_INTERVAL', 3600), // seconds
        'offline_capability' => env('IOT_OFFLINE_CAPABILITY', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Analytics Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for IoT data analytics and machine learning
    |
    */
    'analytics' => [
        'enabled' => env('IOT_ANALYTICS_ENABLED', true),
        'anomaly_detection' => env('IOT_ANOMALY_DETECTION', true),
        'predictive_maintenance' => env('IOT_PREDICTIVE_MAINTENANCE', false),
        'data_aggregation' => env('IOT_DATA_AGGREGATION', true),
        'real_time_analytics' => env('IOT_REAL_TIME_ANALYTICS', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Storage Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for IoT data storage and archiving
    |
    */
    'storage' => [
        'driver' => env('IOT_STORAGE_DRIVER', 'database'),
        'time_series_db' => env('IOT_TIMESERIES_DB', false),
        'compression' => env('IOT_STORAGE_COMPRESSION', true),
        'archiving' => [
            'enabled' => env('IOT_ARCHIVING_ENABLED', true),
            'archive_after_days' => env('IOT_ARCHIVE_AFTER_DAYS', 30),
            'delete_after_days' => env('IOT_DELETE_AFTER_DAYS', 365),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Integration Configuration
    |--------------------------------------------------------------------------
    |
    | Settings for third-party integrations
    |
    */
    'integrations' => [
        'aws_iot' => [
            'enabled' => env('AWS_IOT_ENABLED', false),
            'endpoint' => env('AWS_IOT_ENDPOINT'),
            'thing_type' => env('AWS_IOT_THING_TYPE'),
        ],
        'azure_iot' => [
            'enabled' => env('AZURE_IOT_ENABLED', false),
            'connection_string' => env('AZURE_IOT_CONNECTION_STRING'),
        ],
        'google_iot' => [
            'enabled' => env('GOOGLE_IOT_ENABLED', false),
            'project_id' => env('GOOGLE_IOT_PROJECT_ID'),
            'registry_id' => env('GOOGLE_IOT_REGISTRY_ID'),
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Configuration
    |--------------------------------------------------------------------------
    |
    | Performance and optimization settings
    |
    */
    'performance' => [
        'caching' => [
            'enabled' => env('IOT_CACHING_ENABLED', true),
            'ttl' => env('IOT_CACHE_TTL', 300), // seconds
            'driver' => env('IOT_CACHE_DRIVER', 'redis'),
        ],
        'queuing' => [
            'enabled' => env('IOT_QUEUING_ENABLED', true),
            'queue' => env('IOT_QUEUE_NAME', 'iot'),
            'connection' => env('IOT_QUEUE_CONNECTION', 'redis'),
        ],
    ],
];
