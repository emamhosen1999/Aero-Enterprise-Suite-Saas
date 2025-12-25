{{ $quota_type ?? 'Quota' }} Usage Warning

Hello {{ $tenant_name ?? 'there' }},

Your {{ $quota_type }} usage has reached {{ $percentage }}% of your plan limit.

Current Usage: {{ $current_usage ?? 'N/A' }}
Quota Limit: {{ $quota_limit ?? 'N/A' }}

@if($percentage >= 100)
IMPORTANT: You have exceeded your quota limit. Some features may be restricted until you upgrade your plan or reduce usage.
@elseif($percentage >= 95)
ACTION REQUIRED: You're very close to reaching your limit. Consider upgrading your plan to avoid service interruptions.
@elseif($percentage >= 90)
Please review your usage and consider upgrading your plan to ensure uninterrupted service.
@else
This is a friendly reminder to help you manage your resources effectively.
@endif

Upgrade Your Plan: {{ $upgrade_url ?? '#' }}

Need help? Contact Support: {{ $support_url ?? '#' }}

---
© {{ date('Y') }} {{ $company_name ?? $app_name ?? 'Company' }}. All rights reserved.
{{ $app_url ?? '' }}
