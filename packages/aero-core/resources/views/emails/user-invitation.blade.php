@component('mail::message')
# You've Been Invited!

Hello {{ $invitation->name }},

You have been invited by **{{ $invitedByName }}** to join **{{ $appName }}**.

@component('mail::button', ['url' => $acceptUrl, 'color' => 'primary'])
Accept Invitation
@endcomponent

## What happens next?

1. Click the button above to accept your invitation
2. Set up your password
3. Start using {{ $appName }}

## Invitation Details

- **Invited as:** {{ $invitation->name }}
- **Email:** {{ $invitation->email }}
@if(!empty($invitation->roles))
- **Assigned Role(s):** {{ implode(', ', $invitation->roles) }}
@endif

---

**This invitation will expire on {{ $expiresAt }}**

If the button doesn't work, copy and paste this link into your browser:

{{ $acceptUrl }}

---

If you did not expect this invitation, you can safely ignore this email.

Thanks,<br>
{{ $appName }}
@endcomponent
