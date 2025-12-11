<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Available Products
    |--------------------------------------------------------------------------
    |
    | Define standalone products that can be sold separately.
    | Each product includes base modules and optional add-ons.
    |
    */

    'products' => [
        // HRM as Standalone Product
        'hrm' => [
            'name' => 'Aero HRM',
            'slug' => 'hrm',
            'description' => 'Complete Human Resource Management System with employee management, attendance, payroll, and performance tracking.',
            'tagline' => 'Manage your workforce efficiently',
            'category' => 'HR & People',
            
            // Base modules included in HRM product
            'base_modules' => [
                'hrm', // Core HRM functionality
            ],
            
            // Optional add-on modules for HRM product
            'addon_modules' => [
                'crm' => [
                    'name' => 'CRM Add-on',
                    'description' => 'Customer Relationship Management - Pipeline, deals, customer success.',
                    'price_monthly' => 29,
                    'price_yearly' => 290,
                ],
                'project' => [
                    'name' => 'Project Management Add-on',
                    'description' => 'Project planning, task management, sprint execution.',
                    'price_monthly' => 25,
                    'price_yearly' => 250,
                ],
                'finance' => [
                    'name' => 'Finance Add-on',
                    'description' => 'Billing, invoicing, expense management.',
                    'price_monthly' => 35,
                    'price_yearly' => 350,
                ],
            ],
            
            // Pricing for HRM base product
            'pricing' => [
                'free' => [
                    'name' => 'Free',
                    'price_monthly' => 0,
                    'price_yearly' => 0,
                    'max_users' => 5,
                    'max_employees' => 10,
                    'features' => [
                        'Employee Management',
                        'Basic Attendance',
                        'Leave Management',
                        'Up to 5 users',
                    ],
                ],
                'starter' => [
                    'name' => 'Starter',
                    'price_monthly' => 49,
                    'price_yearly' => 490,
                    'max_users' => 25,
                    'max_employees' => 50,
                    'features' => [
                        'Everything in Free',
                        'Advanced Attendance & Shifts',
                        'Payroll Management',
                        'Performance Reviews',
                        'Up to 25 users',
                        'Email Support',
                    ],
                ],
                'professional' => [
                    'name' => 'Professional',
                    'price_monthly' => 99,
                    'price_yearly' => 990,
                    'max_users' => 100,
                    'max_employees' => 200,
                    'features' => [
                        'Everything in Starter',
                        'Recruitment & Onboarding',
                        'Training Management',
                        'HR Analytics',
                        'Up to 100 users',
                        'Priority Support',
                    ],
                ],
                'enterprise' => [
                    'name' => 'Enterprise',
                    'price_monthly' => 199,
                    'price_yearly' => 1990,
                    'max_users' => -1, // Unlimited
                    'max_employees' => -1,
                    'features' => [
                        'Everything in Professional',
                        'Unlimited Users & Employees',
                        'Custom Workflows',
                        'API Access',
                        'Dedicated Support',
                        'SLA Guarantee',
                    ],
                ],
            ],
        ],

        // Full ERP Suite Product (for reference)
        'erp' => [
            'name' => 'Aero ERP Suite',
            'slug' => 'erp',
            'description' => 'Complete Enterprise Resource Planning system with all modules.',
            'tagline' => 'All-in-one business management',
            'category' => 'Enterprise',
            
            'base_modules' => [
                'hrm',
                'crm',
                'project',
                'finance',
                'scm',
                'ims',
                'pos',
                'dms',
                'quality',
                'compliance',
            ],
            
            'addon_modules' => [],
            
            'pricing' => [
                'business' => [
                    'name' => 'Business',
                    'price_monthly' => 299,
                    'price_yearly' => 2990,
                    'max_users' => 50,
                    'features' => [
                        'All Core Modules',
                        'Up to 50 users',
                        'Standard Support',
                    ],
                ],
                'enterprise' => [
                    'name' => 'Enterprise',
                    'price_monthly' => 599,
                    'price_yearly' => 5990,
                    'max_users' => -1,
                    'features' => [
                        'All Modules',
                        'Unlimited Users',
                        'Premium Support',
                        'Custom Development',
                    ],
                ],
            ],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Product
    |--------------------------------------------------------------------------
    |
    | The default product for new registrations if not specified.
    |
    */
    'default_product' => env('DEFAULT_PRODUCT', 'hrm'),

    /*
    |--------------------------------------------------------------------------
    | Module Categories
    |--------------------------------------------------------------------------
    |
    | Categorize modules for better organization in the marketplace.
    |
    */
    'module_categories' => [
        'core' => [
            'name' => 'Core Business',
            'description' => 'Essential business operations',
            'modules' => ['hrm', 'crm', 'finance'],
        ],
        'operations' => [
            'name' => 'Operations',
            'description' => 'Operational efficiency',
            'modules' => ['project', 'scm', 'ims'],
        ],
        'compliance' => [
            'name' => 'Compliance & Quality',
            'description' => 'Governance and standards',
            'modules' => ['compliance', 'quality', 'dms'],
        ],
        'sales' => [
            'name' => 'Sales & Retail',
            'description' => 'Customer-facing operations',
            'modules' => ['pos', 'crm'],
        ],
    ],
];
