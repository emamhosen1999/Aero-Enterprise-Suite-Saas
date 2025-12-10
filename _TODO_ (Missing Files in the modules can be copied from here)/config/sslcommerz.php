<?php

return [

    /*
    |--------------------------------------------------------------------------
    | SSLCOMMERZ Payment Gateway Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains the configuration for integrating SSLCOMMERZ
    | payment gateway, which is popular for Bangladeshi businesses.
    |
    */

    'store_id' => env('SSLCOMMERZ_STORE_ID'),
    'store_password' => env('SSLCOMMERZ_STORE_PASSWORD'),

    /*
    |--------------------------------------------------------------------------
    | Sandbox Mode
    |--------------------------------------------------------------------------
    |
    | Set this to true for testing/sandbox environment.
    | Set to false for production/live transactions.
    |
    */
    'sandbox' => env('SSLCOMMERZ_SANDBOX', true),

    /*
    |--------------------------------------------------------------------------
    | API URLs
    |--------------------------------------------------------------------------
    */
    'api_url' => env('SSLCOMMERZ_API_URL', 'https://sandbox.sslcommerz.com'),
    'api_url_live' => 'https://securepay.sslcommerz.com',
    'api_url_sandbox' => 'https://sandbox.sslcommerz.com',

    /*
    |--------------------------------------------------------------------------
    | Callback URLs
    |--------------------------------------------------------------------------
    */
    'success_url' => env('SSLCOMMERZ_SUCCESS_URL', '/payment/sslcommerz/success'),
    'fail_url' => env('SSLCOMMERZ_FAIL_URL', '/payment/sslcommerz/fail'),
    'cancel_url' => env('SSLCOMMERZ_CANCEL_URL', '/payment/sslcommerz/cancel'),
    'ipn_url' => env('SSLCOMMERZ_IPN_URL', '/api/webhooks/sslcommerz'),

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    */
    'currency' => env('SSLCOMMERZ_CURRENCY', 'BDT'),

    /*
    |--------------------------------------------------------------------------
    | EMI Options
    |--------------------------------------------------------------------------
    */
    'emi_option' => env('SSLCOMMERZ_EMI_OPTION', 0), // 0 = No EMI, 1 = Yes

    /*
    |--------------------------------------------------------------------------
    | Multi-card Payment Options
    |--------------------------------------------------------------------------
    */
    'multi_card_name' => env('SSLCOMMERZ_MULTI_CARD_NAME', ''),

    /*
    |--------------------------------------------------------------------------
    | Allowed Payment Bins
    |--------------------------------------------------------------------------
    */
    'allowed_bin' => env('SSLCOMMERZ_ALLOWED_BIN', ''),

    /*
    |--------------------------------------------------------------------------
    | Product Information
    |--------------------------------------------------------------------------
    */
    'product_category' => env('SSLCOMMERZ_PRODUCT_CATEGORY', 'subscription'),
    'product_profile' => env('SSLCOMMERZ_PRODUCT_PROFILE', 'general'),

    /*
    |--------------------------------------------------------------------------
    | Shipping Information
    |--------------------------------------------------------------------------
    */
    'shipping' => [
        'enabled' => env('SSLCOMMERZ_SHIPPING_ENABLED', false),
        'method' => env('SSLCOMMERZ_SHIPPING_METHOD', 'NO'),
        'num_items' => env('SSLCOMMERZ_SHIPPING_NUM_ITEMS', 1),
    ],

];
