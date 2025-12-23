<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice['invoice_number'] }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: {{ $branding['font_family'] ?? 'Arial, sans-serif' }};
            font-size: 12px;
            line-height: 1.5;
            color: #333;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 30px;
        }

        /* Header */
        .header {
            display: table;
            width: 100%;
            margin-bottom: 40px;
        }

        .logo-section {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        .logo-section img {
            max-width: 180px;
            max-height: 60px;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: {{ $branding['primary_color'] ?? '#2563eb' }};
        }

        .invoice-title-section {
            display: table-cell;
            width: 50%;
            text-align: right;
            vertical-align: top;
        }

        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: {{ $branding['primary_color'] ?? '#2563eb' }};
            margin-bottom: 5px;
        }

        .invoice-number {
            font-size: 14px;
            color: #666;
        }

        /* Invoice Meta */
        .invoice-meta {
            display: table;
            width: 100%;
            margin-bottom: 30px;
        }

        .meta-section {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        .meta-section h4 {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
            border-bottom: 2px solid {{ $branding['primary_color'] ?? '#2563eb' }};
            padding-bottom: 5px;
        }

        .meta-section p {
            margin-bottom: 3px;
        }

        .meta-section.right {
            text-align: right;
        }

        /* Status Badge */
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-paid { background: #dcfce7; color: #166534; }
        .status-pending { background: #fef3c7; color: #92400e; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
        .status-cancelled { background: #f3f4f6; color: #6b7280; }

        /* Dates Table */
        .dates-table {
            margin-bottom: 30px;
        }

        .dates-table table {
            width: 100%;
            border-collapse: collapse;
            background: #f8fafc;
            border-radius: 8px;
        }

        .dates-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
        }

        .dates-table td:first-child {
            font-weight: 600;
            color: #64748b;
            width: 30%;
        }

        /* Line Items Table */
        .line-items {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .line-items th {
            background: {{ $branding['primary_color'] ?? '#2563eb' }};
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-size: 11px;
            text-transform: uppercase;
        }

        .line-items th:last-child,
        .line-items td:last-child {
            text-align: right;
        }

        .line-items td {
            padding: 12px 15px;
            border-bottom: 1px solid #e2e8f0;
        }

        .line-items tr:nth-child(even) {
            background: #f8fafc;
        }

        .line-items .description {
            font-weight: 500;
        }

        /* Totals */
        .totals {
            width: 100%;
            display: table;
            margin-bottom: 30px;
        }

        .totals-spacer {
            display: table-cell;
            width: 50%;
        }

        .totals-table {
            display: table-cell;
            width: 50%;
        }

        .totals-table table {
            width: 100%;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 8px 15px;
        }

        .totals-table td:first-child {
            text-align: right;
            color: #64748b;
        }

        .totals-table td:last-child {
            text-align: right;
            width: 120px;
        }

        .totals-table .subtotal {
            border-bottom: 1px solid #e2e8f0;
        }

        .totals-table .total {
            font-size: 16px;
            font-weight: bold;
            background: {{ $branding['primary_color'] ?? '#2563eb' }};
            color: white;
        }

        .totals-table .amount-due {
            font-size: 18px;
            font-weight: bold;
            color: {{ $branding['primary_color'] ?? '#2563eb' }};
            border-top: 2px solid {{ $branding['primary_color'] ?? '#2563eb' }};
        }

        /* Notes */
        .notes {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid {{ $branding['primary_color'] ?? '#2563eb' }};
        }

        .notes h4 {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 8px;
        }

        /* Footer */
        .footer {
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            color: #64748b;
            font-size: 11px;
        }

        .footer p {
            margin-bottom: 5px;
        }

        .payment-info {
            background: #eff6ff;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        .payment-info h4 {
            color: {{ $branding['primary_color'] ?? '#2563eb' }};
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                @if($logoUrl)
                    <img src="{{ $logoUrl }}" alt="{{ $organization['name'] ?? 'Company' }}">
                @else
                    <div class="company-name">{{ $organization['name'] ?? 'Aero Enterprise Suite' }}</div>
                @endif
            </div>
            <div class="invoice-title-section">
                <div class="invoice-title">
                    @if($invoice['type'] === 'credit')
                        CREDIT NOTE
                    @else
                        INVOICE
                    @endif
                </div>
                <div class="invoice-number"># {{ $invoice['invoice_number'] }}</div>
                <div style="margin-top: 10px;">
                    <span class="status-badge status-{{ $invoice['status'] }}">
                        {{ ucfirst($invoice['status']) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Invoice Meta -->
        <div class="invoice-meta">
            <div class="meta-section">
                <h4>Bill From</h4>
                <p><strong>{{ $organization['name'] ?? 'Aero Enterprise Suite' }}</strong></p>
                @if($organization['address'] ?? null)
                    <p>{{ $organization['address'] }}</p>
                @endif
                @if(($organization['city'] ?? null) || ($organization['country'] ?? null))
                    <p>{{ $organization['city'] ?? '' }}{{ ($organization['city'] && $organization['country']) ? ', ' : '' }}{{ $organization['country'] ?? '' }}</p>
                @endif
                @if($organization['email'] ?? null)
                    <p>{{ $organization['email'] }}</p>
                @endif
                @if($organization['tax_id'] ?? null)
                    <p>Tax ID: {{ $organization['tax_id'] }}</p>
                @endif
            </div>
            <div class="meta-section right">
                <h4>Bill To</h4>
                <p><strong>{{ $customer['name'] ?? 'Customer' }}</strong></p>
                @if($customer['address'] ?? null)
                    <p>{{ $customer['address'] }}</p>
                @endif
                @if(($customer['city'] ?? null) || ($customer['state'] ?? null) || ($customer['postal_code'] ?? null))
                    <p>
                        {{ $customer['city'] ?? '' }}
                        {{ $customer['state'] ?? '' }}
                        {{ $customer['postal_code'] ?? '' }}
                    </p>
                @endif
                @if($customer['country'] ?? null)
                    <p>{{ $customer['country'] }}</p>
                @endif
                @if($customer['email'] ?? null)
                    <p>{{ $customer['email'] }}</p>
                @endif
                @if($customer['tax_id'] ?? null)
                    <p>Tax ID: {{ $customer['tax_id'] }}</p>
                @endif
            </div>
        </div>

        <!-- Dates -->
        <div class="dates-table">
            <table>
                <tr>
                    <td>Issue Date</td>
                    <td>{{ \Carbon\Carbon::parse($invoice['issue_date'])->format('F j, Y') }}</td>
                    <td>Due Date</td>
                    <td>{{ \Carbon\Carbon::parse($invoice['due_date'] ?? $invoice['issue_date'])->format('F j, Y') }}</td>
                </tr>
                @if(isset($invoice['billing_period_start']) && isset($invoice['billing_period_end']))
                <tr>
                    <td>Billing Period</td>
                    <td colspan="3">
                        {{ \Carbon\Carbon::parse($invoice['billing_period_start'])->format('M j, Y') }}
                        -
                        {{ \Carbon\Carbon::parse($invoice['billing_period_end'])->format('M j, Y') }}
                    </td>
                </tr>
                @endif
            </table>
        </div>

        <!-- Line Items -->
        <table class="line-items">
            <thead>
                <tr>
                    <th style="width: 50%">Description</th>
                    <th style="width: 15%">Quantity</th>
                    <th style="width: 15%">Unit Price</th>
                    <th style="width: 20%">Amount</th>
                </tr>
            </thead>
            <tbody>
                @foreach($invoice['line_items'] as $item)
                <tr>
                    <td class="description">{{ $item['description'] }}</td>
                    <td>{{ number_format($item['quantity'], 2) }}</td>
                    <td>{{ $invoice['currency'] ?? 'USD' }} {{ number_format($item['unit_price'], 2) }}</td>
                    <td>{{ $invoice['currency'] ?? 'USD' }} {{ number_format($item['amount'], 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Totals -->
        <div class="totals">
            <div class="totals-spacer"></div>
            <div class="totals-table">
                <table>
                    <tr class="subtotal">
                        <td>Subtotal</td>
                        <td>{{ $invoice['currency'] ?? 'USD' }} {{ number_format($invoice['subtotal'], 2) }}</td>
                    </tr>
                    @if(($invoice['tax_rate'] ?? 0) > 0)
                    <tr>
                        <td>Tax ({{ $invoice['tax_rate'] }}%)</td>
                        <td>{{ $invoice['currency'] ?? 'USD' }} {{ number_format($invoice['tax_amount'], 2) }}</td>
                    </tr>
                    @endif
                    @if(($invoice['credits_applied'] ?? 0) > 0)
                    <tr>
                        <td>Credits Applied</td>
                        <td style="color: #16a34a;">-{{ $invoice['currency'] ?? 'USD' }} {{ number_format($invoice['credits_applied'], 2) }}</td>
                    </tr>
                    @endif
                    <tr class="total">
                        <td>Total</td>
                        <td>{{ $invoice['currency'] ?? 'USD' }} {{ number_format($invoice['total'], 2) }}</td>
                    </tr>
                    @if($invoice['status'] !== 'paid' && isset($invoice['amount_due']))
                    <tr class="amount-due">
                        <td>Amount Due</td>
                        <td>{{ $invoice['currency'] ?? 'USD' }} {{ number_format($invoice['amount_due'], 2) }}</td>
                    </tr>
                    @endif
                    @if($invoice['status'] === 'paid' && isset($invoice['amount_paid']))
                    <tr>
                        <td style="color: #16a34a; font-weight: bold;">Amount Paid</td>
                        <td style="color: #16a34a; font-weight: bold;">{{ $invoice['currency'] ?? 'USD' }} {{ number_format($invoice['amount_paid'], 2) }}</td>
                    </tr>
                    @endif
                </table>
            </div>
        </div>

        <!-- Payment Info (for pending invoices) -->
        @if($invoice['status'] === 'pending' || $invoice['status'] === 'overdue')
        <div class="payment-info">
            <h4>Payment Information</h4>
            <p>Please make payment by the due date to avoid service interruption.</p>
            <p>You can pay online through your account dashboard or contact us for alternative payment methods.</p>
        </div>
        @endif

        <!-- Notes -->
        @if($invoice['notes'] ?? null)
        <div class="notes">
            <h4>Notes</h4>
            <p>{{ $invoice['notes'] }}</p>
        </div>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>Thank you for your business!</p>
            @if($organization['email'] ?? null)
                <p>For questions about this invoice, please contact {{ $organization['email'] }}</p>
            @endif
            <p style="margin-top: 15px; color: #94a3b8;">
                Generated on {{ now()->format('F j, Y \a\t g:i A') }}
            </p>
        </div>
    </div>
</body>
</html>
