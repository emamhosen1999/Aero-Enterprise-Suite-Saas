<?php

return [
    /*
    |--------------------------------------------------------------------------
    | IoT Module — Internet of Things Management
    |--------------------------------------------------------------------------
    |
    | Manages IoT devices, sensors, gateways, telemetry data,
    | alerts, networks, and device maintenance.
    |
    */

    'code' => 'iot',
    'scope' => 'tenant',
    'name' => 'IoT Management',
    'description' => 'Internet of Things device management with real-time telemetry, sensor monitoring, alert rules, and gateway administration.',
    'version' => '1.0.0',
    'category' => 'industry',
    'icon' => 'CpuChipIcon',
    'priority' => 31,
    'enabled' => env('IOT_MODULE_ENABLED', true),
    'minimum_plan' => null,
    'dependencies' => ['core'],
    'route_prefix' => 'iot',

    'submodules' => [

        // ==================== IOT DASHBOARD ====================
        [
            'code' => 'iot-dashboard',
            'name' => 'IoT Dashboard',
            'description' => 'Real-time overview of devices, sensors, telemetry, and alerts.',
            'icon' => 'ChartPieIcon',
            'route' => 'tenant.iot.dashboard',
            'priority' => 1,
            'is_active' => true,
            'components' => [],
        ],

        // ==================== DEVICES ====================
        [
            'code' => 'devices',
            'name' => 'Devices',
            'description' => 'IoT device registration, monitoring, command dispatch, and bulk operations.',
            'icon' => 'DevicePhoneMobileIcon',
            'route' => 'tenant.iot.devices.index',
            'priority' => 2,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'device-list',
                    'name' => 'Device List',
                    'description' => 'View and manage all IoT devices.',
                    'route_name' => 'tenant.iot.devices.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'command', 'name' => 'Send Command', 'is_active' => true],
                        ['code' => 'restart', 'name' => 'Restart Device', 'is_active' => true],
                        ['code' => 'shutdown', 'name' => 'Shutdown Device', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'device-bulk-operations',
                    'name' => 'Bulk Operations',
                    'description' => 'Perform bulk commands, updates, and deletions on devices.',
                    'route_name' => 'tenant.iot.devices.bulk.command',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'bulk-command', 'name' => 'Bulk Command', 'is_active' => true],
                        ['code' => 'bulk-update', 'name' => 'Bulk Update', 'is_active' => true],
                        ['code' => 'bulk-delete', 'name' => 'Bulk Delete', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== SENSORS ====================
        [
            'code' => 'sensors',
            'name' => 'Sensors',
            'description' => 'Sensor registration, calibration, threshold configuration, and data export.',
            'icon' => 'SignalIcon',
            'route' => 'tenant.iot.sensors.index',
            'priority' => 3,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'sensor-list',
                    'name' => 'Sensor List',
                    'description' => 'View and manage all sensors.',
                    'route_name' => 'tenant.iot.sensors.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'calibrate', 'name' => 'Calibrate', 'is_active' => true],
                        ['code' => 'threshold', 'name' => 'Set Threshold', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export Data', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== TELEMETRY ====================
        [
            'code' => 'telemetry',
            'name' => 'Telemetry',
            'description' => 'Real-time telemetry data viewing, analytics, and data purging.',
            'icon' => 'ArrowTrendingUpIcon',
            'route' => 'tenant.iot.telemetry.index',
            'priority' => 4,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'telemetry-overview',
                    'name' => 'Telemetry Overview',
                    'description' => 'View telemetry data across all devices and sensors.',
                    'route_name' => 'tenant.iot.telemetry.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                        ['code' => 'purge', 'name' => 'Purge Old Data', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'telemetry-analytics',
                    'name' => 'Telemetry Analytics',
                    'description' => 'Advanced telemetry analytics and trend analysis.',
                    'route_name' => 'tenant.iot.telemetry.analytics',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== ALERTS ====================
        [
            'code' => 'alerts',
            'name' => 'Alerts',
            'description' => 'Alert monitoring, acknowledgment, resolution, escalation, and rule management.',
            'icon' => 'BellAlertIcon',
            'route' => 'tenant.iot.alerts.index',
            'priority' => 5,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'alert-list',
                    'name' => 'Alert List',
                    'description' => 'View and manage all IoT alerts.',
                    'route_name' => 'tenant.iot.alerts.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'acknowledge', 'name' => 'Acknowledge', 'is_active' => true],
                        ['code' => 'resolve', 'name' => 'Resolve', 'is_active' => true],
                        ['code' => 'suppress', 'name' => 'Suppress', 'is_active' => true],
                        ['code' => 'escalate', 'name' => 'Escalate', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'alert-rules',
                    'name' => 'Alert Rules',
                    'description' => 'Configure alert rules and thresholds.',
                    'route_name' => 'tenant.iot.alerts.rules',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== GATEWAYS ====================
        [
            'code' => 'gateways',
            'name' => 'Gateways',
            'description' => 'IoT gateway management, health monitoring, and connected device listing.',
            'icon' => 'ServerIcon',
            'route' => 'tenant.iot.gateways.index',
            'priority' => 6,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'gateway-list',
                    'name' => 'Gateway List',
                    'description' => 'View and manage all IoT gateways.',
                    'route_name' => 'tenant.iot.gateways.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                        ['code' => 'restart', 'name' => 'Restart Gateway', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== NETWORKS ====================
        [
            'code' => 'networks',
            'name' => 'Networks',
            'description' => 'IoT network topology and configuration management.',
            'icon' => 'GlobeAltIcon',
            'route' => 'tenant.iot.networks.index',
            'priority' => 7,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'network-list',
                    'name' => 'Network List',
                    'description' => 'View and manage IoT networks.',
                    'route_name' => 'tenant.iot.networks.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== DEVICE TYPES ====================
        [
            'code' => 'device-types',
            'name' => 'Device Types',
            'description' => 'Device type catalog and classification management.',
            'icon' => 'TagIcon',
            'route' => 'tenant.iot.device-types.index',
            'priority' => 8,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'device-type-list',
                    'name' => 'Device Type List',
                    'description' => 'View and manage device type definitions.',
                    'route_name' => 'tenant.iot.device-types.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'create', 'name' => 'Create', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                        ['code' => 'delete', 'name' => 'Delete', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== REPORTS ====================
        [
            'code' => 'iot-reports',
            'name' => 'Reports',
            'description' => 'Device usage, sensor performance, alert summaries, and maintenance schedules.',
            'icon' => 'ChartBarIcon',
            'route' => 'tenant.iot.reports.index',
            'priority' => 9,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'report-list',
                    'name' => 'Report List',
                    'description' => 'View available IoT reports.',
                    'route_name' => 'tenant.iot.reports.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'export', 'name' => 'Export', 'is_active' => true],
                    ],
                ],
            ],
        ],

        // ==================== SETTINGS ====================
        [
            'code' => 'iot-settings',
            'name' => 'Settings',
            'description' => 'IoT module configuration and notification preferences.',
            'icon' => 'Cog6ToothIcon',
            'route' => 'tenant.iot.settings.index',
            'priority' => 10,
            'is_active' => true,
            'components' => [
                [
                    'code' => 'iot-general-settings',
                    'name' => 'General Settings',
                    'description' => 'Configure general IoT module settings.',
                    'route_name' => 'tenant.iot.settings.index',
                    'priority' => 1,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                    ],
                ],
                [
                    'code' => 'iot-notification-settings',
                    'name' => 'Notification Settings',
                    'description' => 'Configure IoT alert notification preferences.',
                    'route_name' => 'tenant.iot.settings.notifications',
                    'priority' => 2,
                    'is_active' => true,
                    'actions' => [
                        ['code' => 'view', 'name' => 'View', 'is_active' => true],
                        ['code' => 'update', 'name' => 'Update', 'is_active' => true],
                    ],
                ],
            ],
        ],
    ],
];
