<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Aero Core Version
    |--------------------------------------------------------------------------
    |
    | The version of the Aero Core package.
    |
    */

    'version' => '1.0.0',

    /*
    |--------------------------------------------------------------------------
    | Route Prefix
    |--------------------------------------------------------------------------
    |
    | The prefix for all core routes. Set to empty string for no prefix.
    | Example: 'admin' will prefix all routes with /admin
    |
    */

    'route_prefix' => env('AERO_CORE_ROUTE_PREFIX', ''),

    /*
    |--------------------------------------------------------------------------
    | Authentication Settings
    |--------------------------------------------------------------------------
    */

    'auth' => [
        // The guard to use for authentication
        'guard' => env('AERO_CORE_AUTH_GUARD', 'web'),

        // The User model to use
        'user_model' => env('AERO_CORE_USER_MODEL', \Aero\Core\Models\User::class),

        // Redirect paths
        'redirect_after_login' => '/dashboard',
        'redirect_after_logout' => '/login',
        'redirect_if_authenticated' => '/dashboard',
    ],

    /*
    |--------------------------------------------------------------------------
    | UI Settings
    |--------------------------------------------------------------------------
    */

    'ui' => [
        // Default branding - null means use letter fallback
        'logo' => null,
        'logo_dark' => null,
        'favicon' => null,

        // Default theme
        'primary_color' => '#006FEE',
        'border_radius' => '12px',
        'border_width' => '2px',
        'font_family' => 'Inter',
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags
    |--------------------------------------------------------------------------
    */

    'features' => [
        // Enable user registration
        'registration' => env('AERO_CORE_REGISTRATION', true),

        // Enable password reset
        'password_reset' => env('AERO_CORE_PASSWORD_RESET', true),

        // Enable email verification
        'email_verification' => env('AERO_CORE_EMAIL_VERIFICATION', true),

        // Enable two-factor authentication
        'two_factor' => env('AERO_CORE_TWO_FACTOR', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Pagination Settings
    |--------------------------------------------------------------------------
    */

    'pagination' => [
        'per_page' => env('AERO_CORE_PER_PAGE', 15),
        'max_per_page' => env('AERO_CORE_MAX_PER_PAGE', 100),
    ],

];
