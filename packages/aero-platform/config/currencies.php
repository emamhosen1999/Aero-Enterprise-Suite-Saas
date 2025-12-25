<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Supported Currencies
    |--------------------------------------------------------------------------
    |
    | Define all currencies supported by the platform for billing and pricing.
    |
    */

    'supported' => [
        'USD' => [
            'name' => 'US Dollar',
            'symbol' => '$',
            'code' => 'USD',
            'decimal_places' => 2,
        ],
        'EUR' => [
            'name' => 'Euro',
            'symbol' => '€',
            'code' => 'EUR',
            'decimal_places' => 2,
        ],
        'GBP' => [
            'name' => 'British Pound',
            'symbol' => '£',
            'code' => 'GBP',
            'decimal_places' => 2,
        ],
        'CAD' => [
            'name' => 'Canadian Dollar',
            'symbol' => 'CA$',
            'code' => 'CAD',
            'decimal_places' => 2,
        ],
        'AUD' => [
            'name' => 'Australian Dollar',
            'symbol' => 'A$',
            'code' => 'AUD',
            'decimal_places' => 2,
        ],
        'JPY' => [
            'name' => 'Japanese Yen',
            'symbol' => '¥',
            'code' => 'JPY',
            'decimal_places' => 0,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Base Currency
    |--------------------------------------------------------------------------
    |
    | The base currency for all calculations and reporting.
    | All prices are stored in this currency and converted as needed.
    |
    */

    'base_currency' => env('BASE_CURRENCY', 'USD'),

    /*
    |--------------------------------------------------------------------------
    | Exchange Rate API
    |--------------------------------------------------------------------------
    |
    | Configuration for automatic exchange rate synchronization.
    |
    */

    'exchange_rate_api' => [
        // API provider (exchangerate-api.com, fixer.io, currencyapi.com)
        'provider' => env('EXCHANGE_RATE_PROVIDER', 'exchangerate-api'),
        
        // API key (required for most providers)
        'api_key' => env('EXCHANGE_RATE_API_KEY', ''),
        
        // Base URL for the API
        'api_url' => env('EXCHANGE_RATE_API_URL', 'https://api.exchangerate-api.com/v4/latest'),
        
        // Enable automatic synchronization
        'auto_sync' => env('EXCHANGE_RATE_AUTO_SYNC', true),
        
        // Sync frequency (daily via SyncExchangeRatesJob)
        'sync_frequency' => 'daily',
        
        // Fallback to manual rates if API fails
        'fallback_to_manual' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Exchange Rate History
    |--------------------------------------------------------------------------
    |
    | Configure how long to keep historical exchange rates.
    |
    */

    'history' => [
        'retention_days' => env('EXCHANGE_RATE_RETENTION_DAYS', 90),
        'cleanup_frequency' => 'weekly',
    ],

    /*
    |--------------------------------------------------------------------------
    | Regional Pricing Rules
    |--------------------------------------------------------------------------
    |
    | Define psychological pricing rules for each currency.
    | These override direct currency conversion for better market positioning.
    |
    */

    'regional_pricing' => [
        'enabled' => env('REGIONAL_PRICING_ENABLED', true),
        
        // Psychological pricing rules (USD amount => local amount)
        'rules' => [
            'EUR' => [
                9 => 9,
                19 => 19,
                29 => 29,
                49 => 49,
                99 => 89,
                149 => 139,
                199 => 189,
                299 => 279,
                499 => 449,
            ],
            'GBP' => [
                9 => 9,
                19 => 19,
                29 => 29,
                49 => 49,
                99 => 79,
                149 => 119,
                199 => 159,
                299 => 239,
                499 => 389,
            ],
            'CAD' => [
                9 => 12,
                19 => 24,
                29 => 39,
                49 => 64,
                99 => 129,
                149 => 199,
                199 => 259,
                299 => 389,
                499 => 649,
            ],
            'AUD' => [
                9 => 13,
                19 => 26,
                29 => 42,
                49 => 69,
                99 => 139,
                149 => 209,
                199 => 279,
                299 => 419,
                499 => 699,
            ],
            'JPY' => [
                9 => 1000,
                19 => 2200,
                29 => 3300,
                49 => 5500,
                99 => 11000,
                149 => 16500,
                199 => 22000,
                299 => 33000,
                499 => 55000,
            ],
        ],
        
        // Rounding strategy for non-predefined amounts
        'rounding' => [
            'EUR' => 'down_to_nearest_9',  // €88.42 → €89
            'GBP' => 'down_to_nearest_9',  // £75.23 → £79
            'CAD' => 'up_to_nearest_9',    // CA$126.45 → CA$129
            'AUD' => 'up_to_nearest_9',    // A$136.78 → A$139
            'JPY' => 'to_nearest_1000',    // ¥10,842 → ¥11,000
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Currency Display Format
    |--------------------------------------------------------------------------
    |
    | Configure how currency amounts are displayed.
    |
    */

    'display' => [
        'symbol_position' => 'before', // 'before' or 'after'
        'decimal_separator' => '.',
        'thousands_separator' => ',',
        'space_between_symbol_and_amount' => false,
    ],

    /*
    |--------------------------------------------------------------------------
    | Manual Exchange Rates
    |--------------------------------------------------------------------------
    |
    | Fallback exchange rates if API is unavailable or for manual override.
    | These are only used when auto_sync is disabled or API fails.
    |
    */

    'manual_rates' => [
        'EUR' => 0.92,
        'GBP' => 0.79,
        'CAD' => 1.35,
        'AUD' => 1.52,
        'JPY' => 149.50,
    ],
];
