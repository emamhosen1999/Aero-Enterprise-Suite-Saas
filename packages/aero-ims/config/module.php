<?php

return [
    'code' => 'ims',
    'name' => 'Inventory Management',
    'description' => 'Inventory management system with stock tracking, item management, and warehouse operations',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'CubeIcon',
    'priority' => 16,
    'enabled' => env('IMS_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',
    'dependencies' => ['core'],

    /*
    |--------------------------------------------------------------------------
    | IMS Settings
    |--------------------------------------------------------------------------
    */
    'inventory' => [
        'track_serial_numbers' => env('IMS_TRACK_SERIAL_NUMBERS', true),
        'track_batch_numbers' => env('IMS_TRACK_BATCH_NUMBERS', true),
        'enable_multi_warehouse' => env('IMS_MULTI_WAREHOUSE', true),
        'low_stock_threshold' => env('IMS_LOW_STOCK_THRESHOLD', 10),
    ],

    'stock_movements' => [
        'require_approval' => env('IMS_REQUIRE_APPROVAL', false),
        'auto_adjust_cost' => env('IMS_AUTO_ADJUST_COST', true),
        'movement_types' => ['in', 'out', 'transfer', 'adjustment'],
    ],

    'warehouses' => [
        'enable_locations' => env('IMS_WAREHOUSE_LOCATIONS', true),
        'enable_zones' => env('IMS_WAREHOUSE_ZONES', true),
    ],
];
