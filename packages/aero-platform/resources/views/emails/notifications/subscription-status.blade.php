<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription {{ $status ?? 'Updated' }}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f7; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: {{ $border_radius ?? '12px' }}; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, {{ $primary_color ?? '#3b82f6' }}, {{ $primary_color ?? '#2563eb' }}); padding: 40px 30px; text-align: center; color: white; }
        .header img { max-width: 150px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .status-badge { display: inline-block; padding: 10px 20px; border-radius: 20px; font-weight: 600; margin: 20px 0; }
        .status-badge.active { background: #d1fae5; color: #065f46; }
        .status-badge.cancelled { background: #fee2e2; color: #991b1b; }
        .status-badge.paused { background: #fef3c7; color: #92400e; }
        .plan-comparison { display: flex; justify-content: space-between; margin: 30px 0; gap: 20px; }
        .plan-box { flex: 1; padding: 25px; border-radius: 12px; border: 2px solid #e5e7eb; }
        .plan-box.old { background: #f9fafb; }
        .plan-box.new { background: #eff6ff; border-color: {{ $primary_color ?? '#3b82f6' }}; }
        .plan-name { font-size: 20px; font-weight: 700; margin-bottom: 10px; }
        .plan-price { font-size: 32px; font-weight: 700; color: {{ $primary_color ?? '#3b82f6' }}; margin: 15px 0; }
        .details-list { margin: 25px 0; }
        .detail-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
        .cta-button { display: inline-block; background: {{ $primary_color ?? '#3b82f6' }}; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
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
            <h1>{{ $subject ?? 'Subscription Updated' }}</h1>
        </div>
        
        <div class="content">
            <p>Hello {{ $tenant_name ?? 'there' }},</p>
            
            <center>
                <div class="status-badge {{ strtolower($status ?? 'active') }}">
                    Status: {{ $status ?? 'Active' }}
                </div>
            </center>

            <p>{{ $message ?? 'Your subscription has been updated.' }}</p>

            @if(isset($old_plan) && isset($new_plan))
            <div class="plan-comparison">
                <div class="plan-box old">
                    <div style="font-size: 12px; color: #6b7280; margin-bottom: 5px;">PREVIOUS PLAN</div>
                    <div class="plan-name">{{ $old_plan }}</div>
                    <div class="plan-price">{{ $old_price ?? '$0' }}</div>
                </div>
                <div class="plan-box new">
                    <div style="font-size: 12px; color: {{ $primary_color ?? '#3b82f6' }}; margin-bottom: 5px;">NEW PLAN</div>
                    <div class="plan-name">{{ $new_plan }}</div>
                    <div class="plan-price">{{ $new_price ?? '$0' }}</div>
                </div>
            </div>
            @endif

            <div class="details-list">
                <h3>Subscription Details</h3>
                @if(isset($effective_date))
                <div class="detail-item">
                    <div style="color: #6b7280;">Effective Date:</div>
                    <div style="font-weight: 600;">{{ $effective_date }}</div>
                </div>
                @endif
                @if(isset($billing_cycle))
                <div class="detail-item">
                    <div style="color: #6b7280;">Billing Cycle:</div>
                    <div style="font-weight: 600;">{{ $billing_cycle }}</div>
                </div>
                @endif
                @if(isset($next_billing_date))
                <div class="detail-item">
                    <div style="color: #6b7280;">Next Billing Date:</div>
                    <div style="font-weight: 600;">{{ $next_billing_date }}</div>
                </div>
                @endif
            </div>

            @if(isset($show_cta) && $show_cta)
            <center>
                <a href="{{ $dashboard_url ?? '#' }}" class="cta-button">
                    View Dashboard
                </a>
            </center>
            @endif

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                Questions about your subscription? <a href="{{ $support_url ?? '#' }}" style="color: {{ $primary_color ?? '#3b82f6' }};">Contact Support</a>
            </p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} {{ $company_name ?? $app_name ?? 'Company' }}. All rights reserved.</p>
            <p>
                <a href="{{ $app_url ?? '#' }}">Visit Dashboard</a> |
                <a href="{{ $billing_url ?? '#' }}">Billing Settings</a>
            </p>
        </div>
    </div>
</body>
</html>
