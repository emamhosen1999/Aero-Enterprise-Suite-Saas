<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Document Management Module Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration options for the DMS (Document Management
    | System) module including document storage, versioning, and access control.
    |
    */

    'module' => [
        'code' => 'dms',
        'name' => 'Document Management',
        'version' => '1.0.0',
        'description' => 'Complete document management system with version control and approval workflows',
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Storage Settings
    |--------------------------------------------------------------------------
    */
    'storage' => [
        'disk' => env('DMS_STORAGE_DISK', 'local'),
        'path' => env('DMS_STORAGE_PATH', 'documents'),
        'max_file_size' => env('DMS_MAX_FILE_SIZE', 10240), // in KB (default: 10MB)
        'allowed_mime_types' => [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/gif',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Version Control Settings
    |--------------------------------------------------------------------------
    */
    'versioning' => [
        'enabled' => env('DMS_VERSIONING_ENABLED', true),
        'max_versions' => env('DMS_MAX_VERSIONS', 10), // 0 for unlimited
        'auto_version' => env('DMS_AUTO_VERSION', true), // Auto-create version on update
        'version_naming' => env('DMS_VERSION_NAMING', 'numeric'), // numeric, semantic, timestamp
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Access & Security
    |--------------------------------------------------------------------------
    */
    'security' => [
        'enable_encryption' => env('DMS_ENABLE_ENCRYPTION', false),
        'enable_watermark' => env('DMS_ENABLE_WATERMARK', false),
        'enable_access_logs' => env('DMS_ENABLE_ACCESS_LOGS', true),
        'log_retention_days' => env('DMS_LOG_RETENTION_DAYS', 365),
        'enable_digital_signature' => env('DMS_ENABLE_DIGITAL_SIGNATURE', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Approval Workflow Settings
    |--------------------------------------------------------------------------
    */
    'approval' => [
        'enabled' => env('DMS_APPROVAL_ENABLED', true),
        'require_approval' => env('DMS_REQUIRE_APPROVAL', false), // Require approval for all documents
        'approval_levels' => env('DMS_APPROVAL_LEVELS', 1), // Number of approval levels
        'auto_approve_owner' => env('DMS_AUTO_APPROVE_OWNER', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Categories
    |--------------------------------------------------------------------------
    */
    'categories' => [
        'enabled' => env('DMS_CATEGORIES_ENABLED', true),
        'required' => env('DMS_CATEGORY_REQUIRED', true),
        'allow_multiple' => env('DMS_ALLOW_MULTIPLE_CATEGORIES', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Templates
    |--------------------------------------------------------------------------
    */
    'templates' => [
        'enabled' => env('DMS_TEMPLATES_ENABLED', true),
        'template_path' => env('DMS_TEMPLATE_PATH', 'templates'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Document Sharing
    |--------------------------------------------------------------------------
    */
    'sharing' => [
        'enabled' => env('DMS_SHARING_ENABLED', true),
        'allow_public_links' => env('DMS_ALLOW_PUBLIC_LINKS', true),
        'link_expiration' => env('DMS_LINK_EXPIRATION', 7), // days
    ],

    /*
    |--------------------------------------------------------------------------
    | Search & Indexing
    |--------------------------------------------------------------------------
    */
    'search' => [
        'enabled' => env('DMS_SEARCH_ENABLED', true),
        'full_text_search' => env('DMS_FULL_TEXT_SEARCH', false),
        'search_file_content' => env('DMS_SEARCH_FILE_CONTENT', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */
    'notifications' => [
        'document_shared' => env('DMS_NOTIFY_DOCUMENT_SHARED', true),
        'approval_requested' => env('DMS_NOTIFY_APPROVAL_REQUESTED', true),
        'document_approved' => env('DMS_NOTIFY_DOCUMENT_APPROVED', true),
        'document_rejected' => env('DMS_NOTIFY_DOCUMENT_REJECTED', true),
        'new_version' => env('DMS_NOTIFY_NEW_VERSION', true),
        'document_expiring' => env('DMS_NOTIFY_DOCUMENT_EXPIRING', true),
    ],
];
