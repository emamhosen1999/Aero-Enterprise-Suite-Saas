<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt #{{ $receipt['receipt_number'] ?? $receipt['invoice_number'] ?? '' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333333;
            background: #ffffff;
        }

        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 30px;
        }

        /* Header */
        .header {
            text-align: center;
            padding-bottom: 30px;
            border-bottom: 2px solid {{ $branding['primary_color'] ?? '#2563eb' }};
            margin-bottom: 30px;
        }

        .logo {
            max-height: 50px;
            max-width: 180px;
            margin-bottom: 15px;
        }

        .company-name {
            font-size: 22px;
            font-weight: bold;
            color: {{ $branding['primary_color'] ?? '#2563eb' }};
            margin-bottom: 5px;
        }

        .company-details {
            font-size: 10px;
            color: #6b7280;
            line-height: 1.6;
        }

        /* Receipt Title */
        .receipt-title {
            text-align: center;
            margin-bottom: 30px;
        }

        .receipt-title h1 {
            font-size: 24px;
            color: {{ $branding['primary_color'] ?? '#2563eb' }};
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 5px;
        }

        .receipt-number {
            font-size: 12px;
            color: #6b7280;
        }

        /* Success Badge */
        .success-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 15px 0;
        }

        /* Info Grid */
        .info-grid {
            display: table;
            width: 100%;
            margin-bottom: 25px;
        }

        .info-box {
            display: table-cell;
            width: 50%;
            padding: 15px;
            background: #f9fafb;
            vertical-align: top;
        }

        .info-box:first-child {
            border-right: 1px solid #e5e7eb;
        }

        .info-label {
            font-size: 10px;
            font-weight: bold;
            color: {{ $branding['primary_color'] ?? '#2563eb' }};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }

        .info-value {
            font-size: 11px;
            color: #374151;
            line-height: 1.6;
        }

        .info-value strong {
            display: block;
            font-size: 13px;
            margin-bottom: 3px;
        }

        /* Payment Details */
        .payment-details {
            border: 1px solid #e5e7eb;
            border-radius: 5px;
            overflow: hidden;
            margin-bottom: 25px;
        }

        .payment-header {
            background: {{ $branding['primary_color'] ?? '#2563eb' }};
            color: white;
            padding: 12px 20px;
            font-size: 12px;
            font-weight: bold;
        }

        .payment-row {
            display: table;
            width: 100%;
            border-bottom: 1px solid #e5e7eb;
        }

        .payment-row:last-child {
            border-bottom: none;
        }

        .payment-row-label,
        .payment-row-value {
            display: table-cell;
            padding: 12px 20px;
            font-size: 11px;
        }

        .payment-row-label {
            color: #6b7280;
            width: 40%;
        }

        .payment-row-value {
            font-weight: 500;
            color: #111827;
            text-align: right;
        }

        .payment-row.total {
            background: #f9fafb;
        }

        .payment-row.total .payment-row-label,
        .payment-row.total .payment-row-value {
            font-weight: bold;
            font-size: 14px;
            padding: 15px 20px;
        }

        .payment-row.total .payment-row-value {
            color: {{ $branding['primary_color'] ?? '#2563eb' }};
        }

        /* Items Summary */
        .items-summary {
            margin-bottom: 25px;
        }

        .items-title {
            font-size: 12px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        .item-row {
            display: table;
            width: 100%;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
        }

        .item-row:last-child {
            border-bottom: none;
        }

        .item-desc,
        .item-amount {
            display: table-cell;
            font-size: 11px;
        }

        .item-desc {
            color: #4b5563;
        }

        .item-amount {
            text-align: right;
            font-weight: 500;
            color: #111827;
        }

        /* Transaction Info */
        .transaction-info {
            background: #f9fafb;
            padding: 15px 20px;
            border-radius: 5px;
            margin-bottom: 25px;
            font-size: 10px;
            color: #6b7280;
        }

        .transaction-info strong {
            color: #374151;
        }

        /* Footer */
        .footer {
            text-align: center;
            padding-top: 25px;
            border-top: 1px solid #e5e7eb;
        }

        .footer-message {
            font-size: 12px;
            color: #111827;
            margin-bottom: 8px;
        }

        .footer-contact {
            font-size: 10px;
            color: #9ca3af;
        }

        /* Print Styles */
        @media print {
            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .container {
                padding: 0;
            }
        }
    </style>
</head>

<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            @if(!empty($branding['logo_url']))
                <img src="{{ $branding['logo_url'] }}" alt="{{ $branding['company_name'] ?? 'Company' }}" class="logo"><br>
            @else
                <div class="company-name">{{ $branding['company_name'] ?? config('app.name') }}</div>
            @endif
            <div class="company-details">
                @if(!empty($branding['address']))
                    {{ $branding['address'] }}<br>
                @endif
                @if(!empty($branding['phone']))
                    {{ $branding['phone'] }}
                @endif
                @if(!empty($branding['email']))
                    @if(!empty($branding['phone'])) | @endif
                    {{ $branding['email'] }}
                @endif
            </div>
        </div>

        <!-- Receipt Title -->
        <div class="receipt-title">
            <h1>Payment Receipt</h1>
            <div class="receipt-number">
                Receipt #{{ $receipt['receipt_number'] ?? $receipt['invoice_number'] ?? '' }}
            </div>
            <span class="success-badge">✓ Payment Successful</span>
        </div>

        <!-- Info Grid -->
        <div class="info-grid">
            <div class="info-box">
                <div class="info-label">Date & Time</div>
                <div class="info-value">
                    <strong>{{ \Carbon\Carbon::parse($receipt['payment_date'] ?? $receipt['created_at'] ?? now())->format('F d, Y') }}</strong>
                    {{ \Carbon\Carbon::parse($receipt['payment_date'] ?? $receipt['created_at'] ?? now())->format('h:i A') }}
                </div>
            </div>
            <div class="info-box">
                <div class="info-label">Received From</div>
                <div class="info-value">
                    <strong>{{ $receipt['customer']['name'] ?? 'Customer' }}</strong>
                    {{ $receipt['customer']['email'] ?? '' }}
                </div>
            </div>
        </div>

        <!-- Items Summary (if present) -->
        @if(!empty($receipt['items']) && count($receipt['items']) > 0)
        <div class="items-summary">
            <div class="items-title">Items</div>
            @foreach($receipt['items'] as $item)
            <div class="item-row">
                <span class="item-desc">
                    {{ $item['name'] ?? $item['description'] ?? 'Item' }}
                    @if(($item['quantity'] ?? 1) > 1)
                        × {{ $item['quantity'] }}
                    @endif
                </span>
                <span class="item-amount">
                    {{ $receipt['currency_symbol'] ?? '$' }}{{ number_format(($item['quantity'] ?? 1) * ($item['unit_price'] ?? $item['amount'] ?? 0), 2) }}
                </span>
            </div>
            @endforeach
        </div>
        @endif

        <!-- Payment Details -->
        <div class="payment-details">
            <div class="payment-header">Payment Details</div>
            
            @if(!empty($receipt['invoice_number']))
            <div class="payment-row">
                <span class="payment-row-label">Invoice Number</span>
                <span class="payment-row-value">#{{ $receipt['invoice_number'] }}</span>
            </div>
            @endif
            
            <div class="payment-row">
                <span class="payment-row-label">Payment Method</span>
                <span class="payment-row-value">{{ ucfirst($receipt['payment_method'] ?? 'Card') }}</span>
            </div>
            
            @if(!empty($receipt['card_last_four']))
            <div class="payment-row">
                <span class="payment-row-label">Card</span>
                <span class="payment-row-value">•••• {{ $receipt['card_last_four'] }}</span>
            </div>
            @endif
            
            @if(!empty($receipt['subtotal']))
            <div class="payment-row">
                <span class="payment-row-label">Subtotal</span>
                <span class="payment-row-value">{{ $receipt['currency_symbol'] ?? '$' }}{{ number_format($receipt['subtotal'], 2) }}</span>
            </div>
            @endif
            
            @if(!empty($receipt['tax']) && $receipt['tax'] > 0)
            <div class="payment-row">
                <span class="payment-row-label">Tax</span>
                <span class="payment-row-value">{{ $receipt['currency_symbol'] ?? '$' }}{{ number_format($receipt['tax'], 2) }}</span>
            </div>
            @endif
            
            @if(!empty($receipt['discount']) && $receipt['discount'] > 0)
            <div class="payment-row">
                <span class="payment-row-label">Discount</span>
                <span class="payment-row-value">-{{ $receipt['currency_symbol'] ?? '$' }}{{ number_format($receipt['discount'], 2) }}</span>
            </div>
            @endif
            
            <div class="payment-row total">
                <span class="payment-row-label">Amount Paid</span>
                <span class="payment-row-value">{{ $receipt['currency_symbol'] ?? '$' }}{{ number_format($receipt['amount'] ?? $receipt['total'] ?? 0, 2) }}</span>
            </div>
        </div>

        <!-- Transaction Info -->
        @if(!empty($receipt['transaction_id']))
        <div class="transaction-info">
            <strong>Transaction ID:</strong> {{ $receipt['transaction_id'] }}<br>
            @if(!empty($receipt['reference_id']))
            <strong>Reference:</strong> {{ $receipt['reference_id'] }}
            @endif
        </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <div class="footer-message">
                {{ $branding['thank_you_message'] ?? 'Thank you for your payment!' }}
            </div>
            <div class="footer-contact">
                @if(!empty($branding['support_email']))
                    Questions? Contact {{ $branding['support_email'] }}
                @elseif(!empty($branding['email']))
                    Questions? Contact {{ $branding['email'] }}
                @endif
                <br>
                @if(!empty($branding['website']))
                    {{ $branding['website'] }}
                @endif
            </div>
            @if(!empty($branding['footer_text']))
            <div style="margin-top: 15px; font-size: 9px; color: #9ca3af;">
                {{ $branding['footer_text'] }}
            </div>
            @endif
        </div>
    </div>
</body>

</html>
