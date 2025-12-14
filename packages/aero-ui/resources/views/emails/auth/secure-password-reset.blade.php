@component('mail::message')
# Secure Password Reset Request

Hello {{ $user->name }},

We received a request to reset your password for your {{ config('app.name') }} account.

## Security Details
- **Request Time:** {{ $timestamp }}
- **IP Address:** {{ $ipAddress }}
- **Location:** {{ $location ?? 'Unknown' }}
- **Browser:** {{ $userAgent }}

## One-Time Password (OTP)

Your secure OTP is: **{{ $otp }}**

This OTP will expire in **15 minutes** and can only be used once.

@component('mail::button', ['url' => $resetUrl])
Reset Password
@endcomponent

## Security Notice

If you did not request this password reset:
1. **Do not use this OTP**
2. **Change your password immediately**
3. **Contact our security team**

@component('mail::panel')
**Important Security Information:**
- This OTP is single-use only
- The link expires in 15 minutes
- Never share your OTP with anyone
- We will never ask for your password via email
@endcomponent

## Need Help?

If you're having trouble with the button above, copy and paste the URL below into your web browser:
{{ $resetUrl }}

For security concerns, contact us at: {{ config('mail.security_email', 'security@company.com') }}

Best regards,<br>
{{ config('app.name') }} Security Team

---
<small>This is an automated security message. If you believe this email was sent in error, please contact our support team immediately.</small>
@endcomponent
