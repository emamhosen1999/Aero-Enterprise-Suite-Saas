<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $quota_type ?? 'Quota' }} Usage Warning</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f7; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: {{ $border_radius ?? '12px' }}; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, {{ $primary_color ?? '#3b82f6' }}, {{ $primary_color ?? '#2563eb' }}); padding: 40px 30px; text-align: center; color: white; }
        .header img { max-width: 150px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .alert-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .alert-box.critical { background: #fee2e2; border-left-color: #ef4444; }
        .usage-bar { background: #e5e7eb; height: 30px; border-radius: 15px; overflow: hidden; margin: 20px 0; position: relative; }
        .usage-progress { height: 100%; background: linear-gradient(90deg, #10b981, #f59e0b, #ef4444); transition: width 0.3s; }
        .usage-text { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: 600; color: #1f2937; }
        .stats { display: flex; justify-content: space-between; margin: 30px 0; }
        .stat { text-align: center; flex: 1; }
        .stat-value { font-size: 32px; font-weight: 700; color: {{ $primary_color ?? '#3b82f6' }}; }
        .stat-label { font-size: 14px; color: #6b7280; margin-top: 8px; }
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
            <h1>⚠️ {{ $quota_type ?? 'Quota' }} Usage Warning</h1>
        </div>
        
        <div class="content">
            <div class="alert-box {{ $percentage >= 100 ? 'critical' : '' }}">
                <strong>{{ $percentage >= 100 ? 'Critical Alert:' : 'Warning:' }}</strong>
                You have used <strong>{{ $percentage }}%</strong> of your {{ $quota_type }} quota.
            </div>

            <div class="usage-bar">
                <div class="usage-progress" style="width: {{ min($percentage, 100) }}%;"></div>
                <div class="usage-text">{{ $percentage }}%</div>
            </div>

            <div class="stats">
                <div class="stat">
                    <div class="stat-value">{{ $current_usage ?? 'N/A' }}</div>
                    <div class="stat-label">Current Usage</div>
                </div>
                <div class="stat">
                    <div class="stat-value">{{ $quota_limit ?? 'N/A' }}</div>
                    <div class="stat-label">Quota Limit</div>
                </div>
            </div>

            <p>Hello {{ $tenant_name ?? 'there' }},</p>
            
            <p>Your <strong>{{ $quota_type }}</strong> usage has reached <strong>{{ $percentage }}%</strong> of your plan limit.</p>

            @if($percentage >= 100)
                <p><strong>Important:</strong> You have exceeded your quota limit. Some features may be restricted until you upgrade your plan or reduce usage.</p>
            @elseif($percentage >= 95)
                <p><strong>Action Required:</strong> You're very close to reaching your limit. Consider upgrading your plan to avoid service interruptions.</p>
            @elseif($percentage >= 90)
                <p>Please review your usage and consider upgrading your plan to ensure uninterrupted service.</p>
            @else
                <p>This is a friendly reminder to help you manage your resources effectively.</p>
            @endif

            <center>
                <a href="{{ $upgrade_url ?? '#' }}" class="cta-button">
                    Upgrade Your Plan
                </a>
            </center>

            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
                Need help? <a href="{{ $support_url ?? '#' }}" style="color: {{ $primary_color ?? '#3b82f6' }};">Contact Support</a>
            </p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} {{ $company_name ?? $app_name ?? 'Company' }}. All rights reserved.</p>
            <p>
                <a href="{{ $app_url ?? '#' }}">Visit Dashboard</a> |
                <a href="{{ $settings_url ?? '#' }}">Manage Settings</a> |
                <a href="{{ $unsubscribe_url ?? '#' }}">Unsubscribe</a>
            </p>
        </div>
    </div>
</body>
</html>
