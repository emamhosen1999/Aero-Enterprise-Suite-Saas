<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - {{ $employee->name }}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            background: linear-gradient(135deg, #2563eb, #1e40af);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-bottom: 30px;
        }

        .content {
            background: #f8fafc;
            padding: 25px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
        }

        .employee-info {
            background: white;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-left: 4px solid #2563eb;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }

        .info-label {
            font-weight: bold;
            color: #374151;
        }

        .salary-summary {
            background: white;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 20px;
            border-left: 4px solid #059669;
        }

        .summary-title {
            font-size: 18px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 15px;
        }

        .net-salary {
            font-size: 20px;
            font-weight: bold;
            color: #059669;
            text-align: center;
            padding: 15px;
            background: #f0fdf4;
            border-radius: 6px;
            margin-top: 15px;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #6b7280;
            font-size: 14px;
        }

        .btn {
            display: inline-block;
            padding: 12px 24px;
            background: #2563eb;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            margin-top: 20px;
        }

        .attachment-note {
            background: #fef3c7;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #f59e0b;
            margin-top: 20px;
        }
    </style>
</head>

<body>
    <div class="header">
        <h1>{{ config('app.name') }}</h1>
        <p>Payslip for {{ $payslip->pay_period }}</p>
    </div>

    <div class="content">
        <p>Dear {{ $employee->name }},</p>

        <p>Greetings! Your payslip for <strong>{{ $payslip->pay_period }}</strong> has been generated and is ready for your review.</p>

        <div class="employee-info">
            <h3 style="margin-bottom: 15px; color: #2563eb;">Employee Information</h3>
            <div class="info-row">
                <span class="info-label">Employee Name:</span>
                <span>{{ $employee->name }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Employee ID:</span>
                <span>{{ $employee->employee_id ?? $employee->id }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Pay Period:</span>
                <span>{{ $payroll->pay_period_start->format('d M Y') }} to {{ $payroll->pay_period_end->format('d M Y') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Department:</span>
                <span>{{ $employee->department ?? 'N/A' }}</span>
            </div>
        </div>

        <div class="salary-summary">
            <div class="summary-title">Salary Summary</div>
            <div class="info-row">
                <span class="info-label">Gross Salary:</span>
                <span>₹ {{ number_format($payroll->gross_salary, 2) }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Total Deductions:</span>
                <span>₹ {{ number_format($payroll->total_deductions, 2) }}</span>
            </div>
            <div class="net-salary">
                Net Salary: ₹ {{ number_format($payroll->net_salary, 2) }}
            </div>
        </div>

        <div class="attachment-note">
            <strong>📎 Attachment:</strong> Your detailed payslip is attached as a PDF file. Please download and save it for your records.
        </div>

        <p style="margin-top: 25px;">
            If you have any questions regarding your payslip or salary calculation, please don't hesitate to contact the HR department.
        </p>

        <p style="margin-top: 20px;">
            Thank you for your continued dedication and hard work.
        </p>

        <div style="text-align: center; margin-top: 30px;">
            <p style="margin-bottom: 5px;"><strong>Best regards,</strong></p>
            <p style="color: #2563eb; font-weight: bold;">HR Department</p>
            <p style="color: #2563eb;">{{ config('app.name') }}</p>
        </div>
    </div>

    <div class="footer">
        <p><strong>Important:</strong> This is a confidential document. Please do not share it with unauthorized persons.</p>
        <p>Generated on: {{ now()->format('d M Y, h:i A') }}</p>
        <p>© {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
    </div>
</body>

</html>