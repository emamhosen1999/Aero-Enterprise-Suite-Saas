<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Default Filesystem Disk
    |--------------------------------------------------------------------------
    |
    | Here you may specify the default filesystem disk that should be used
    | by the framework. The "local" disk, as well as a variety of cloud
    | based disks are available to your application for file storage.
    |
    */

    'default' => env('FILESYSTEM_DISK', 'local'),

    /*
    |--------------------------------------------------------------------------
    | Filesystem Disks
    |--------------------------------------------------------------------------
    |
    | Below you may configure as many filesystem disks as necessary, and you
    | may even configure multiple disks for the same driver. Examples for
    | most supported storage drivers are configured here for reference.
    |
    | Supported drivers: "local", "ftp", "sftp", "s3"
    |
    */

    'disks' => [

        'local' => [
            'driver' => 'local',
            'root' => storage_path('app'),
            'throw' => false,
        ],

        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL').'/storage',
            'visibility' => 'public',
        ],

        's3' => [
            'driver' => 's3',
            'key' => env('AWS_ACCESS_KEY_ID'),
            'secret' => env('AWS_SECRET_ACCESS_KEY'),
            'region' => env('AWS_DEFAULT_REGION'),
            'bucket' => env('AWS_BUCKET'),
            'url' => env('AWS_URL'),
            'endpoint' => env('AWS_ENDPOINT'),
            'use_path_style_endpoint' => env('AWS_USE_PATH_STYLE_ENDPOINT', false),
            'throw' => false,
        ],

        /*
        |--------------------------------------------------------------------------
        | Wasabi Cloud Storage (S3-Compatible)
        |--------------------------------------------------------------------------
        |
        | Wasabi provides S3-compatible storage at a lower cost than AWS S3.
        | Configure credentials in your .env file.
        |
        | Supported regions:
        | - us-east-1, us-east-2, us-west-1
        | - eu-central-1, eu-central-2, eu-west-1, eu-west-2
        | - ap-northeast-1, ap-northeast-2, ap-southeast-1, ap-southeast-2
        |
        */
        'wasabi' => [
            'driver' => 's3',
            'key' => env('WASABI_ACCESS_KEY_ID'),
            'secret' => env('WASABI_SECRET_ACCESS_KEY'),
            'region' => env('WASABI_DEFAULT_REGION', 'us-east-1'),
            'bucket' => env('WASABI_BUCKET'),
            'url' => env('WASABI_URL'),
            'endpoint' => env('WASABI_ENDPOINT', 'https://s3.wasabisys.com'),
            'use_path_style_endpoint' => env('WASABI_USE_PATH_STYLE_ENDPOINT', true),
            'visibility' => 'private',
            'throw' => false,
        ],

        /*
        |--------------------------------------------------------------------------
        | Cloudflare R2 Storage (S3-Compatible)
        |--------------------------------------------------------------------------
        |
        | Cloudflare R2 provides zero-egress-fee S3-compatible storage.
        |
        */
        'r2' => [
            'driver' => 's3',
            'key' => env('CLOUDFLARE_R2_ACCESS_KEY_ID'),
            'secret' => env('CLOUDFLARE_R2_SECRET_ACCESS_KEY'),
            'region' => 'auto',
            'bucket' => env('CLOUDFLARE_R2_BUCKET'),
            'url' => env('CLOUDFLARE_R2_URL'),
            'endpoint' => env('CLOUDFLARE_R2_ENDPOINT'),
            'use_path_style_endpoint' => false,
            'visibility' => 'private',
            'throw' => false,
        ],

    ],

    /*
    |--------------------------------------------------------------------------
    | Symbolic Links
    |--------------------------------------------------------------------------
    |
    | Here you may configure the symbolic links that will be created when the
    | `storage:link` Artisan command is executed. The array keys should be
    | the locations of the links and the values should be their targets.
    |
    */

    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],

];
