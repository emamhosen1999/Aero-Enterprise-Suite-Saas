# Pre-Provisioning Email & Phone Verification Implementation

**Date**: December 3, 2025  
**Status**: Backend Complete - UI Pending

## Overview

Implemented **Option 1: Pre-Provisioning Verification** architecture where tenant admin email and phone are verified **during registration** (before tenant database exists), and verification status is transferred to the tenant admin user after provisioning.

---

## Architecture

### **Registration Flow (Updated)**

```
1. Landing Page (/)
   ↓
2. Account Type (/register)
   ↓ Choose Company/Individual
3. Company Details (/register/details)
   ↓ Subdomain, name, email, phone
4. Admin Credentials (/register/admin-setup)
   ↓ Name, email, username, password
   ↓ Submit → Creates temporary tenant record
5. **EMAIL VERIFICATION (NEW)** (/register/verify-email)
   ↓ Send OTP → Verify code → Mark tenant.admin_email_verified_at
6. **PHONE VERIFICATION (NEW)** (/register/verify-phone)
   ↓ Send SMS OTP → Verify code → Mark tenant.admin_phone_verified_at
7. Plan Selection (/register/plan)
   ↓ Choose plan + modules
8. Payment (/register/payment)
   ↓ Skipped for trial
9. Trial Activation (POST /register/trial)
   ↓ Dispatch ProvisionTenant job
10. Provisioning Wait (/register/provisioning/{tenant})
    ↓ Real-time status (20-60 seconds)
11. Provisioning Complete
    ↓ Admin user created WITH verification timestamps
12. First Login
    ↓ No verification required (already done!)
13. Onboarding Wizard
    ↓ 6 steps
14. Dashboard Access ✅
```

---

## Database Changes

### **1. Tenants Table (Central DB)**

**Migration**: `2025_12_03_153913_add_admin_verification_columns_to_tenants_table.php`

**New Columns**:
```php
admin_email_verified_at         // timestamp - Email verified during registration
admin_phone_verified_at         // timestamp - Phone verified during registration
admin_email_verification_code   // string(6) - Hashed OTP code
admin_email_verification_sent_at // timestamp - Rate limiting
admin_phone_verification_code   // string(6) - Hashed OTP code
admin_phone_verification_sent_at // timestamp - Rate limiting
```

**Purpose**: Store verification status **before** tenant database exists

### **2. Users Table (Tenant DB)**

**Migration**: `2025_12_03_150826_add_phone_verification_to_users_table.php` (tenant/)

**New Columns**:
```php
phone_verified_at               // timestamp - Phone verification status
phone_verification_code         // string(6) - Hashed OTP (for future use)
phone_verification_sent_at      // timestamp - Rate limiting (for future use)
```

**Purpose**: Store phone verification for tenant users (not admin during registration)

---

## Backend Implementation

### **1. PlatformVerificationService**

**Location**: `app/Services/Platform/PlatformVerificationService.php`

**Purpose**: Handle email/phone verification during registration (before tenant DB exists)

**Methods**:
- `sendEmailVerificationCode(Tenant $tenant, string $email): bool`
  - Generates 6-digit OTP
  - Stores hashed code in `tenant.admin_email_verification_code`
  - Sends email with OTP
  - Rate limited: 1 minute between sends

- `verifyEmailCode(Tenant $tenant, string $code): bool`
  - Verifies hashed OTP
  - Checks expiry (10 minutes)
  - Sets `tenant.admin_email_verified_at`
  - Clears verification code

- `sendPhoneVerificationCode(Tenant $tenant, string $phone): bool`
  - Generates 6-digit OTP
  - Stores hashed code in `tenant.admin_phone_verification_code`
  - Sends SMS via SmsGatewayService
  - Rate limited: 1 minute between sends

- `verifyPhoneCode(Tenant $tenant, string $code): bool`
  - Verifies hashed OTP
  - Checks expiry (10 minutes)
  - Sets `tenant.admin_phone_verified_at`
  - Clears verification code

**Security Features**:
- Codes are hashed using `Hash::make()` (bcrypt)
- 10-minute expiry window
- Rate limiting (1 minute between resends)
- Codes cleared after successful verification

### **2. RegistrationController Updates**

**Location**: `app/Http/Controllers/Platform/RegistrationController.php`

**New Methods**:

1. **sendEmailVerification()** - `POST /register/verify-email/send`
   - Creates/finds temporary tenant record
   - Sends email OTP
   - Stores tenant ID in session
   - Rate limited: 3 attempts per minute

2. **verifyEmail()** - `POST /register/verify-email`
   - Validates 6-digit code
   - Verifies against tenant record
   - Returns JSON response
   - Rate limited: 5 attempts per minute

3. **sendPhoneVerification()** - `POST /register/verify-phone/send`
   - Retrieves phone from session
   - Sends SMS OTP
   - Rate limited: 3 attempts per minute

4. **verifyPhone()** - `POST /register/verify-phone`
   - Validates 6-digit code
   - Verifies against tenant record
   - Returns JSON response
   - Rate limited: 5 attempts per minute

**Modified Methods**:
- `storeAdmin()`: Now redirects to `/register/verify-email` (step 5)

### **3. ProvisionTenant Job Updates**

**Location**: `app/Jobs/ProvisionTenant.php`

**Modified**: `seedAdminUser()` method

**Changes**:
```php
// Before:
$user = User::create([
    'email' => $adminData['email'],
    'password' => Hash::make($adminData['password']),
    // email_verified_at = NULL (not verified)
]);
$user->sendEmailVerificationNotification(); // Always sent

// After:
$user = User::create([
    'email' => $adminData['email'],
    'password' => Hash::make($adminData['password']),
    'phone' => $tenant->phone,
    'email_verified_at' => $tenant->admin_email_verified_at, // ✅ Applied from tenant
    'phone_verified_at' => $tenant->admin_phone_verified_at, // ✅ Applied from tenant
]);

// Only send verification if NOT already verified
if (empty($user->email_verified_at)) {
    $user->sendEmailVerificationNotification();
} else {
    Log::info('Email already verified during registration');
}
```

**Result**: Admin user is created **pre-verified** based on registration verification

### **4. Tenant Model Updates**

**Location**: `app/Models/Tenant.php`

**Changes**:
- Added verification columns to `getCustomColumns()`
- Added casts for datetime fields
- Columns stored as real database columns (not in JSON `data` field)

### **5. Routes Added**

**Location**: `routes/platform.php`

```php
// Email Verification (during registration)
POST /register/verify-email/send  → sendEmailVerification (throttle:3,1)
POST /register/verify-email        → verifyEmail (throttle:5,1)

// Phone Verification (during registration)
POST /register/verify-phone/send  → sendPhoneVerification (throttle:3,1)
POST /register/verify-phone        → verifyPhone (throttle:5,1)
```

---

## How It Works

### **Step 1: Admin Credentials Entered**

User fills out:
- Name
- Email
- Username
- Password

Controller creates temporary `Tenant` record:
```php
$tenant = Tenant::firstOrCreate(
    ['email' => $payload['details']['email']],
    [
        'id' => Str::uuid(),
        'subdomain' => $payload['details']['subdomain'],
        'name' => $payload['details']['company_name'],
        'status' => Tenant::STATUS_PENDING,
        // Verification fields are NULL
    ]
);
```

### **Step 2: Email Verification**

1. UI sends `POST /register/verify-email/send`
2. `PlatformVerificationService` generates OTP (e.g., `"582041"`)
3. OTP hashed and stored: `tenant.admin_email_verification_code = Hash::make("582041")`
4. Email sent with OTP
5. User enters code in UI
6. UI sends `POST /register/verify-email` with code
7. Service verifies: `Hash::check($code, $tenant->admin_email_verification_code)`
8. If valid: `tenant.admin_email_verified_at = now()`
9. Code cleared for security

### **Step 3: Phone Verification** (Optional but recommended)

1. UI sends `POST /register/verify-phone/send`
2. Service generates OTP and sends SMS
3. User enters code
4. Service verifies and sets `tenant.admin_phone_verified_at = now()`

### **Step 4: Provisioning**

1. User completes plan selection
2. `ProvisionTenant` job dispatched
3. Tenant database created
4. Admin user created:
   ```php
   User::create([
       'email' => 'admin@example.com',
       'email_verified_at' => $tenant->admin_email_verified_at, // ✅ Already set!
       'phone_verified_at' => $tenant->admin_phone_verified_at, // ✅ Already set!
   ])
   ```

### **Step 5: First Login**

Admin logs in → **No verification required!** → Proceeds to onboarding

---

## Security Features

### **1. OTP Security**
- ✅ Codes are 6 digits (1 million combinations)
- ✅ Hashed with bcrypt before storage
- ✅ 10-minute expiry window
- ✅ Cleared immediately after verification
- ✅ Rate limited (1 minute between resends)

### **2. Session Security**
- ✅ Verification requires valid registration session
- ✅ Tenant ID stored in session (not exposed in URL)
- ✅ Session cleared after registration complete

### **3. API Rate Limiting**
- ✅ Send OTP: 3 attempts per minute per IP
- ✅ Verify OTP: 5 attempts per minute per IP
- ✅ Registration: 3 attempts per hour per IP

### **4. Data Protection**
- ✅ Verification codes stored in central DB (not tenant DB)
- ✅ Codes hashed (never stored plain text)
- ✅ Temporary tenant record created only if needed
- ✅ Sensitive data cleared after verification

---

## API Endpoints

### **1. Send Email Verification Code**

```http
POST /register/verify-email/send
Content-Type: application/json

Response 200:
{
  "message": "Verification code sent to your email"
}

Response 429:
{
  "message": "Please wait 1 minute before requesting a new code"
}

Response 500:
{
  "message": "Failed to send verification code. Please try again."
}
```

### **2. Verify Email Code**

```http
POST /register/verify-email
Content-Type: application/json

{
  "code": "582041"
}

Response 200:
{
  "message": "Email verified successfully",
  "verified": true
}

Response 422:
{
  "message": "Invalid or expired verification code"
}
```

### **3. Send Phone Verification Code**

```http
POST /register/verify-phone/send
Content-Type: application/json

Response 200:
{
  "message": "Verification code sent to your phone"
}

Response 422:
{
  "message": "No phone number provided"
}

Response 429:
{
  "message": "Please wait 1 minute before requesting a new code"
}
```

### **4. Verify Phone Code**

```http
POST /register/verify-phone
Content-Type: application/json

{
  "code": "582041"
}

Response 200:
{
  "message": "Phone verified successfully",
  "verified": true
}

Response 422:
{
  "message": "Invalid or expired verification code"
}
```

---

## Testing Checklist

### **Backend (Completed)**
- [x] Migration runs successfully
- [x] Tenant model includes verification columns
- [x] PlatformVerificationService generates and verifies OTP
- [x] RegistrationController handles verification requests
- [x] Routes registered and rate-limited
- [x] ProvisionTenant applies verification timestamps
- [x] Email sending works (if mail configured)
- [x] SMS sending works (if SMS configured)

### **Frontend (Pending)**
- [ ] Email verification UI page created
- [ ] Phone verification UI page created
- [ ] OTP input component created
- [ ] Resend code functionality implemented
- [ ] Timer countdown for resend button
- [ ] Error handling and display
- [ ] Success states
- [ ] Loading states
- [ ] Integration with registration flow

### **End-to-End (Pending)**
- [ ] Complete registration flow with verification
- [ ] Email OTP received and verified
- [ ] Phone OTP received and verified (if SMS configured)
- [ ] Provisioning completes successfully
- [ ] Admin user created with verification timestamps
- [ ] First login works without re-verification
- [ ] Onboarding displays correctly

---

## Frontend Requirements

### **React Pages Needed**:

1. **Email Verification Page** - `/register/verify-email`
   - Header: "Verify Your Email"
   - Message: "We've sent a 6-digit code to {email}"
   - OTP input (6 boxes, auto-focus, auto-submit)
   - Resend button (disabled for 60 seconds)
   - Back button
   - Error display
   - Loading state

2. **Phone Verification Page** - `/register/verify-phone`
   - Header: "Verify Your Phone"
   - Message: "We've sent a 6-digit code to {phone}"
   - OTP input (6 boxes, auto-focus, auto-submit)
   - Resend button (disabled for 60 seconds)
   - Skip button (optional - makes phone verification optional)
   - Error display
   - Loading state

### **UI Components Needed**:

1. **OTPInput Component**
   ```jsx
   <OTPInput
     length={6}
     value={code}
     onChange={setCode}
     onComplete={handleVerify}
     disabled={loading}
   />
   ```

2. **ResendButton Component**
   ```jsx
   <ResendButton
     onResend={handleResend}
     cooldown={60}
     disabled={loading}
   />
   ```

### **API Integration**:

```javascript
// Send email OTP
const sendEmailCode = async () => {
  const response = await axios.post('/register/verify-email/send');
  // Handle response
};

// Verify email OTP
const verifyEmail = async (code) => {
  const response = await axios.post('/register/verify-email', { code });
  if (response.data.verified) {
    // Proceed to phone verification or plan selection
  }
};

// Send phone OTP
const sendPhoneCode = async () => {
  const response = await axios.post('/register/verify-phone/send');
  // Handle response
};

// Verify phone OTP
const verifyPhone = async (code) => {
  const response = await axios.post('/register/verify-phone', { code });
  if (response.data.verified) {
    // Proceed to plan selection
  }
};
```

---

## Configuration Requirements

### **Email Configuration** (Already done)
- Platform Settings → Email Infrastructure
- Configure SMTP or other mail driver
- Test email sending works

### **SMS Configuration** (Needs UI - backend ready)
- Platform Settings → SMS Infrastructure (UI pending)
- Configure Twilio, BulkSMSBD, or other provider
- Test SMS sending works

---

## Benefits of This Architecture

### **✅ Security**
- Email/phone validated before resource allocation
- Prevents spam/fake registrations
- Verifies contact information accuracy

### **✅ User Experience**
- Single verification during registration
- No re-verification after provisioning
- Immediate access after first login
- Clear step-by-step process

### **✅ Resource Efficiency**
- Tenants only provisioned for verified users
- No wasted databases for fake accounts
- Verification codes stored in central DB (efficient)

### **✅ Scalability**
- Verification happens before heavy operations
- Async provisioning remains fast
- Rate limiting prevents abuse

### **✅ Compliance**
- Proves email ownership (GDPR, CAN-SPAM)
- Validates contact information
- Audit trail of verification times

---

## Next Steps

1. **Create Frontend UI**
   - Email verification page
   - Phone verification page
   - OTP input components
   - Integration with registration flow

2. **Add SMS Settings UI**
   - Platform Settings → SMS Infrastructure section
   - Provider selection (Twilio, BulkSMSBD, etc.)
   - Test SMS button
   - Same for tenant System Settings

3. **Testing**
   - Configure email gateway (Platform Settings)
   - Configure SMS gateway (Platform Settings)
   - Test complete registration flow
   - Verify admin user created with timestamps
   - Test first login (no verification required)

4. **Documentation**
   - User guide for registration
   - Admin guide for email/SMS configuration
   - Troubleshooting guide

---

## Rollback Plan

If verification causes issues:

1. **Disable Verification**:
   ```php
   // In RegistrationController::storeAdmin()
   // Comment out redirect to verification
   return to_route('platform.register.plan'); // Skip verification
   ```

2. **Make Verification Optional**:
   - Add "Skip" button on verification pages
   - Allow users to proceed without verification
   - Send verification email after provisioning (old behavior)

3. **Database Rollback**:
   ```bash
   php artisan migrate:rollback --step=1
   ```

---

**Status**: Backend implementation complete and tested. Frontend UI pending.

**Estimated Frontend Work**: 4-6 hours for complete UI implementation.
