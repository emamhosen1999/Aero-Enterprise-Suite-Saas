<?php

return [
    'code' => 'scm',
    'name' => 'Supply Chain Management',
    'description' => 'Supply chain management with procurement, logistics, production planning, and supplier management',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'TruckIcon',
    'priority' => 15,
    'enabled' => env('SCM_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',
    'dependencies' => ['core'],

    /*
    |--------------------------------------------------------------------------
    | SCM Settings
    |--------------------------------------------------------------------------
    */
    'procurement' => [
        'require_approval' => env('SCM_REQUIRE_APPROVAL', true),
        'approval_levels' => env('SCM_APPROVAL_LEVELS', 2),
        'auto_po_number' => env('SCM_AUTO_PO_NUMBER', true),
        'po_prefix' => env('SCM_PO_PREFIX', 'PO'),
    ],

    'suppliers' => [
        'rating_enabled' => env('SCM_SUPPLIER_RATING', true),
        'rating_criteria' => ['quality', 'delivery', 'price', 'service'],
    ],

    'logistics' => [
        'track_shipments' => env('SCM_TRACK_SHIPMENTS', true),
        'default_carrier' => env('SCM_DEFAULT_CARRIER', null),
    ],

    'production' => [
        'capacity_planning' => env('SCM_CAPACITY_PLANNING', true),
        'demand_forecast' => env('SCM_DEMAND_FORECAST', true),
    ],
];
