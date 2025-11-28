<?php

return [
    // Single Device Login Messages
    'single_device_login' => [
        'enabled' => 'Single device login enabled for user',
        'disabled' => 'Single device login disabled for user',
        'enable_success' => 'Single device login has been enabled successfully',
        'disable_success' => 'Single device login has been disabled successfully',
        'already_enabled' => 'Single device login is already enabled for this user',
        'already_disabled' => 'Single device login is already disabled for this user',
    ],

    // Device Management Messages
    'device_management' => [
        'title' => 'Device Management',
        'user_devices' => 'User Devices',
        'device_status' => 'Device Status',
        'active_device' => 'Active Device',
        'no_active_device' => 'No Active Device',
        'device_locked' => 'Device Locked',
        'device_free' => 'Device Free',
        'multiple_devices_allowed' => 'Multiple devices allowed',
    ],

    // Device Reset Messages
    'device_reset' => [
        'success' => 'User device has been reset successfully',
        'confirm_title' => 'Reset Device Access',
        'confirm_message' => 'Are you sure you want to reset device access for this user? They will be logged out from all devices.',
        'button_text' => 'Reset Device Lock',
        'admin_reset_reason' => 'Admin reset',
        'reset_completed' => 'Device reset completed. User can now login from a new device.',
    ],

    // Device Logout Messages
    'device_logout' => [
        'success' => 'Device has been logged out successfully',
        'confirm_title' => 'Force Logout Device',
        'confirm_message' => 'Are you sure you want to force logout this device? The user will be logged out immediately.',
        'button_text' => 'Force Logout',
        'logout_completed' => 'Device logout completed successfully.',
    ],

    // Device Information
    'device_info' => [
        'device_name' => 'Device Name',
        'device_type' => 'Device Type',
        'ip_address' => 'IP Address',
        'location' => 'Location',
        'last_seen' => 'Last Seen',
        'browser' => 'Browser',
        'platform' => 'Platform',
        'status' => 'Status',
        'created_at' => 'First Login',
        'active' => 'Active',
        'inactive' => 'Inactive',
        'unknown_device' => 'Unknown Device',
        'unknown_location' => 'Unknown Location',
    ],

    // Device Actions
    'actions' => [
        'enable_device_lock' => 'Enable Device Lock',
        'disable_device_lock' => 'Disable Device Lock',
        'reset_device' => 'Reset Device',
        'view_devices' => 'View Devices',
        'view_device_history' => 'View Device History',
        'remove_device' => 'Remove Device',
        'trust_device' => 'Trust Device',
        'untrust_device' => 'Untrust Device',
    ],

    // Device Statistics
    'statistics' => [
        'total_devices' => 'Total Devices',
        'active_sessions' => 'Active Sessions',
        'device_records' => 'Device Records',
        'trusted_devices' => 'Trusted Devices',
        'recent_logins' => 'Recent Logins',
    ],

    // Error Messages
    'errors' => [
        'device_not_found' => 'Device not found',
        'user_not_found' => 'User not found',
        'invalid_device_id' => 'Invalid device ID',
        'device_reset_failed' => 'Failed to reset user device',
        'device_toggle_failed' => 'Failed to toggle device setting',
        'unauthorized_device_access' => 'Unauthorized device access',
        'device_limit_exceeded' => 'Device limit exceeded',
        'device_blocked' => 'Device access blocked',
    ],

    // Login Messages
    'login' => [
        'device_blocked_title' => 'Device Access Blocked',
        'device_blocked_message' => 'Your account is currently active on another device. Please contact your administrator to reset device access.',
        'new_device_detected' => 'New device detected',
        'login_from_new_device' => 'Login detected from new device',
        'device_registered' => 'Device registered successfully',
        'max_devices_reached' => 'Maximum number of devices reached',
    ],

    // Validation Messages
    'validation' => [
        'user_id_required' => 'User ID is required',
        'user_id_exists' => 'The selected user does not exist',
        'enabled_required' => 'Enabled field is required',
        'enabled_boolean' => 'Enabled field must be true or false',
        'device_id_required' => 'Device ID is required',
        'device_id_string' => 'Device ID must be a string',
    ],
];
