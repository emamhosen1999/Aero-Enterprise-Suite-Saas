<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Supported Locales
    |--------------------------------------------------------------------------
    |
    | Single source of truth for every locale the application supports.
    | All middleware, controllers, and frontend code should read from here.
    |
    */

    'supported' => ['en', 'bn', 'ar', 'es', 'fr', 'de', 'hi', 'zh-CN', 'zh-TW'],

    /*
    |--------------------------------------------------------------------------
    | Default Locale
    |--------------------------------------------------------------------------
    |
    | The default locale used when no user preference is detected.
    | Falls back to config('app.locale') if not set.
    |
    */

    'default' => null,

    /*
    |--------------------------------------------------------------------------
    | Locale Metadata
    |--------------------------------------------------------------------------
    |
    | Native names, direction, and flag codes for each locale.
    | Used by both backend and frontend (shared via Inertia).
    |
    */

    'meta' => [
        'en'    => ['name' => 'English',                  'native' => 'English',   'dir' => 'ltr', 'flag' => 'us'],
        'bn'    => ['name' => 'Bengali',                  'native' => 'বাংলা',      'dir' => 'ltr', 'flag' => 'bd'],
        'ar'    => ['name' => 'Arabic',                   'native' => 'العربية',    'dir' => 'rtl', 'flag' => 'sa'],
        'es'    => ['name' => 'Spanish',                  'native' => 'Español',   'dir' => 'ltr', 'flag' => 'es'],
        'fr'    => ['name' => 'French',                   'native' => 'Français',  'dir' => 'ltr', 'flag' => 'fr'],
        'de'    => ['name' => 'German',                   'native' => 'Deutsch',   'dir' => 'ltr', 'flag' => 'de'],
        'hi'    => ['name' => 'Hindi',                    'native' => 'हिन्दी',      'dir' => 'ltr', 'flag' => 'in'],
        'zh-CN' => ['name' => 'Chinese (Simplified)',     'native' => '简体中文',    'dir' => 'ltr', 'flag' => 'cn'],
        'zh-TW' => ['name' => 'Chinese (Traditional)',    'native' => '繁體中文',    'dir' => 'ltr', 'flag' => 'tw'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Translation API Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the translation engine drivers.
    | Primary: The first driver tried for translation.
    | Fallback: Used when the primary driver fails.
    |
    | Supported: 'libretranslate', 'mymemory'
    |
    */

    'translation_api' => [

        'primary' => env('I18N_PRIMARY_DRIVER', 'libretranslate'),

        'timeout' => (int) env('I18N_API_TIMEOUT', 30),

        'libretranslate' => [
            'url' => env('I18N_LIBRETRANSLATE_URL', 'https://libretranslate.com'),
            'api_key' => env('I18N_LIBRETRANSLATE_KEY'),
        ],

        'mymemory' => [
            'email' => env('I18N_MYMEMORY_EMAIL'),
        ],

    ],

];
