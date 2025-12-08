<?php

return [
    'code' => 'pos',
    'name' => 'Point of Sale',
    'description' => 'Point of sale system with sales processing, inventory integration, and payment management',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'ShoppingCartIcon',
    'priority' => 14,
    'enabled' => env('POS_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',
    'dependencies' => ['core'],

    /*
    |--------------------------------------------------------------------------
    | POS Settings
    |--------------------------------------------------------------------------
    */
    'sales' => [
        'default_tax_rate' => env('POS_DEFAULT_TAX_RATE', 0),
        'allow_discounts' => env('POS_ALLOW_DISCOUNTS', true),
        'require_customer' => env('POS_REQUIRE_CUSTOMER', false),
        'auto_print_receipt' => env('POS_AUTO_PRINT_RECEIPT', false),
    ],

    'payment' => [
        'accepted_methods' => ['cash', 'card', 'mobile', 'bank_transfer'],
        'enable_split_payment' => env('POS_SPLIT_PAYMENT', true),
    ],

    'receipt' => [
        'paper_size' => env('POS_RECEIPT_PAPER_SIZE', '80mm'),
        'show_logo' => env('POS_RECEIPT_SHOW_LOGO', true),
        'footer_text' => env('POS_RECEIPT_FOOTER', 'Thank you for your business!'),
    ],
];
