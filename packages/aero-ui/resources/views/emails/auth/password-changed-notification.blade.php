@component('mail::message')
# Password Successfully Changed

Hello {{ $user->name }},

Your password has been successfully changed for your {{ config('app.name') }} account.

## Change Details
- **Change Time:** {{ $timestamp }}
- **IP Address:** {{ $ipAddress }}
- **Location:** {{ $location ?? 'Unknown' }}
- **Browser:** {{ $userAgent }}

@component('mail::panel')
**Security Confirmation:**
✅ Password change completed successfully<br>
✅ All active sessions have been terminated<br>
✅ Security audit log updated<br>
@endcomponent

## Security Actions Taken

For your security, we have automatically:
- Logged you out of all devices
- Invalidated all remember tokens
- Updated your security audit log
- Sent this confirmation email

## Did You Make This Change?

If **you** changed your password, no further action is needed.

If you **did not** change your password:

@component('mail::button', ['url' => $supportUrl ?? '#'])
Report Security Issue
@endcomponent

@component('mail::panel')
**⚠️ Immediate Actions Required:**
1. Contact our security team immediately
2. Check for unauthorized account access
3. Review recent account activity
4. Consider enabling 2FA if not already active
@endcomponent

## Account Security Tips

- Use a unique, strong password
- Enable two-factor authentication
- Regularly review account activity
- Never share your login credentials

For immediate security assistance, contact us at: {{ config('mail.security_email', 'security@company.com') }}

Best regards,<br>
{{ config('app.name') }} Security Team

---
<small>This is an automated security notification. If you have concerns about this change, please contact our support team immediately.</small>
@endcomponent
