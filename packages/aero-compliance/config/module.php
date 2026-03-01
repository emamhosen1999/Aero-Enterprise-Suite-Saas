<?php

return [
    /*
    |--------------------------------------------------------------------------
    | HSE & Regulatory Compliance Module
    |--------------------------------------------------------------------------
    |
    | Manages Health, Safety & Environment (HSE), Legal Permits, and
    | Workforce Certification Compliance.
    |
    */

    'code' => 'compliance',
    'scope' => 'tenant',
    'name' => 'HSE & Compliance',
    'description' => 'Comprehensive safety management with Digital Permit to Work (PTW) and regulatory tracking.',
    'version' => '2.1.0',
    'category' => 'business',
    'icon' => 'ShieldCheckIcon',
    'priority' => 17,
    'enabled' => env('COMPLIANCE_MODULE_ENABLED', true),
    'minimum_plan' => 'enterprise',
    'dependencies' => ['core', 'hr', 'assets'],

    'submodules' => [

        // ==================== COMPLIANCE DASHBOARD ====================
        [
            'code' => 'compliance-dashboard',
            'name' => 'Compliance Dashboard',
            'route' => '/compliance',

            'type' => 'dashboard',
            'description' => 'Main compliance dashboard with key metrics and alerts.',
            'icon' => 'ChartPieIcon',
            'priority' => 1,
            'is_active' => true,

        ],

        // ==================== 1. HEALTH & SAFETY (HSE) OPERATIONS ====================
        [
            'code' => 'hse-management',
            'name' => 'Site Safety (HSE)',
            'description' => 'Incident reporting, inspections, and safety drills.',
            'icon' => 'LifebuoyIcon',
            'route' => '/compliance/hse',
            'priority' => 10,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'incident-dashboard',
                    'name' => 'Incident Command',
                    'description' => 'Real-time dashboard of Near Misses, LTIs (Lost Time Injuries), and First Aid cases',
                    'route' => '/compliance/hse/dashboard',
                    'icon' => 'ChartBarIcon',
                    'type' => 'dashboard',
                ],
                [
                    'code' => 'ptw-system',
                    'name' => 'Permit to Work (PTW)', // CRITICAL NOVELTY
                    'description' => 'Digital authorization for high-risk activities (Hot Work, Confined Space)',
                    'route' => '/compliance/hse/ptw',
                    'icon' => 'LockClosedIcon',
                    'type' => 'page',
                    'actions' => [
                        ['code' => 'request', 'name' => 'Request Permit', 'description' => 'Apply for work permit'],
                        ['code' => 'authorize', 'name' => 'Authorize', 'description' => 'Safety Officer approval'],
                        ['code' => 'revoke', 'name' => 'Emergency Revoke', 'description' => 'Immediate stop-work order'],
                    ],
                ],
                [
                    'code' => 'toolbox-talks',
                    'name' => 'Toolbox Talks',
                    'description' => 'Daily safety briefing records with attendee digital signatures',
                    'route' => '/compliance/hse/toolbox',
                    'icon' => 'MegaphoneIcon',
                    'type' => 'page',
                ],
            ],
        ],

        // ==================== 2. WORKFORCE COMPLIANCE ====================
        [
            'code' => 'workforce-certs',
            'name' => 'Labor Certifications',
            'description' => 'Manage mandatory skills and certifications (CSCS, OSHA, Welding).',
            'icon' => 'IdentificationIcon',
            'route' => '/compliance/labor',
            'priority' => 20,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'competency-matrix',
                    'name' => 'Competency Matrix',
                    'description' => 'Grid view showing which workers are legally allowed to operate specific machinery',
                    'route' => '/compliance/labor/matrix',
                    'icon' => 'TableCellsIcon',
                    'type' => 'page',
                ],
                [
                    'code' => 'expiry-alerts',
                    'name' => 'Expiry Monitor',
                    'description' => 'Automated alerts for expiring licenses and visas',
                    'route' => null, // Backend service
                    'icon' => 'BellAlertIcon',
                    'type' => 'service',
                ],
            ],
        ],

        // ==================== 3. LEGAL & REGULATORY ====================
        [
            'code' => 'regulatory-tracker',
            'name' => 'Regulatory & Audits',
            'description' => 'Track government permits, environmental clearances, and external audits.',
            'icon' => 'BuildingLibraryIcon',
            'route' => '/compliance/regulatory',
            'priority' => 30,
            'is_active' => true,

            'components' => [
                [
                    'code' => 'permit-register',
                    'name' => 'Project Permit Register',
                    'description' => 'Track EPA, Municipal, and Utility permits',
                    'route' => '/compliance/regulatory/permits',
                    'icon' => 'DocumentTextIcon',
                    'type' => 'page',
                ],
                [
                    'code' => 'audit-trail',
                    'name' => 'Compliance Audits',
                    'description' => 'Internal and External ISO audit logs',
                    'route' => '/compliance/regulatory/audits',
                    'icon' => 'ClipboardDocumentListIcon',
                    'type' => 'page',
                ],
            ],
        ],
    ],
];
