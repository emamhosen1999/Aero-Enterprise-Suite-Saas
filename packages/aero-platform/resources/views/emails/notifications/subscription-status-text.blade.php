Subscription {{ $status ?? 'Updated' }}

Hello {{ $tenant_name ?? 'there' }},

Status: {{ $status ?? 'Active' }}

{{ $message ?? 'Your subscription has been updated.' }}

@if(isset($old_plan) && isset($new_plan))
PREVIOUS PLAN: {{ $old_plan }} - {{ $old_price ?? '$0' }}
NEW PLAN: {{ $new_plan }} - {{ $new_price ?? '$0' }}
@endif

Subscription Details:
@if(isset($effective_date))
- Effective Date: {{ $effective_date }}
@endif
@if(isset($billing_cycle))
- Billing Cycle: {{ $billing_cycle }}
@endif
@if(isset($next_billing_date))
- Next Billing Date: {{ $next_billing_date }}
@endif

View Dashboard: {{ $dashboard_url ?? '#' }}

Questions about your subscription? Contact Support: {{ $support_url ?? '#' }}

---
© {{ date('Y') }} {{ $company_name ?? $app_name ?? 'Company' }}. All rights reserved.
{{ $app_url ?? '' }}
