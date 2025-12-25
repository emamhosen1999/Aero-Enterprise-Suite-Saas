<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Failed - Action Required</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f7; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: {{ $border_radius ?? '12px' }}; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ef4444, #dc2626); padding: 40px 30px; text-align: center; color: white; }
        .header img { max-width: 150px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .alert-box { background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .payment-details { background: #f9fafb; padding: 25px; border-radius: 12px; margin: 30px 0; }
        .detail-row { display: flex; justify-content: space-between; margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .detail-label { color: #6b7280; font-weight: 500; }
        .detail-value { font-weight: 600; color: #1f2937; }
        .cta-button { display: inline-block; background: {{ $primary_color ?? '#3b82f6' }}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        .help-box { background: #eff6ff; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid {{ $primary_color ?? '#3b82f6' }}; }
        .footer { background: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
        .footer a { color: {{ $primary_color ?? '#3b82f6' }}; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            @if(!empty($logo_url))
                <img src="{{ $logo_url }}" alt="{{ $app_name ?? 'App' }}">
            @endif
            <h1>🚨 Payment Failed</h1>
        </div>
        
        <div class="content">
            <div class="alert-box">
                <strong>Action Required:</strong> We were unable to process your payment. Please update your payment method to avoid service interruption.
            </div>

            <p>Hello {{ $tenant_name ?? 'there' }},</p>
            
            <p>We attempted to charge your payment method but the transaction failed. Your account will remain active for <strong>{{ $grace_period ?? '10' }} days</strong> while we retry the payment.</p>

            <div class="payment-details">
                <h3 style="margin-top: 0;">Payment Details</h3>
                <div class="detail-row">
                    <div class="detail-label">Amount:</div>
                    <div class="detail-value">{{ $amount ?? '$0.00' }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Payment Method:</div>
                    <div class="detail-value">{{ $payment_method ?? 'N/A' }} ending in {{ $last_four ?? '****' }}</div>
                </div>
                <div class="detail-row">
                    <div class="detail-label">Attempt Date:</div>
                    <div class="detail-value">{{ $attempt_date ?? date('M d, Y') }}</div>
                </div>
                @if(!empty($next_retry))
                <div class="detail-row">
                    <div class="detail-label">Next Retry:</div>
                    <div class="detail-value">{{ $next_retry }}</div>
                </div>
                @endif
            </div>

            <center>
                <a href="{{ $billing_url ?? '#' }}" class="cta-button">
                    Update Payment Method
                </a>
            </center>

            <div class="help-box">
                <strong>Common Reasons for Payment Failure:</strong>
                <ul style="margin: 15px 0; padding-left: 20px;">
                    <li>Insufficient funds in your account</li>
                    <li>Expired card or incorrect card details</li>
                    <li>Card declined by your bank</li>
                    <li>Billing address mismatch</li>
                </ul>
                <p style="margin-bottom: 0;">If you continue to experience issues, please <a href="{{ $support_url ?? '#' }}" style="color: {{ $primary_color ?? '#3b82f6' }};">contact support</a>.</p>
            </div>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                <strong>Important:</strong> If we're unable to process payment within {{ $grace_period ?? '10' }} days, your account will be suspended.
            </p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} {{ $company_name ?? $app_name ?? 'Company' }}. All rights reserved.</p>
            <p>
                <a href="{{ $app_url ?? '#' }}">Visit Dashboard</a> |
                <a href="{{ $billing_url ?? '#' }}">Billing Settings</a> |
                <a href="{{ $support_url ?? '#' }}">Contact Support</a>
            </p>
        </div>
    </div>
</body>
</html>
