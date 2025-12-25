<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Trial is Ending Soon</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f7; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: {{ $border_radius ?? '12px' }}; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, {{ $primary_color ?? '#3b82f6' }}, {{ $primary_color ?? '#2563eb' }}); padding: 40px 30px; text-align: center; color: white; }
        .header img { max-width: 150px; margin-bottom: 20px; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .countdown-box { background: #fef3c7; border: 2px solid #f59e0b; padding: 30px; margin: 30px 0; border-radius: 12px; text-align: center; }
        .countdown-number { font-size: 64px; font-weight: 700; color: #f59e0b; line-height: 1; }
        .countdown-label { font-size: 18px; color: #92400e; margin-top: 10px; font-weight: 600; }
        .benefits { background: #f0f9ff; padding: 30px; border-radius: 12px; margin: 30px 0; }
        .benefits h3 { margin-top: 0; color: #1e40af; }
        .benefit-item { display: flex; align-items: start; margin: 15px 0; }
        .benefit-icon { color: #10b981; font-size: 24px; margin-right: 15px; flex-shrink: 0; }
        .cta-button { display: inline-block; background: {{ $primary_color ?? '#3b82f6' }}; color: white; padding: 18px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 18px; margin: 20px 0; transition: transform 0.2s; }
        .cta-button:hover { transform: translateY(-2px); }
        .pricing { display: flex; justify-content: space-around; margin: 30px 0; }
        .price-box { text-align: center; padding: 20px; border: 2px solid #e5e7eb; border-radius: 12px; flex: 1; margin: 0 10px; }
        .price-box.featured { border-color: {{ $primary_color ?? '#3b82f6' }}; background: #eff6ff; }
        .price { font-size: 36px; font-weight: 700; color: {{ $primary_color ?? '#3b82f6' }}; }
        .price-label { font-size: 14px; color: #6b7280; margin-top: 5px; }
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
            <h1>⏰ Your Trial is Ending Soon</h1>
        </div>
        
        <div class="content">
            <div class="countdown-box">
                <div class="countdown-number">{{ $days_remaining ?? 'X' }}</div>
                <div class="countdown-label">{{ $days_remaining == 1 ? 'Day' : 'Days' }} Remaining</div>
            </div>

            <p>Hello {{ $user_name ?? 'there' }},</p>
            
            <p>Your free trial will end on <strong>{{ $trial_ends ?? 'soon' }}</strong>. Don't miss out on all the great features you've been enjoying!</p>

            <div class="benefits">
                <h3>Continue enjoying these benefits:</h3>
                <div class="benefit-item">
                    <div class="benefit-icon">✓</div>
                    <div>Full access to all premium features</div>
                </div>
                <div class="benefit-item">
                    <div class="benefit-icon">✓</div>
                    <div>Priority customer support</div>
                </div>
                <div class="benefit-item">
                    <div class="benefit-icon">✓</div>
                    <div>Advanced analytics and reporting</div>
                </div>
                <div class="benefit-item">
                    <div class="benefit-icon">✓</div>
                    <div>Unlimited team members</div>
                </div>
            </div>

            @if(isset($show_pricing) && $show_pricing)
            <div class="pricing">
                <div class="price-box">
                    <div class="price">$29</div>
                    <div class="price-label">per month</div>
                </div>
                <div class="price-box featured">
                    <div class="price">$99</div>
                    <div class="price-label">per month</div>
                    <div style="margin-top: 10px; color: {{ $primary_color ?? '#3b82f6' }}; font-weight: 600;">Most Popular</div>
                </div>
            </div>
            @endif

            <center>
                <a href="{{ $upgrade_url ?? '#' }}" class="cta-button">
                    Upgrade Now & Save {{ $discount ?? '20' }}%
                </a>
            </center>

            <p style="text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px;">
                Questions? <a href="{{ $support_url ?? '#' }}" style="color: {{ $primary_color ?? '#3b82f6' }};">Contact our team</a>
            </p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} {{ $company_name ?? $app_name ?? 'Company' }}. All rights reserved.</p>
            <p>
                <a href="{{ $app_url ?? '#' }}">Visit Dashboard</a> |
                <a href="{{ $settings_url ?? '#' }}">Manage Settings</a>
            </p>
        </div>
    </div>
</body>
</html>
