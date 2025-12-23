<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Module Metadata
    |--------------------------------------------------------------------------
    */

    'code' => 'assistant',
    'name' => 'AI Assistant',
    'description' => 'Intelligent AI assistant with RAG capabilities for user guidance and task automation',
    'version' => '1.0.0',
    'icon' => 'SparklesIcon',
    'category' => 'productivity',
    'priority' => 100,
    'is_active' => true,
    'route_prefix' => 'assistant',
    'min_plan' => null, // Available to all plans (features vary by tier)

    /*
    |--------------------------------------------------------------------------
    | Module Dependencies
    |--------------------------------------------------------------------------
    */

    'dependencies' => [
        'core',
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Hierarchy
    |--------------------------------------------------------------------------
    | Defines sub-modules, components, and actions for RBAC.
    */

    'submodules' => [
        [
            'code' => 'chat',
            'name' => 'Chat Interface',
            'description' => 'Interactive chat with AI assistant',
            'icon' => 'ChatBubbleLeftRightIcon',
            'route' => 'assistant.index',
            'priority' => 1,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'chat_interface',
                    'name' => 'Chat Interface',
                    'description' => 'Send messages to AI assistant',
                    'route_name' => 'assistant.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'send', 'name' => 'Send Messages', 'is_active' => true],
                        ['code' => 'view_history', 'name' => 'View History', 'is_active' => true],
                    ],
                ],
            ],
        ],
        [
            'code' => 'conversations',
            'name' => 'Conversations',
            'description' => 'Manage conversation history',
            'icon' => 'FolderIcon',
            'route' => null,
            'priority' => 2,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'conversation_management',
                    'name' => 'Conversation Management',
                    'description' => 'View and manage conversations',
                    'route_name' => null,
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Conversations', 'is_active' => true],
                        ['code' => 'archive', 'name' => 'Archive Conversations', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete Conversations', 'is_active' => true],
                    ],
                ],
            ],
        ],
        [
            'code' => 'actions',
            'name' => 'Automated Actions',
            'description' => 'Perform actions through AI assistant',
            'icon' => 'BoltIcon',
            'route' => null,
            'priority' => 3,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'action_execution',
                    'name' => 'Action Execution',
                    'description' => 'Execute automated tasks',
                    'route_name' => null,
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'read', 'name' => 'Read Data', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create Records', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update Records', 'is_active' => true],
                    ],
                ],
            ],
        ],
        [
            'code' => 'admin',
            'name' => 'Administration',
            'description' => 'Manage knowledge base and settings',
            'icon' => 'Cog6ToothIcon',
            'route' => null,
            'priority' => 4,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'knowledge_base',
                    'name' => 'Knowledge Base Management',
                    'description' => 'Manage knowledge base indexing',
                    'route_name' => null,
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view_stats', 'name' => 'View Statistics', 'is_active' => true],
                        ['code' => 'reindex', 'name' => 'Re-index Content', 'is_active' => true],
                        ['code' => 'manage', 'name' => 'Manage Settings', 'is_active' => true],
                    ],
                ],
            ],
        ],
    ],
];
