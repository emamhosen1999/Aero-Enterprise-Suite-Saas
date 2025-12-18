<?php

return [
    'models' => [
        'permission' => Spatie\Permission\Models\Permission::class,
        'role' => Spatie\Permission\Models\Role::class,
    ],

    'table_names' => [
        'roles' => 'roles',
        'permissions' => 'permissions',
        'model_has_roles' => 'model_has_roles',
        'model_has_permissions' => 'model_has_permissions',
        'role_has_permissions' => 'role_has_permissions',
    ],

    'column_names' => [
        'role_pivot_key' => null,
        'permission_pivot_key' => null,
        'model_morph_key' => 'model_id',
        'team_foreign_key' => 'team_id',
    ],

    /*
    |--------------------------------------------------------------------------
    | Register Permission Check Method
    |--------------------------------------------------------------------------
    |
    | Set to false to disable Spatie's automatic permission checks via Gate.
    | This prevents the 'permissions' table from being queried on every can() call.
    | We use role_module_access instead of the permissions table for access control.
    |
    */
    'register_permission_check_method' => false,

    'register_octane_reset_listener' => false,
    'events_enabled' => false,
    'teams' => false,
    'use_passport_client_credentials' => false,

    'cache' => [
        'expiration_time' => \DateInterval::createFromDateString('24 hours'),
        'key' => 'spatie.permission.cache',
        'store' => 'default',
    ],
];
