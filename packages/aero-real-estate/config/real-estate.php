<?php

return [
    'name' => 'Real Estate Management System',
    'version' => '1.0.0',
    
    // MLS Integration Settings
    'mls' => [
        'enabled' => env('MLS_ENABLED', false),
        'providers' => [
            'mls_grid' => [
                'api_key' => env('MLS_GRID_API_KEY'),
                'api_secret' => env('MLS_GRID_API_SECRET'),
            ],
            'rets' => [
                'login_url' => env('RETS_LOGIN_URL'),
                'username' => env('RETS_USERNAME'),
                'password' => env('RETS_PASSWORD'),
            ]
        ]
    ],
    
    // Property Settings
    'property' => [
        'default_commission_rate' => 6.0, // Percentage
        'default_lease_duration' => 12, // Months
        'default_grace_period' => 5, // Days for rent payments
        'photo_max_size' => 10 * 1024 * 1024, // 10MB
        'photo_formats' => ['jpg', 'jpeg', 'png', 'webp'],
    ],
    
    // Maintenance Settings
    'maintenance' => [
        'emergency_response_time' => 2, // Hours
        'standard_response_time' => 24, // Hours
        'vendor_rating_threshold' => 4.0, // Minimum rating
    ],
    
    // Financial Settings
    'finance' => [
        'late_fee_percentage' => 5.0, // Percentage of rent
        'security_deposit_limit' => 2.0, // Multiple of monthly rent
        'payment_methods' => ['cash', 'check', 'bank_transfer', 'credit_card', 'online'],
    ],
    
    // Reporting Settings
    'reports' => [
        'retention_period' => 7 * 365, // Days (7 years)
        'automated_reports' => [
            'monthly_rent_roll' => true,
            'maintenance_summary' => true,
            'vacancy_report' => true,
        ]
    ]
];