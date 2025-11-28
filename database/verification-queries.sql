-- Device Tracking Verification Queries
-- Run these queries to verify FCM token-based device tracking is working correctly
-- Date: 2025-11-12

-- ===== QUERY 1: FCM Token Adoption Rate =====
-- Shows percentage of active devices using FCM tokens
-- Target: > 80% for good coverage
SELECT 
    COUNT(*) as total_active_devices,
    COUNT(CASE WHEN fcm_token IS NOT NULL THEN 1 END) as devices_with_fcm,
    ROUND(COUNT(CASE WHEN fcm_token IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as fcm_percentage
FROM user_devices
WHERE is_active = 1;

-- ===== QUERY 2: Device Identification Methods =====
-- Shows which identification method is being used for each device
-- FCM should be the most common
SELECT 
    CASE 
        WHEN fcm_token IS NOT NULL THEN '1. FCM Token (Best)'
        WHEN device_guid IS NOT NULL THEN '2. Device GUID'
        WHEN device_uuid IS NOT NULL THEN '3. Device UUID'
        WHEN device_mac IS NOT NULL THEN '4. MAC Address'
        ELSE '5. Fallback Only (Worst)'
    END as identification_method,
    COUNT(*) as device_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM user_devices WHERE is_active = 1), 2) as percentage
FROM user_devices
WHERE is_active = 1
GROUP BY identification_method
ORDER BY identification_method;

-- ===== QUERY 3: Single-Device Policy Violations =====
-- Should return 0 rows if system is working correctly
-- Any rows indicate users with multiple active devices despite single-device restriction
SELECT 
    u.id as user_id,
    u.name,
    u.email,
    u.single_device_login_enabled,
    COUNT(ud.id) as active_device_count,
    GROUP_CONCAT(ud.device_name SEPARATOR ', ') as devices
FROM users u
INNER JOIN user_devices ud ON u.id = ud.user_id
WHERE ud.is_active = 1
  AND u.single_device_login_enabled = 1
GROUP BY u.id, u.name, u.email, u.single_device_login_enabled
HAVING active_device_count > 1
ORDER BY active_device_count DESC;

-- ===== QUERY 4: Recent Device Registrations =====
-- Shows last 20 device registrations with their identification methods
SELECT 
    ud.id,
    u.email,
    ud.device_name,
    ud.browser_name,
    ud.platform,
    CASE 
        WHEN ud.fcm_token IS NOT NULL THEN 'FCM'
        WHEN ud.device_guid IS NOT NULL THEN 'GUID'
        WHEN ud.device_uuid IS NOT NULL THEN 'UUID'
        ELSE 'Fallback'
    END as primary_identifier,
    ud.fcm_token IS NOT NULL as has_fcm,
    ud.device_guid IS NOT NULL as has_guid,
    ud.is_active,
    ud.created_at,
    ud.last_activity
FROM user_devices ud
INNER JOIN users u ON u.id = ud.user_id
ORDER BY ud.created_at DESC
LIMIT 20;

-- ===== QUERY 5: Devices Without FCM but User Has FCM =====
-- Shows devices that need FCM token update
-- These should get updated on next login
SELECT 
    ud.id as device_id,
    u.id as user_id,
    u.email,
    ud.device_name,
    ud.fcm_token IS NULL as device_missing_fcm,
    u.fcm_token IS NOT NULL as user_has_fcm,
    SUBSTRING(u.fcm_token, 1, 20) as user_fcm_preview,
    ud.last_activity
FROM user_devices ud
INNER JOIN users u ON u.id = ud.user_id
WHERE ud.fcm_token IS NULL 
  AND u.fcm_token IS NOT NULL
  AND ud.is_active = 1
ORDER BY ud.last_activity DESC
LIMIT 20;

-- ===== QUERY 6: Cross-Account Device Collision Check =====
-- Verifies that same physical device gets different IDs for different users
-- Should show different device_id for each user even with same FCM token
SELECT 
    ud.fcm_token,
    COUNT(DISTINCT ud.user_id) as unique_users,
    COUNT(DISTINCT ud.device_id) as unique_device_ids,
    COUNT(DISTINCT ud.compatible_device_id) as unique_compatible_ids,
    GROUP_CONCAT(DISTINCT u.email SEPARATOR ', ') as users,
    CASE 
        WHEN COUNT(DISTINCT ud.user_id) = COUNT(DISTINCT ud.device_id) THEN '✅ SECURE'
        ELSE '❌ COLLISION DETECTED'
    END as security_status
FROM user_devices ud
INNER JOIN users u ON u.id = ud.user_id
WHERE ud.fcm_token IS NOT NULL
GROUP BY ud.fcm_token
HAVING unique_users > 1
ORDER BY unique_users DESC;

-- ===== QUERY 7: Device Stability Analysis =====
-- Shows how often devices are being recreated vs reactivated
-- High recreation rate indicates identification issues
SELECT 
    u.id as user_id,
    u.email,
    u.single_device_login_enabled,
    COUNT(ud.id) as total_devices,
    COUNT(CASE WHEN ud.is_active = 1 THEN 1 END) as active_devices,
    COUNT(CASE WHEN ud.is_active = 0 THEN 1 END) as inactive_devices,
    MAX(ud.last_activity) as last_login,
    CASE 
        WHEN COUNT(ud.id) > 5 THEN '⚠️ Too Many Devices'
        WHEN COUNT(ud.id) = 1 THEN '✅ Stable'
        ELSE '✓ Normal'
    END as stability_status
FROM users u
INNER JOIN user_devices ud ON u.id = ud.user_id
WHERE u.single_device_login_enabled = 1
GROUP BY u.id, u.email, u.single_device_login_enabled
ORDER BY total_devices DESC
LIMIT 20;

-- ===== QUERY 8: Single vs Multi-Device Users =====
-- Overview of single-device login enforcement
SELECT 
    single_device_login_enabled,
    COUNT(DISTINCT u.id) as user_count,
    COUNT(ud.id) as total_devices,
    ROUND(AVG(device_count), 2) as avg_devices_per_user,
    SUM(CASE WHEN ud.is_active = 1 THEN 1 ELSE 0 END) as active_devices
FROM users u
LEFT JOIN user_devices ud ON u.id = ud.user_id
LEFT JOIN (
    SELECT user_id, COUNT(*) as device_count
    FROM user_devices
    WHERE is_active = 1
    GROUP BY user_id
) dc ON u.id = dc.user_id
GROUP BY single_device_login_enabled
ORDER BY single_device_login_enabled DESC;

-- ===== QUERY 9: Locked Out Users =====
-- Users who might be locked out (no active devices but have single-device enabled)
SELECT 
    u.id,
    u.name,
    u.email,
    u.single_device_login_enabled,
    COUNT(ud.id) as total_devices,
    COUNT(CASE WHEN ud.is_active = 1 THEN 1 END) as active_devices,
    MAX(ud.last_activity) as last_device_activity,
    CASE 
        WHEN COUNT(CASE WHEN ud.is_active = 1 THEN 1 END) = 0 THEN '🔒 Likely Locked Out'
        ELSE '✓ Has Active Device'
    END as status
FROM users u
LEFT JOIN user_devices ud ON u.id = ud.user_id
WHERE u.single_device_login_enabled = 1
GROUP BY u.id, u.name, u.email, u.single_device_login_enabled
HAVING active_devices = 0 AND total_devices > 0
ORDER BY last_device_activity DESC;

-- ===== QUERY 10: FCM Token to User Table Sync Status =====
-- Compares FCM tokens between users table and user_devices table
SELECT 
    u.id as user_id,
    u.email,
    u.fcm_token IS NOT NULL as user_has_fcm,
    ud.fcm_token IS NOT NULL as device_has_fcm,
    CASE 
        WHEN u.fcm_token IS NOT NULL AND ud.fcm_token IS NOT NULL THEN '✅ Synced'
        WHEN u.fcm_token IS NOT NULL AND ud.fcm_token IS NULL THEN '⚠️ Needs Device Update'
        WHEN u.fcm_token IS NULL AND ud.fcm_token IS NOT NULL THEN '⚠️ Needs User Update'
        ELSE '❌ No FCM Token'
    END as sync_status,
    ud.last_activity
FROM users u
LEFT JOIN user_devices ud ON u.id = ud.user_id AND ud.is_active = 1
WHERE u.id IN (
    SELECT DISTINCT user_id 
    FROM user_devices 
    WHERE last_activity > DATE_SUB(NOW(), INTERVAL 7 DAY)
)
ORDER BY ud.last_activity DESC
LIMIT 20;

-- ===== INSTRUCTIONS =====
-- 1. Run these queries in your MySQL client (phpMyAdmin, MySQL Workbench, etc.)
-- 2. Query 3 should return 0 rows (no violations)
-- 3. Query 1 should show high FCM percentage (target: > 80%)
-- 4. Query 6 should show "SECURE" status for all rows
-- 5. Query 9 should help identify users who might need device reset
--
-- If any issues are found:
-- - Run: DELETE FROM user_devices WHERE user_id = AFFECTED_USER_ID;
-- - Ask user to login again to re-register device with FCM token
