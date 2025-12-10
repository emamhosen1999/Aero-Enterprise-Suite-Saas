<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - {{ $employee['name'] }} - {{ $payroll['pay_period'] }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }

        .company-details {
            font-size: 10px;
            color: #666;
        }

        .payslip-title {
            font-size: 18px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            text-align: center;
            background: #f8fafc;
            padding: 10px;
            border: 1px solid #e2e8f0;
        }

        .employee-info {
            display: table;
            width: 100%;
            margin-bottom: 20px;
        }

        .info-section {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 10px;
            border: 1px solid #e2e8f0;
        }

        .info-title {
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
        }

        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }

        .info-label {
            font-weight: bold;
            min-width: 120px;
        }

        .salary-breakdown {
            display: table;
            width: 100%;
            margin-top: 20px;
        }

        .earnings-section,
        .deductions-section {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }

        .section-title {
            background: #2563eb;
            color: white;
            font-weight: bold;
            padding: 10px;
            text-align: center;
        }

        .section-content {
            border: 1px solid #e2e8f0;
            border-top: none;
            min-height: 200px;
        }

        .salary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 15px;
            border-bottom: 1px solid #f1f5f9;
        }

        .salary-item:last-child {
            border-bottom: none;
        }

        .salary-item.total {
            background: #f8fafc;
            font-weight: bold;
            border-top: 2px solid #2563eb;
        }

        .summary {
            margin-top: 20px;
            background: #f8fafc;
            border: 2px solid #2563eb;
            padding: 15px;
        }

        .summary-title {
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            margin-bottom: 15px;
            color: #2563eb;
        }

        .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }

        .summary-row.net-salary {
            font-size: 16px;
            font-weight: bold;
            color: #059669;
            border-top: 2px solid #2563eb;
            padding-top: 10px;
            margin-top: 10px;
        }

        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
        }

        .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>

<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="company-name">{{ $company['name'] }}</div>
            <div class="company-details">
                {{ $company['address'] }}<br>
                {{ $company['city'] }}<br>
                Phone: {{ $company['phone'] }} | Email: {{ $company['email'] }}
            </div>
        </div>

        <div class="payslip-title">
            PAYSLIP FOR {{ strtoupper($payroll['pay_period']) }}
        </div>

        <!-- Employee Information -->
        <div class="employee-info">
            <div class="info-section">
                <div class="info-title">Employee Information</div>
                <div class="info-row">
                    <span class="info-label">Employee Name:</span>
                    <span>{{ $employee['name'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Employee ID:</span>
                    <span>{{ $employee['employee_id'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Designation:</span>
                    <span>{{ $employee['designation'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Department:</span>
                    <span>{{ $employee['department'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Date of Joining:</span>
                    <span>{{ $employee['join_date'] }}</span>
                </div>
            </div>

            <div class="info-section">
                <div class="info-title">Pay Period Information</div>
                <div class="info-row">
                    <span class="info-label">Pay Period:</span>
                    <span>{{ $payroll['pay_period_start'] }} to {{ $payroll['pay_period_end'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Working Days:</span>
                    <span>{{ $payroll['working_days'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Present Days:</span>
                    <span>{{ $payroll['present_days'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Absent Days:</span>
                    <span>{{ $payroll['absent_days'] }}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Leave Days:</span>
                    <span>{{ $payroll['leave_days'] }}</span>
                </div>
                @if($payroll['overtime_hours'] > 0)
                <div class="info-row">
                    <span class="info-label">Overtime Hours:</span>
                    <span>{{ $payroll['overtime_hours'] }}</span>
                </div>
                @endif
            </div>
        </div>

        <!-- Salary Breakdown -->
        <div class="salary-breakdown">
            <!-- Earnings -->
            <div class="earnings-section">
                <div class="section-title">EARNINGS</div>
                <div class="section-content">
                    @php
                    $totalEarnings = 0;
                    @endphp
                    @foreach($earnings as $earning)
                    @php
                    $totalEarnings += $earning['amount'];
                    @endphp
                    <div class="salary-item">
                        <span>{{ $earning['description'] }}</span>
                        <span class="amount">{{ number_format($earning['amount'], 2) }}</span>
                    </div>
                    @endforeach
                    <div class="salary-item total">
                        <span>TOTAL EARNINGS</span>
                        <span class="amount">{{ number_format($totalEarnings, 2) }}</span>
                    </div>
                </div>
            </div>

            <!-- Deductions -->
            <div class="deductions-section">
                <div class="section-title">DEDUCTIONS</div>
                <div class="section-content">
                    @php
                    $totalDeductions = 0;
                    @endphp
                    @foreach($deductions as $deduction)
                    @php
                    $totalDeductions += $deduction['amount'];
                    @endphp
                    <div class="salary-item">
                        <span>{{ $deduction['description'] }}</span>
                        <span class="amount">{{ number_format($deduction['amount'], 2) }}</span>
                    </div>
                    @endforeach
                    <div class="salary-item total">
                        <span>TOTAL DEDUCTIONS</span>
                        <span class="amount">{{ number_format($totalDeductions, 2) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Summary -->
        <div class="summary">
            <div class="summary-title">SALARY SUMMARY</div>
            <div class="summary-row">
                <span>Gross Salary:</span>
                <span class="amount">₹ {{ number_format($summary['gross_salary'], 2) }}</span>
            </div>
            <div class="summary-row">
                <span>Total Deductions:</span>
                <span class="amount">₹ {{ number_format($summary['total_deductions'], 2) }}</span>
            </div>
            <div class="summary-row net-salary">
                <span>Net Salary:</span>
                <span class="amount">₹ {{ number_format($summary['net_salary'], 2) }}</span>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Note:</strong> This is a computer-generated payslip and does not require a signature.</p>
            <p>Generated on: {{ $generated_date }}</p>
            <p>For any queries regarding this payslip, please contact HR Department.</p>
        </div>
    </div>
</body>

</html>