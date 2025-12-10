<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Finance Module Configuration
    |--------------------------------------------------------------------------
    */

    'code' => 'finance',
    'name' => 'Finance',
    'description' => 'Financial management system with chart of accounts, general ledger, AP/AR, and journal entries',
    'version' => '1.0.0',
    'category' => 'business',
    'icon' => 'CurrencyDollarIcon',
    'priority' => 12,
    'enabled' => env('FINANCE_MODULE_ENABLED', true),
    'minimum_plan' => 'professional',
    'dependencies' => ['core'],

    /*
    |--------------------------------------------------------------------------
    | Module Features
    |--------------------------------------------------------------------------
    */
    'features' => [
        'chart_of_accounts' => true,
        'general_ledger' => true,
        'journal_entries' => true,
        'accounts_payable' => true,
        'accounts_receivable' => true,
        'financial_reporting' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Accounting Settings
    |--------------------------------------------------------------------------
    */
    'accounting' => [
        'default_currency' => env('FINANCE_DEFAULT_CURRENCY', 'USD'),
        'fiscal_year_start' => env('FINANCE_FISCAL_YEAR_START', '01-01'),
        'decimal_places' => env('FINANCE_DECIMAL_PLACES', 2),
        'allow_negative_balance' => env('FINANCE_ALLOW_NEGATIVE_BALANCE', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Journal Entry Settings
    |--------------------------------------------------------------------------
    */
    'journal_entries' => [
        'require_approval' => env('FINANCE_REQUIRE_APPROVAL', true),
        'auto_number' => env('FINANCE_AUTO_NUMBER', true),
        'number_prefix' => env('FINANCE_NUMBER_PREFIX', 'JE'),
    ],

    /*
    |--------------------------------------------------------------------------
    | AP/AR Settings
    |--------------------------------------------------------------------------
    */
    'accounts_payable' => [
        'payment_terms_days' => env('FINANCE_AP_PAYMENT_TERMS', 30),
        'early_payment_discount' => env('FINANCE_AP_EARLY_DISCOUNT', 0),
    ],

    'accounts_receivable' => [
        'payment_terms_days' => env('FINANCE_AR_PAYMENT_TERMS', 30),
        'late_fee_percentage' => env('FINANCE_AR_LATE_FEE', 0),
    ],
];
