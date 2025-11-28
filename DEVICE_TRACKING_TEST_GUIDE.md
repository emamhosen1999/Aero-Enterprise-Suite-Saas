# Device Tracking with FCM Token - Testing & Verification Guide

## 🎯 System Overview

The single device login system now uses a **priority-based identification** with FCM tokens as the most stable identifier:

```
Priority 1: FCM Token (Firebase Cloud Messaging) ← HIGHEST PRIORITY
Priority 2: Device GUID (localStorage UUID)
Priority 3: Device UUID (hardware identifier)
Priority 4: MAC Address (network identifier)
Priority 5: Browser Fingerprint (fallback)
```

## 🔄 Complete Flow

### 1. User Opens Application
```
App.jsx loads → initializeDeviceIdentification() called
↓
Device GUID generated/retrieved from localStorage
↓
Firebase initialized (App.jsx) → initFirebase() called
↓
FCM token requested from Firebase
↓
FCM token stored in:
  - localStorage ('fcm_token')
  - Users table (via /update-fcm-token route)
```

### 2. User Logs In
```
Login.jsx form submission
↓
getDeviceGuid() → UUID from localStorage
getFcmToken() → Token from localStorage
getDeviceHeaders() → Browser headers
↓
POST /login with payload:
{
  "email": "user@example.com",
  "password": "******",
  "remember": true,
  "device_guid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "fcm_token": "cXpvN2x..." or null
}
↓
Headers:
  X-Device-GUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  X-FCM-Token: cXpvN2x... or null
  X-Device-Headers: {...}
```

### 3. Backend Processing
```
LoginController receives request
↓
DeviceTrackingService::generateDeviceId()
  Priority 1: Check FCM token → hash('sha256', 'fcm:'.$fcmToken)
  Priority 2: Check Device GUID → hash('sha256', 'guid:'.$deviceGuid)
  Priority 3: Check Device UUID → hash('sha256', 'uuid:'.$deviceUuid)
  Priority 4: Check MAC Address → hash('sha256', 'mac:'.$deviceMac)
  Priority 5: Fallback to User-Agent → hash('sha256', 'fallback:'.$userAgent)
↓
DeviceTrackingService::canUserLoginFromDevice()
  Check if user has single_device_login_enabled
  If YES:
    - Check for existing device with same device_id
    - Check for compatible_device_id
    - If device found: ALLOW (reactivate if inactive)
    - If different device: BLOCK (show device blocking alert)
  If NO:
    - ALLOW (track device but don't enforce)
↓
If ALLOWED:
  DeviceTrackingService::registerDevice()
    - Falls back to user.fcm_token if not in request
    - Saves device with all identifiers:
      * fcm_token
      * device_guid
      * device_uuid
      * device_mac
      * Other metadata
```

### 4. Subsequent Logins (Same Device)
```
User logs in from same browser/device
↓
FCM token (SAME) → device_id calculated
↓
Backend finds existing device with matching device_id
↓
Device reactivated (is_active = 1)
↓
Login SUCCESS ✅
```

### 5. Attempted Login (Different Device)
```
User tries to login from different browser/device
↓
FCM token (DIFFERENT) → device_id calculated
↓
Backend finds existing device (different device_id)
↓
Single device policy violated
↓
Login BLOCKED ❌
↓
Show device blocking alert with info about active device
```

## 🧪 Testing Scenarios

### Scenario 1: First Time Login with FCM Token

**Setup:**
- New user or cleared devices
- Browser notifications enabled
- FCM token available

**Steps:**
1. Open application
2. Check console: `Device identification initialized`
3. Check localStorage: `fcm_token` should exist
4. Login with credentials

**Expected Results:**
- ✅ Login successful
- ✅ Device registered in `user_devices` table
- ✅ `fcm_token` column populated
- ✅ `device_guid` column populated
- ✅ `is_active` = 1

**Verification Query:**
```sql
SELECT 
    id,
    user_id,
    device_name,
    fcm_token,
    device_guid,
    is_active,
    last_activity
FROM user_devices
WHERE user_id = YOUR_USER_ID
ORDER BY created_at DESC
LIMIT 1;
```

Expected: 1 row with `fcm_token` populated.

---

### Scenario 2: Re-login Same Device (FCM Token Recognition)

**Setup:**
- Already logged in once from this device
- FCM token exists in localStorage
- Device exists in `user_devices` table

**Steps:**
1. Logout
2. Login again with same credentials

**Expected Results:**
- ✅ Login successful
- ✅ Same device record reactivated (not new record created)
- ✅ `last_activity` updated
- ✅ `is_active` = 1

**Verification Query:**
```sql
SELECT 
    COUNT(*) as device_count
FROM user_devices
WHERE user_id = YOUR_USER_ID
  AND is_active = 1;
```

Expected: `device_count` = 1 (same device, not duplicate)

---

### Scenario 3: Different Device Blocked (Single Device User)

**Setup:**
- User has `single_device_login_enabled` = 1
- Already logged in from Device A (Chrome)
- Now trying from Device B (Firefox)

**Steps:**
1. Open application in Firefox
2. Try to login with same user

**Expected Results:**
- ❌ Login blocked
- ❌ Device blocking alert shown
- ❌ Alert shows info about Device A (Chrome)
- ✅ User remains logged in on Device A

**Verification Query:**
```sql
SELECT 
    device_name,
    browser_name,
    fcm_token,
    is_active
FROM user_devices
WHERE user_id = YOUR_USER_ID
ORDER BY last_activity DESC;
```

Expected: Only 1 active device (Device A)

---

### Scenario 4: FCM Token as Primary Identifier

**Setup:**
- Same physical device, same browser
- Clear cookies/localStorage EXCEPT `fcm_token`
- Device GUID regenerated (new UUID)

**Steps:**
1. Clear `device_guid` from localStorage
2. Refresh page (new GUID generated)
3. Login

**Expected Results:**
- ✅ Login successful (recognized by FCM token)
- ✅ Same device record updated (not new device created)
- ✅ `device_guid` updated to new value
- ✅ `fcm_token` remains same

**Why It Works:**
- Backend prioritizes FCM token over Device GUID
- `generateDeviceId()` checks FCM token first
- Same FCM token = same `device_id` hash
- Existing device found and reactivated

**Verification Query:**
```sql
SELECT 
    fcm_token,
    device_guid,
    device_id,
    last_activity
FROM user_devices
WHERE user_id = YOUR_USER_ID
ORDER BY last_activity DESC
LIMIT 1;
```

Expected: `device_guid` updated but record not duplicated.

---

### Scenario 5: Fallback Without FCM Token

**Setup:**
- Notifications permission denied
- FCM token = null
- Device GUID available

**Steps:**
1. Block notifications in browser
2. Login

**Expected Results:**
- ✅ Login successful (falls back to Device GUID)
- ✅ Device registered with `fcm_token` = NULL
- ✅ Device GUID used as primary identifier
- ⚠️ Less stable (GUID can be cleared)

**Verification Query:**
```sql
SELECT 
    fcm_token IS NULL as no_fcm,
    device_guid IS NOT NULL as has_guid,
    device_id
FROM user_devices
WHERE user_id = YOUR_USER_ID
ORDER BY created_at DESC
LIMIT 1;
```

Expected: `no_fcm` = 1, `has_guid` = 1

---

### Scenario 6: Cross-Account Security Test

**Setup:**
- User A logged in from Chrome
- User B tries to login from same Chrome

**Steps:**
1. Login as User A
2. Logout
3. Login as User B (same browser)

**Expected Results:**
- ✅ User B login successful
- ✅ User B gets DIFFERENT device_id than User A
- ✅ No cross-account device collision
- ✅ Each user has separate device record

**Why It Works:**
- `generateCompatibleDeviceId()` includes `user_id` in hash
- Same FCM token + different user_id = different device_id
- Prevents cross-account device reuse

**Verification Query:**
```sql
SELECT 
    u.id as user_id,
    u.email,
    ud.device_id,
    ud.fcm_token
FROM user_devices ud
INNER JOIN users u ON u.id = ud.user_id
WHERE ud.fcm_token IS NOT NULL
  AND u.id IN (USER_A_ID, USER_B_ID)
ORDER BY ud.created_at DESC;
```

Expected: Different `device_id` for User A and User B despite same FCM token.

---

### Scenario 7: Multi-Device User (No Restriction)

**Setup:**
- User has `single_device_login_enabled` = 0
- Login from multiple devices

**Steps:**
1. Login from Chrome
2. Login from Firefox (without logging out)
3. Login from Mobile

**Expected Results:**
- ✅ All logins successful
- ✅ All devices tracked in `user_devices`
- ✅ All devices remain active simultaneously
- ✅ No device blocking

**Verification Query:**
```sql
SELECT 
    device_name,
    browser_name,
    platform,
    is_active,
    last_activity
FROM user_devices
WHERE user_id = YOUR_USER_ID
ORDER BY last_activity DESC;
```

Expected: Multiple active devices (is_active = 1 for all)

---

## 🔍 Debugging Tools

### Check Device Identification in Browser Console

```javascript
// 1. Check Device GUID
console.log('Device GUID:', localStorage.getItem('device_guid'));

// 2. Check FCM Token
console.log('FCM Token:', localStorage.getItem('fcm_token'));

// 3. Check if Firebase is initialized
console.log('Notification Permission:', Notification.permission);

// 4. Manually test device identification
import { getDeviceGuid, getFcmToken } from '@/services/deviceIdentification';
console.log('GUID:', getDeviceGuid());
console.log('FCM Token:', getFcmToken());
```

### Check Backend Device ID Generation

Add temporary logging in `DeviceTrackingService.php`:

```php
public function generateDeviceId(Request $request): string
{
    $fcmToken = $request->header('X-FCM-Token')
        ?? $request->input('fcm_token')
        ?? $request->cookie('fcm_token');

    Log::info('Device ID Generation', [
        'fcm_token_present' => !empty($fcmToken),
        'fcm_token_length' => $fcmToken ? strlen($fcmToken) : 0,
        'device_guid_present' => !empty($request->input('device_guid')),
    ]);

    if ($fcmToken) {
        return hash('sha256', 'fcm:'.$fcmToken);
    }
    // ... rest of priority checks
}
```

Check logs: `storage/logs/laravel.log`

### Database Inspection Queries

**1. Find devices by FCM token:**
```sql
SELECT 
    ud.id,
    ud.user_id,
    u.email,
    ud.device_name,
    ud.fcm_token,
    ud.device_guid,
    ud.is_active,
    ud.last_activity
FROM user_devices ud
INNER JOIN users u ON u.id = ud.user_id
WHERE ud.fcm_token IS NOT NULL
ORDER BY ud.last_activity DESC
LIMIT 20;
```

**2. Find users with multiple active devices (should be 0 for single-device users):**
```sql
SELECT 
    u.id,
    u.email,
    u.single_device_login_enabled,
    COUNT(ud.id) as active_devices
FROM users u
INNER JOIN user_devices ud ON u.id = ud.user_id
WHERE ud.is_active = 1
GROUP BY u.id, u.email, u.single_device_login_enabled
HAVING active_devices > 1 AND u.single_device_login_enabled = 1;
```

Expected: 0 rows (no single-device users with multiple active devices)

**3. Check FCM token distribution:**
```sql
SELECT 
    CASE 
        WHEN fcm_token IS NOT NULL THEN 'FCM Token'
        WHEN device_guid IS NOT NULL THEN 'Device GUID'
        WHEN device_uuid IS NOT NULL THEN 'Device UUID'
        ELSE 'Fallback Only'
    END as identifier_type,
    COUNT(*) as device_count
FROM user_devices
GROUP BY identifier_type
ORDER BY device_count DESC;
```

**4. Find devices that might need FCM token update:**
```sql
SELECT 
    ud.id,
    ud.user_id,
    u.email,
    u.fcm_token as user_fcm_token,
    ud.fcm_token as device_fcm_token,
    ud.device_guid,
    ud.last_activity
FROM user_devices ud
INNER JOIN users u ON u.id = ud.user_id
WHERE ud.fcm_token IS NULL 
  AND u.fcm_token IS NOT NULL
ORDER BY ud.last_activity DESC
LIMIT 20;
```

These devices have FCM token in user table but not in device table (should get updated on next login).

---

## ✅ Success Criteria

The system is working correctly if:

1. ✅ **FCM Token Priority**: Devices with FCM tokens are identified by FCM token, not Device GUID
2. ✅ **Stable Re-login**: Same device re-login works without creating duplicate records
3. ✅ **Device Blocking Works**: Single-device users are blocked when trying to login from different device
4. ✅ **Cross-Account Security**: Different users on same physical device get different device IDs
5. ✅ **Graceful Fallback**: System works even when FCM token is null (falls back to Device GUID)
6. ✅ **No Duplicates**: Re-login from same device doesn't create new device records
7. ✅ **Multi-Device Support**: Users without single-device restriction can login from multiple devices
8. ✅ **Device Reactivation**: Inactive devices are reactivated on re-login (not recreated)

---

## 🚨 Common Issues & Solutions

### Issue 1: FCM Token Always Null

**Symptoms:**
- `localStorage.getItem('fcm_token')` returns null
- Device registration falls back to Device GUID

**Causes:**
1. Notifications permission denied
2. VAPID key incorrect
3. Firebase not initialized
4. HTTPS required (production only)

**Solutions:**
```javascript
// Check permission
console.log(Notification.permission); // Should be "granted"

// Manually request permission
Notification.requestPermission().then(permission => {
    console.log('Permission:', permission);
});

// Check VAPID key
console.log(import.meta.env.VITE_VAPID_KEY);

// Re-initialize Firebase
import { initFirebase } from '@/utils/firebaseInit';
await initFirebase();
```

### Issue 2: Multiple Active Devices for Single-Device User

**Symptoms:**
- Single-device user has multiple `is_active = 1` devices
- User can login from multiple devices

**Causes:**
1. Device identification not working (all devices get different IDs)
2. FCM tokens not being sent/received
3. Migration not applied

**Solutions:**
```sql
-- Check device identification
SELECT 
    user_id,
    device_id,
    fcm_token IS NOT NULL as has_fcm,
    device_guid IS NOT NULL as has_guid,
    COUNT(*) as duplicate_count
FROM user_devices
WHERE is_active = 1
GROUP BY user_id, device_id
HAVING duplicate_count > 1;

-- If duplicates exist, clear and re-register:
DELETE FROM user_devices WHERE user_id = AFFECTED_USER_ID;
-- User needs to login again
```

### Issue 3: Device Blocking Not Working

**Symptoms:**
- User can login from different devices
- No device blocking alert

**Causes:**
1. `single_device_login_enabled` not set for user
2. Device identification broken
3. Middleware not running

**Solutions:**
```sql
-- Check user setting
SELECT id, email, single_device_login_enabled 
FROM users 
WHERE id = USER_ID;

-- Enable if needed
UPDATE users 
SET single_device_login_enabled = 1 
WHERE id = USER_ID;

-- Check devices
SELECT * FROM user_devices WHERE user_id = USER_ID;
```

### Issue 4: Cross-Account Device Collision

**Symptoms:**
- User A gets blocked when User B logs in from same device
- Device IDs are shared across users

**Causes:**
- `user_id` not included in device hash (old version)
- Migration not applied

**Solutions:**
```php
// Verify generateCompatibleDeviceId includes user_id:
public function generateCompatibleDeviceId(Request $request, ?int $userId = null): string
{
    // Must include $userId in hash
    return hash('sha256', json_encode([
        'fcm_token' => $fcmToken,
        'user_id' => $userId, // ← THIS MUST BE PRESENT
    ]));
}
```

### Issue 5: Device GUID Changes on Every Page Load

**Symptoms:**
- Device GUID different every time
- Multiple device records for same device
- localStorage cleared frequently

**Causes:**
1. Browser in incognito/private mode
2. Cookie/storage being cleared
3. Browser extension interference

**Solutions:**
- Exit incognito mode
- Check browser settings (don't clear on exit)
- Disable extensions temporarily
- Use FCM token (more stable than GUID)

---

## 📊 Monitoring & Analytics

### Key Metrics to Track

1. **FCM Token Adoption Rate:**
```sql
SELECT 
    COUNT(CASE WHEN fcm_token IS NOT NULL THEN 1 END) * 100.0 / COUNT(*) as fcm_percentage
FROM user_devices
WHERE is_active = 1;
```

Target: > 80% of active devices have FCM tokens

2. **Device Identification Method Distribution:**
```sql
SELECT 
    CASE 
        WHEN fcm_token IS NOT NULL THEN 'FCM'
        WHEN device_guid IS NOT NULL THEN 'GUID'
        WHEN device_uuid IS NOT NULL THEN 'UUID'
        ELSE 'Fallback'
    END as method,
    COUNT(*) as count
FROM user_devices
WHERE is_active = 1
GROUP BY method;
```

3. **Single-Device Violations (should be 0):**
```sql
SELECT COUNT(*) as violations
FROM (
    SELECT user_id, COUNT(*) as device_count
    FROM user_devices ud
    INNER JOIN users u ON u.id = ud.user_id
    WHERE ud.is_active = 1 AND u.single_device_login_enabled = 1
    GROUP BY user_id
    HAVING device_count > 1
) as violations;
```

Target: 0 violations

4. **Average Device Lifetime:**
```sql
SELECT 
    AVG(TIMESTAMPDIFF(DAY, created_at, last_activity)) as avg_days_active
FROM user_devices
WHERE is_active = 0;
```

---

## 🎓 Understanding the System

### Why FCM Tokens Are Best

| Identifier | Stability | Persistence | Cross-Browser | Native App Support |
|------------|-----------|-------------|---------------|-------------------|
| FCM Token  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ✅ |
| Device GUID| ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ❌ | ✅ |
| Device UUID| ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ✅ |
| MAC Address| ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ⚠️ |
| User-Agent | ⭐ | ⭐⭐ | ✅ | ✅ |

### How Device Hashing Works

```php
// FCM Token-based device ID
$deviceId = hash('sha256', 'fcm:' . $fcmToken);
// Example: "a7f3c8e9..." (stable, unique per device/app)

// Compatible device ID (includes user_id)
$compatibleId = hash('sha256', json_encode([
    'fcm_token' => $fcmToken,
    'user_id' => $userId,
]));
// Example: "b4d9a1c7..." (prevents cross-account collision)
```

**Key Points:**
- Same FCM token → Same device_id
- Different user on same device → Different compatible_device_id
- FCM token changes rarely (app reinstall, cache clear)
- Device GUID changes more frequently (cookie/localStorage clear)

---

## ✅ Deployment Checklist

Before going live with FCM-based device tracking:

- [ ] Run migration: `php artisan migrate`
- [ ] Clear old devices: `php artisan devices:reset-for-security-update`
- [ ] Build frontend: `npm run build`
- [ ] Clear caches: `php artisan config:clear && php artisan cache:clear`
- [ ] Verify VAPID key in `.env`: `VITE_VAPID_KEY`
- [ ] Test FCM token generation in browser console
- [ ] Test single-device login with FCM-identified device
- [ ] Test device blocking with different browsers
- [ ] Test cross-account security (same device, different users)
- [ ] Verify no duplicate devices created on re-login
- [ ] Monitor logs for device identification errors
- [ ] Set up monitoring queries for violations
- [ ] Communicate changes to users (device reset required)

---

**Status:** ✅ FCM TOKEN-BASED DEVICE TRACKING ACTIVE
**Date:** 2025-11-12
**Priority Order:** FCM Token > Device GUID > Device UUID > MAC > User-Agent
**Security:** Cross-account collision prevented via user_id in hash
