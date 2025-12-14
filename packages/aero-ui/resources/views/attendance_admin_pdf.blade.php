<!DOCTYPE html>
<html>

<head>
    <title>Attendance PDF</title>
    <style>
        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 10px;
        }

        table {
            border-collapse: collapse;
            width: 100%;
        }

        th,
        td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
        }

        th {
            background-color: #eee;
        }
    </style>
</head>

<body>
    <h3 style="text-align:center">DBEDC Site Office Attendance - {{ $monthName }}</h3>
    <table>
        <thead>
            <tr>
                <th>SL</th>
                <th>Name</th>
                @for($d = $from->day; $d <= $to->day; $d++)
                    <th>{{ $d }}</th>
                    @endfor
                    @foreach($leaveTypes as $type)
                    <th>{{ $type->type }}</th>
                    @endforeach
                    <th>Remarks</th>
            </tr>
        </thead>
        <tbody>
            @foreach($users as $index => $user)
            <tr>
                <td>{{ $index + 1 }}</td>
                <td>{{ $user->name }}</td>
                @for($d = $from->day; $d <= $to->day; $d++)
                    @php
                    $date = \Carbon\Carbon::create($from->year, $from->month, $d)->toDateString();
                    $status = $attendanceData[$index][$date]['status'] ?? '#';
                    @endphp
                    <td>{{ $status }}</td>
                    @endfor
                    @foreach($leaveTypes as $type)
                    @php
                    $count = collect($attendanceData[$index])
                    ->where('remarks', 'On Leave')
                    ->where('status', $type->symbol)
                    ->count();
                    @endphp
                    <td>{{ $count > 0 ? $count : '-' }}</td>
                    @endforeach
                    <td></td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>

</html>