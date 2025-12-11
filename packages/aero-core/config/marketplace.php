<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Marketplace API Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for Aero Suite marketplace integration. This includes
    | API endpoints, authentication, and available modules.
    |
    */

    'api_url' => env('MARKETPLACE_API_URL', 'https://api.marketplace.aerosuite.com'),
    'api_key' => env('MARKETPLACE_API_KEY', ''),

    /*
    |--------------------------------------------------------------------------
    | Envato Integration
    |--------------------------------------------------------------------------
    |
    | Integration with Envato/CodeCanyon for purchase code verification.
    |
    */

    'envato' => [
        'enabled' => env('ENVATO_ENABLED', true),
        'api_token' => env('ENVATO_API_TOKEN', ''),
        'author_username' => env('ENVATO_AUTHOR_USERNAME', 'aerosuite'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Available Modules
    |--------------------------------------------------------------------------
    |
    | List of all available modules in the marketplace. This is used as
    | fallback when the API is unavailable or for local development.
    |
    */

    'modules' => [
        [
            'code' => 'hrm',
            'name' => 'Human Resource Management',
            'description' => 'Complete HR management with employee, attendance, payroll, and performance tracking',
            'version' => '1.0.0',
            'price' => 29.00,
            'currency' => 'USD',
            'codecanyon_url' => 'https://codecanyon.net/item/aero-hrm-module/00000000',
            'preview_url' => 'https://demo.aerosuite.com/hrm',
            'thumbnail' => '/images/modules/hrm.png',
            'category' => 'Core Business',
            'features' => [
                'Employee Management',
                'Attendance Tracking',
                'Leave Management',
                'Payroll Processing',
                'Performance Reviews',
                'Recruitment & Onboarding',
            ],
            'requirements' => [
                'aero-core' => '^1.0',
                'php' => '>=8.2',
            ],
        ],
        [
            'code' => 'crm',
            'name' => 'Customer Relationship Management',
            'description' => 'Complete CRM with pipeline, deals, customer success, and revenue reporting',
            'version' => '1.0.0',
            'price' => 29.00,
            'currency' => 'USD',
            'codecanyon_url' => 'https://codecanyon.net/item/aero-crm-module/00000001',
            'preview_url' => 'https://demo.aerosuite.com/crm',
            'thumbnail' => '/images/modules/crm.png',
            'category' => 'Sales & Marketing',
            'features' => [
                'Lead Management',
                'Sales Pipeline',
                'Deal Tracking',
                'Customer Portal',
                'Revenue Analytics',
            ],
            'requirements' => [
                'aero-core' => '^1.0',
                'php' => '>=8.2',
            ],
        ],
        [
            'code' => 'finance',
            'name' => 'Finance & Accounting',
            'description' => 'Billing, invoicing, expense management, and financial reporting',
            'version' => '1.0.0',
            'price' => 39.00,
            'currency' => 'USD',
            'codecanyon_url' => 'https://codecanyon.net/item/aero-finance-module/00000002',
            'preview_url' => 'https://demo.aerosuite.com/finance',
            'thumbnail' => '/images/modules/finance.png',
            'category' => 'Finance',
            'features' => [
                'Invoicing',
                'Expense Tracking',
                'Budget Management',
                'Financial Reports',
                'Tax Management',
            ],
            'requirements' => [
                'aero-core' => '^1.0',
                'php' => '>=8.2',
            ],
        ],
        [
            'code' => 'project',
            'name' => 'Project Management',
            'description' => 'Project planning, task management, sprint execution, and team collaboration',
            'version' => '1.0.0',
            'price' => 35.00,
            'currency' => 'USD',
            'codecanyon_url' => 'https://codecanyon.net/item/aero-project-module/00000003',
            'preview_url' => 'https://demo.aerosuite.com/project',
            'thumbnail' => '/images/modules/project.png',
            'category' => 'Operations',
            'features' => [
                'Project Planning',
                'Task Management',
                'Gantt Charts',
                'Time Tracking',
                'Team Collaboration',
            ],
            'requirements' => [
                'aero-core' => '^1.0',
                'php' => '>=8.2',
            ],
        ],
        [
            'code' => 'pos',
            'name' => 'Point of Sale',
            'description' => 'Complete POS system with inventory, sales, and customer management',
            'version' => '1.0.0',
            'price' => 49.00,
            'currency' => 'USD',
            'codecanyon_url' => 'https://codecanyon.net/item/aero-pos-module/00000004',
            'preview_url' => 'https://demo.aerosuite.com/pos',
            'thumbnail' => '/images/modules/pos.png',
            'category' => 'Retail',
            'features' => [
                'Sales Management',
                'Inventory Tracking',
                'Barcode Scanning',
                'Customer Management',
                'Reports & Analytics',
            ],
            'requirements' => [
                'aero-core' => '^1.0',
                'php' => '>=8.2',
            ],
        ],
        [
            'code' => 'scm',
            'name' => 'Supply Chain Management',
            'description' => 'Vendor management, procurement, logistics, and supply chain optimization',
            'version' => '1.0.0',
            'price' => 59.00,
            'currency' => 'USD',
            'codecanyon_url' => 'https://codecanyon.net/item/aero-scm-module/00000005',
            'preview_url' => 'https://demo.aerosuite.com/scm',
            'thumbnail' => '/images/modules/scm.png',
            'category' => 'Operations',
            'features' => [
                'Vendor Management',
                'Procurement',
                'Logistics Tracking',
                'Demand Planning',
                'Supply Chain Analytics',
            ],
            'requirements' => [
                'aero-core' => '^1.0',
                'php' => '>=8.2',
            ],
        ],
        [
            'code' => 'ims',
            'name' => 'Inventory Management',
            'description' => 'Complete inventory tracking, stock management, and warehouse operations',
            'version' => '1.0.0',
            'price' => 35.00,
            'currency' => 'USD',
            'codecanyon_url' => 'https://codecanyon.net/item/aero-ims-module/00000006',
            'preview_url' => 'https://demo.aerosuite.com/ims',
            'thumbnail' => '/images/modules/ims.png',
            'category' => 'Operations',
            'features' => [
                'Stock Management',
                'Warehouse Management',
                'Barcode System',
                'Stock Alerts',
                'Inventory Reports',
            ],
            'requirements' => [
                'aero-core' => '^1.0',
                'php' => '>=8.2',
            ],
        ],
        [
            'code' => 'dms',
            'name' => 'Document Management',
            'description' => 'Document storage, version control, and collaboration platform',
            'version' => '1.0.0',
            'price' => 25.00,
            'currency' => 'USD',
            'codecanyon_url' => 'https://codecanyon.net/item/aero-dms-module/00000007',
            'preview_url' => 'https://demo.aerosuite.com/dms',
            'thumbnail' => '/images/modules/dms.png',
            'category' => 'Collaboration',
            'features' => [
                'Document Storage',
                'Version Control',
                'Access Control',
                'Document Sharing',
                'Search & Indexing',
            ],
            'requirements' => [
                'aero-core' => '^1.0',
                'php' => '>=8.2',
            ],
        ],
        [
            'code' => 'quality',
            'name' => 'Quality Management',
            'description' => 'Quality control, inspections, audits, and compliance management',
            'version' => '1.0.0',
            'price' => 45.00,
            'currency' => 'USD',
            'codecanyon_url' => 'https://codecanyon.net/item/aero-quality-module/00000008',
            'preview_url' => 'https://demo.aerosuite.com/quality',
            'thumbnail' => '/images/modules/quality.png',
            'category' => 'Compliance',
            'features' => [
                'Quality Control',
                'Inspections',
                'Audit Management',
                'Non-Conformance',
                'Corrective Actions',
            ],
            'requirements' => [
                'aero-core' => '^1.0',
                'php' => '>=8.2',
            ],
        ],
        [
            'code' => 'compliance',
            'name' => 'Compliance Management',
            'description' => 'Regulatory compliance, risk management, and policy tracking',
            'version' => '1.0.0',
            'price' => 49.00,
            'currency' => 'USD',
            'codecanyon_url' => 'https://codecanyon.net/item/aero-compliance-module/00000009',
            'preview_url' => 'https://demo.aerosuite.com/compliance',
            'thumbnail' => '/images/modules/compliance.png',
            'category' => 'Compliance',
            'features' => [
                'Regulatory Compliance',
                'Risk Management',
                'Policy Management',
                'Audit Trails',
                'Compliance Reporting',
            ],
            'requirements' => [
                'aero-core' => '^1.0',
                'php' => '>=8.2',
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Module Categories
    |--------------------------------------------------------------------------
    |
    | Categories for organizing modules in the marketplace.
    |
    */

    'categories' => [
        'Core Business' => ['hrm'],
        'Sales & Marketing' => ['crm'],
        'Finance' => ['finance'],
        'Operations' => ['project', 'scm', 'ims'],
        'Retail' => ['pos'],
        'Collaboration' => ['dms'],
        'Compliance' => ['quality', 'compliance'],
    ],

];
