<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 8px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th,
        td {
            border: 1px solid #ccc;
            padding: 3px;
            text-align: center;
        }

        th {
            background: #428bca;
            color: #fff;
            font-weight: bold;
            font-size: 7px;
        }

        td {
            font-size: 7px;
        }

        .title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-top: 10px;
        }

        .meta {
            text-align: center;
            font-size: 10px;
            margin-top: 4px;
        }

        .summary {
            text-align: center;
            font-size: 9px;
            margin-top: 8px;
            font-weight: bold;
        }

        .employee-name {
            text-align: left !important;
            width: 120px;
            max-width: 120px;
        }

        .department {
            text-align: left !important;
            width: 80px;
            max-width: 80px;
        }

        .month-col {
            width: 25px;
            max-width: 25px;
        }

        .total-col {
            width: 35px;
            max-width: 35px;
            background: #f5f5f5;
        }
    </style>
</head>

<body>
    <div class="title">{{ $title }}</div>
    <div class="meta">Generated on: {{ $generatedOn }}</div>
    
    @if(isset($summaryData['stats']))
    <div class="summary">
        Total Employees: {{ $summaryData['stats']['total_employees'] ?? 0 }} | 
        Approved Leaves: {{ $summaryData['stats']['total_approved_leaves'] ?? 0 }} | 
        Pending Leaves: {{ $summaryData['stats']['total_pending_leaves'] ?? 0 }} | 
        Departments: {{ $summaryData['stats']['departments_count'] ?? 0 }}
    </div>
    @endif

    <table>
        <thead>
            <tr>
                <th class="employee-name">Employee</th>
                <th class="department">Department</th>
                <th class="month-col">Jan</th>
                <th class="month-col">Feb</th>
                <th class="month-col">Mar</th>
                <th class="month-col">Apr</th>
                <th class="month-col">May</th>
                <th class="month-col">Jun</th>
                <th class="month-col">Jul</th>
                <th class="month-col">Aug</th>
                <th class="month-col">Sep</th>
                <th class="month-col">Oct</th>
                <th class="month-col">Nov</th>
                <th class="month-col">Dec</th>
                <th class="total-col">Approved</th>
                <th class="total-col">Pending</th>
                @if(isset($summaryData['leave_types']))
                    @foreach($summaryData['leave_types'] as $leaveType)
                        <th class="total-col">{{ $leaveType->type }} Used</th>
                        <th class="total-col">{{ $leaveType->type }} Rem.</th>
                    @endforeach
                @endif
                <th class="total-col">Balance</th>
                <th class="total-col">Usage %</th>
            </tr>
        </thead>
        <tbody>
            @foreach($summaryData['data'] ?? [] as $employee)
            <tr>
                <td class="employee-name">{{ $employee['employee_name'] ?? 'N/A' }}</td>
                <td class="department">{{ $employee['department'] ?? 'N/A' }}</td>
                <td class="month-col">{{ $employee['JAN'] ?? '' }}</td>
                <td class="month-col">{{ $employee['FEB'] ?? '' }}</td>
                <td class="month-col">{{ $employee['MAR'] ?? '' }}</td>
                <td class="month-col">{{ $employee['APR'] ?? '' }}</td>
                <td class="month-col">{{ $employee['MAY'] ?? '' }}</td>
                <td class="month-col">{{ $employee['JUN'] ?? '' }}</td>
                <td class="month-col">{{ $employee['JUL'] ?? '' }}</td>
                <td class="month-col">{{ $employee['AUG'] ?? '' }}</td>
                <td class="month-col">{{ $employee['SEP'] ?? '' }}</td>
                <td class="month-col">{{ $employee['OCT'] ?? '' }}</td>
                <td class="month-col">{{ $employee['NOV'] ?? '' }}</td>
                <td class="month-col">{{ $employee['DEC'] ?? '' }}</td>
                <td class="total-col">{{ $employee['total_approved'] ?? 0 }}</td>
                <td class="total-col">{{ $employee['total_pending'] ?? 0 }}</td>
                @if(isset($summaryData['leave_types']))
                    @foreach($summaryData['leave_types'] as $leaveType)
                        <td class="total-col">{{ $employee[$leaveType->type.'_used'] ?? 0 }}</td>
                        <td class="total-col">{{ $employee[$leaveType->type.'_remaining'] ?? 0 }}</td>
                    @endforeach
                @endif
                <td class="total-col">{{ $employee['total_balance'] ?? 0 }}</td>
                <td class="total-col">{{ ($employee['usage_percentage'] ?? 0) }}%</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    @if(isset($summaryData['department_summary']) && count($summaryData['department_summary']) > 0)
    <div style="margin-top: 30px;">
        <div class="title" style="font-size: 14px;">Department Summary</div>
        <table style="margin-top: 10px;">
            <thead>
                <tr>
                    <th style="text-align: left; width: 150px;">Department</th>
                    <th style="width: 80px;">Employees</th>
                    <th style="width: 80px;">Total Leaves</th>
                    <th style="width: 80px;">Approved</th>
                    <th style="width: 80px;">Pending</th>
                    <th style="width: 100px;">Avg per Employee</th>
                </tr>
            </thead>
            <tbody>
                @foreach($summaryData['department_summary'] as $dept)
                <tr>
                    <td style="text-align: left;">{{ $dept['department'] ?? 'N/A' }}</td>
                    <td>{{ $dept['employee_count'] ?? 0 }}</td>
                    <td>{{ $dept['total_leaves'] ?? 0 }}</td>
                    <td>{{ $dept['total_approved'] ?? 0 }}</td>
                    <td>{{ $dept['total_pending'] ?? 0 }}</td>
                    <td>{{ $dept['avg_leaves_per_employee'] ?? 0 }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

</body>

</html>
