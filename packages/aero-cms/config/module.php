<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | CMS Module Configuration (HRMAC Integration)
    |--------------------------------------------------------------------------
    |
    | This file defines the CMS module structure for HRMAC.
    | The CMS module provides page building capabilities for platform admins.
    |
    | Hierarchy: Module → SubModule → Component → Action
    |
    | Scope: 'platform' - Platform admin module (landlord scope)
    |
    */

    'code' => 'cms',
    'scope' => 'platform',
    'name' => 'Content Management',
    'description' => 'Visual page builder with HeroUI blocks for public pages',
    'icon' => 'DocumentTextIcon',
    'route_prefix' => '/admin/cms',
    'category' => 'platform',
    'priority' => 50,
    'is_core' => false,
    'is_active' => true,
    'version' => '1.0.0',
    'min_plan' => null,
    'license_type' => 'platform',
    'dependencies' => ['platform'],
    'release_date' => '2026-01-16',
    'enabled' => true,

    'features' => [
        'page_builder' => true,
        'block_library' => true,
        'media_library' => true,
        'page_templates' => true,
        'seo_settings' => true,
        'page_versioning' => true,
    ],

    'submodules' => [
        /*
        |--------------------------------------------------------------------------
        | 1. Pages Management
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'pages',
            'name' => 'Pages',
            'description' => 'Create and manage CMS pages',
            'icon' => 'DocumentDuplicateIcon',
            'route' => '/admin/cms/pages',
            'priority' => 1,

            'components' => [
                [
                    'code' => 'page_list',
                    'name' => 'All Pages',
                    'route' => '/admin/cms/pages',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Pages'],
                        ['code' => 'create', 'name' => 'Create Page'],
                        ['code' => 'edit', 'name' => 'Edit Page'],
                        ['code' => 'delete', 'name' => 'Delete Page'],
                        ['code' => 'publish', 'name' => 'Publish Page'],
                    ],
                ],
                [
                    'code' => 'page_editor',
                    'name' => 'Page Editor',
                    'route' => '/admin/cms/pages/:id/edit',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Editor'],
                        ['code' => 'edit_blocks', 'name' => 'Edit Blocks'],
                        ['code' => 'reorder_blocks', 'name' => 'Reorder Blocks'],
                        ['code' => 'edit_settings', 'name' => 'Edit Page Settings'],
                        ['code' => 'preview', 'name' => 'Preview Page'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 2. Block Library
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'blocks',
            'name' => 'Blocks',
            'description' => 'Manage block library and templates',
            'icon' => 'CubeIcon',
            'route' => '/admin/cms/blocks',
            'priority' => 2,

            'components' => [
                [
                    'code' => 'block_templates',
                    'name' => 'Block Templates',
                    'route' => '/admin/cms/blocks/templates',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Templates'],
                        ['code' => 'create', 'name' => 'Create Template'],
                        ['code' => 'edit', 'name' => 'Edit Template'],
                        ['code' => 'delete', 'name' => 'Delete Template'],
                    ],
                ],
                [
                    'code' => 'global_blocks',
                    'name' => 'Global Blocks',
                    'route' => '/admin/cms/blocks/global',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Global Blocks'],
                        ['code' => 'create', 'name' => 'Create Global Block'],
                        ['code' => 'edit', 'name' => 'Edit Global Block'],
                        ['code' => 'delete', 'name' => 'Delete Global Block'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 3. Media Library
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'media',
            'name' => 'Media',
            'description' => 'Manage images and files',
            'icon' => 'PhotoIcon',
            'route' => '/admin/cms/media',
            'priority' => 3,

            'components' => [
                [
                    'code' => 'media_library',
                    'name' => 'Media Library',
                    'route' => '/admin/cms/media',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Media'],
                        ['code' => 'upload', 'name' => 'Upload Media'],
                        ['code' => 'edit', 'name' => 'Edit Media'],
                        ['code' => 'delete', 'name' => 'Delete Media'],
                        ['code' => 'organize', 'name' => 'Organize Folders'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 4. Page Templates
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'templates',
            'name' => 'Templates',
            'description' => 'Pre-built page templates',
            'icon' => 'RectangleStackIcon',
            'route' => '/admin/cms/templates',
            'priority' => 4,

            'components' => [
                [
                    'code' => 'page_templates',
                    'name' => 'Page Templates',
                    'route' => '/admin/cms/templates',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Templates'],
                        ['code' => 'create', 'name' => 'Create Template'],
                        ['code' => 'edit', 'name' => 'Edit Template'],
                        ['code' => 'delete', 'name' => 'Delete Template'],
                        ['code' => 'apply', 'name' => 'Apply Template'],
                    ],
                ],
            ],
        ],

        /*
        |--------------------------------------------------------------------------
        | 5. SEO & Settings
        |--------------------------------------------------------------------------
        */
        [
            'code' => 'settings',
            'name' => 'Settings',
            'description' => 'CMS configuration and SEO',
            'icon' => 'Cog6ToothIcon',
            'route' => '/admin/cms/settings',
            'priority' => 5,

            'components' => [
                [
                    'code' => 'cms_settings',
                    'name' => 'General Settings',
                    'route' => '/admin/cms/settings',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View Settings'],
                        ['code' => 'edit', 'name' => 'Edit Settings'],
                    ],
                ],
                [
                    'code' => 'seo_defaults',
                    'name' => 'SEO Defaults',
                    'route' => '/admin/cms/settings/seo',
                    'actions' => [
                        ['code' => 'view', 'name' => 'View SEO Settings'],
                        ['code' => 'edit', 'name' => 'Edit SEO Settings'],
                    ],
                ],
            ],
        ],
    ],
];
