<!DOCTYPE html>
<html>

<head>
    <style>
        body {
            font-family: Helvetica, Arial, sans-serif;
            font-size: 10px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th,
        td {
            border: 1px solid #ccc;
            padding: 4px;
            text-align: left;
        }

        th {
            background: #428bca;
            color: #fff;
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
    </style>
</head>

<body>
    <div class="title">{{ $title }}</div>
    <div class="meta">Generated on: {{ $generatedOn }}</div>
    <table>
        <thead>
            <tr>
                @foreach(array_keys($rows->first()) as $col)
                <th>{{ $col }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $row)
            <tr style="background: {{ stripos($row['Status'],'Absent')!==false || stripos($row['Status'],'Leave')!==false ? '#FFEBEE':'transparent' }}; color: {{ stripos($row['Status'],'Absent')!==false||stripos($row['Status'],'Leave')!==false? '#D32F2F':'#000' }};"
                @foreach($row as $cell)
                <td>{{ $cell }}</td>
                @endforeach
            </tr>
            @endforeach
        </tbody>
    </table>
</body>

</html>