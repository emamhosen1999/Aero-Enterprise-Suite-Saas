Payment Failed - Action Required

Hello {{ $tenant_name ?? 'there' }},

We were unable to process your payment. Please update your payment method to avoid service interruption.

Payment Details:
- Amount: {{ $amount ?? '$0.00' }}
- Payment Method: {{ $payment_method ?? 'Card' }} ending in {{ $last_four ?? '****' }}
- Attempt Date: {{ $attempt_date ?? date('M d, Y') }}
@if(!empty($next_retry))
- Next Retry: {{ $next_retry }}
@endif

Your account will remain active for {{ $grace_period ?? '10' }} days while we retry the payment.

Update Payment Method: {{ $billing_url ?? '#' }}

Common Reasons for Payment Failure:
• Insufficient funds in your account
• Expired card or incorrect card details
• Card declined by your bank
• Billing address mismatch

If you continue to experience issues, please contact support: {{ $support_url ?? '#' }}

IMPORTANT: If we're unable to process payment within {{ $grace_period ?? '10' }} days, your account will be suspended.

---
© {{ date('Y') }} {{ $company_name ?? $app_name ?? 'Company' }}. All rights reserved.
{{ $app_url ?? '' }}
