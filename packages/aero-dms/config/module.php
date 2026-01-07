<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Document Management System Module
    |--------------------------------------------------------------------------
    |
    | Complete document management system with version control, approval workflows,
    | and secure document sharing.
    |
    */

    'code' => 'dms',
    'scope' => 'tenant',
    'name' => 'Document Management',
    'description' => 'Complete document management system with version control and approval workflows.',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'DocumentIcon',
    'priority' => 20,
    'enabled' => env('DMS_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',
    'dependencies' => ['core'],

    'submodules' => [

        // ==================== 1. DOCUMENT REPOSITORY ====================
        [
            'code' => 'documents',
            'name' => 'Document Repository',
            'description' => 'Central document storage with organization and categorization.',
            'icon' => 'FolderIcon',
            'route' => '/dms/documents',
            'priority' => 1,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'document-list',
                    'name' => 'Document Browser',
                    'description' => 'Browse and search documents.',
                    'route' => '/dms/documents',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Documents', 'is_default' => true],
                        ['code' => 'upload', 'name' => 'Upload Document', 'is_default' => false],
                        ['code' => 'download', 'name' => 'Download Document', 'is_default' => true],
                        ['code' => 'delete', 'name' => 'Delete Document', 'is_default' => false],
                    ],
                ],
                [
                    'code' => 'document-detail',
                    'name' => 'Document Details',
                    'description' => 'View and edit document details.',
                    'route' => '/dms/documents/{id}',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Details', 'is_default' => true],
                        ['code' => 'edit', 'name' => 'Edit Metadata', 'is_default' => false],
                        ['code' => 'share', 'name' => 'Share Document', 'is_default' => false],
                    ],
                ],
            ],
        ],

        // ==================== 2. VERSION CONTROL ====================
        [
            'code' => 'versions',
            'name' => 'Version Control',
            'description' => 'Document versioning and history tracking.',
            'icon' => 'ClockIcon',
            'route' => '/dms/versions',
            'priority' => 2,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'version-history',
                    'name' => 'Version History',
                    'description' => 'View document version history.',
                    'route' => '/dms/documents/{id}/versions',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Versions', 'is_default' => true],
                        ['code' => 'restore', 'name' => 'Restore Version', 'is_default' => false],
                        ['code' => 'compare', 'name' => 'Compare Versions', 'is_default' => false],
                    ],
                ],
            ],
        ],

        // ==================== 3. APPROVAL WORKFLOWS ====================
        [
            'code' => 'approvals',
            'name' => 'Approval Workflows',
            'description' => 'Document approval and review workflows.',
            'icon' => 'CheckCircleIcon',
            'route' => '/dms/approvals',
            'priority' => 3,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'pending-approvals',
                    'name' => 'Pending Approvals',
                    'description' => 'Documents awaiting approval.',
                    'route' => '/dms/approvals/pending',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Pending', 'is_default' => true],
                        ['code' => 'approve', 'name' => 'Approve Document', 'is_default' => false],
                        ['code' => 'reject', 'name' => 'Reject Document', 'is_default' => false],
                    ],
                ],
                [
                    'code' => 'workflow-settings',
                    'name' => 'Workflow Configuration',
                    'description' => 'Configure approval workflows.',
                    'route' => '/dms/approvals/settings',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Workflows', 'is_default' => true],
                        ['code' => 'create', 'name' => 'Create Workflow', 'is_default' => false],
                        ['code' => 'edit', 'name' => 'Edit Workflow', 'is_default' => false],
                    ],
                ],
            ],
        ],

        // ==================== 4. DOCUMENT SHARING ====================
        [
            'code' => 'sharing',
            'name' => 'Document Sharing',
            'description' => 'Share documents internally and externally.',
            'icon' => 'ShareIcon',
            'route' => '/dms/sharing',
            'priority' => 4,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'shared-with-me',
                    'name' => 'Shared With Me',
                    'description' => 'Documents shared with you.',
                    'route' => '/dms/sharing/received',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Shared Documents', 'is_default' => true],
                    ],
                ],
                [
                    'code' => 'my-shares',
                    'name' => 'My Shares',
                    'description' => 'Documents you have shared.',
                    'route' => '/dms/sharing/sent',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View My Shares', 'is_default' => true],
                        ['code' => 'revoke', 'name' => 'Revoke Access', 'is_default' => false],
                    ],
                ],
            ],
        ],

        // ==================== 5. CATEGORIES & TEMPLATES ====================
        [
            'code' => 'settings',
            'name' => 'DMS Settings',
            'description' => 'Document categories, templates, and settings.',
            'icon' => 'CogIcon',
            'route' => '/dms/settings',
            'priority' => 5,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'categories',
                    'name' => 'Document Categories',
                    'description' => 'Manage document categories.',
                    'route' => '/dms/settings/categories',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Categories', 'is_default' => true],
                        ['code' => 'create', 'name' => 'Create Category', 'is_default' => false],
                        ['code' => 'edit', 'name' => 'Edit Category', 'is_default' => false],
                        ['code' => 'delete', 'name' => 'Delete Category', 'is_default' => false],
                    ],
                ],
                [
                    'code' => 'templates',
                    'name' => 'Document Templates',
                    'description' => 'Manage document templates.',
                    'route' => '/dms/settings/templates',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Templates', 'is_default' => true],
                        ['code' => 'create', 'name' => 'Create Template', 'is_default' => false],
                        ['code' => 'edit', 'name' => 'Edit Template', 'is_default' => false],
                        ['code' => 'delete', 'name' => 'Delete Template', 'is_default' => false],
                    ],
                ],
            ],
        ],
    ],
];
