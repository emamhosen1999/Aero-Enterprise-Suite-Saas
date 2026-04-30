<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Installation Mode
    |--------------------------------------------------------------------------
    |
    | The installation mode: 'standalone' or 'saas'
    | This is auto-detected based on whether aero-platform package is installed.
    |
    */
    'mode' => env('AERO_INSTALLATION_MODE', 'standalone'),

    /*
    |--------------------------------------------------------------------------
    | Installation Lock File
    |--------------------------------------------------------------------------
    |
    | The file that indicates the system has been installed.
    |
    */
    'lock_file' => storage_path('app/aeos.installed'),

    /*
    |--------------------------------------------------------------------------
    | License Validation
    |--------------------------------------------------------------------------
    |
    | License validation settings for standalone mode.
    |
    */
    'license' => [
        'enabled' => env('AERO_LICENSE_ENABLED', true),
        'providers' => ['themeforest', 'envato', 'aeos365'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Secret Key Validation
    |--------------------------------------------------------------------------
    |
    | Secret key validation for SaaS mode.
    |
    */
    'secret_key' => env('AERO_INSTALLATION_SECRET_KEY'),
];
