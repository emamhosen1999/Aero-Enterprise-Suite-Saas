Your Trial is Ending Soon

Hello {{ $user_name ?? 'there' }},

Your free trial will end on {{ $trial_ends ?? 'soon' }}.

{{ $days_remaining ?? 'X' }} {{ $days_remaining == 1 ? 'Day' : 'Days' }} Remaining

Continue enjoying these benefits:
✓ Full access to all premium features
✓ Priority customer support
✓ Advanced analytics and reporting
✓ Unlimited team members

Upgrade Now: {{ $upgrade_url ?? '#' }}

Questions? Contact our team: {{ $support_url ?? '#' }}

---
© {{ date('Y') }} {{ $company_name ?? $app_name ?? 'Company' }}. All rights reserved.
{{ $app_url ?? '' }}
