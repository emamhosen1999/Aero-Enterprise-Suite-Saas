<?php

namespace Aero\HRM\Exports;

use Aero\HRM\Models\Holiday;
use Aero\HRM\Models\LeaveSetting;
use Aero\Core\Models\User;
use Carbon\Carbon;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class AttendanceAdminExport
{
    public function export($month)
    {
        $from = Carbon::parse($month.'-01');
        $to = $from->copy()->endOfMonth();
        $monthName = $from->format('F Y');

        $users = User::with(['attendances', 'leaves'])
            ->role('Employee')
            ->where('active', 1)
            ->get();

        $leaveTypes = LeaveSetting::all();
        $holidays = Holiday::all();

        $symbolToTypeMap = $leaveTypes->pluck('type', 'symbol')->toArray();

        $spreadsheet = new Spreadsheet;
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->getDefaultRowDimension()->setRowHeight(25);

        $headerTitle = 'Dhaka Bypass Expressway Development Company Ltd. Attendance Record-DBEDC Site Office Employee';
        $sheet->setCellValue('A1', $headerTitle);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->mergeCells('A1:Z1'); // Adjusted

        $sheet->setCellValue('A2', $monthName);
        $sheet->getStyle('A2')->getFont()->setBold(true);
        $sheet->getStyle('A2')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->mergeCells('A2:Z2'); // Adjusted

        // Header
        $sheet->setCellValue('A4', 'SL');
        $sheet->setCellValue('B4', 'Name');

        $col = 'C';
        $dateMap = [];
        for ($date = $from->copy(); $date->lte($to); $date->addDay()) {
            $label = $date->format('d').' - '.$date->format('D');
            $sheet->setCellValue("{$col}4", $label);
            $sheet->getStyle("{$col}4")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER)->setVertical(Alignment::VERTICAL_CENTER);
            $dateMap[$col] = $date->toDateString();
            $col++;
        }

        foreach ($leaveTypes as $leaveType) {
            $sheet->setCellValue("{$col}4", $leaveType->type);
            $col++;
        }

        $sheet->setCellValue("{$col}4", 'Remark');

        $row = 5;
        foreach ($users as $index => $user) {
            $attendanceRecord = app('App\\Http\\Controllers\\AttendanceController')->getUserAttendanceData($user, $from->year, $from->month, $holidays, collect($leaveTypes));

            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $user->name);

            $colCursor = 'C';
            $leaveCounts = array_fill_keys($leaveTypes->pluck('type')->toArray(), 0);

            foreach ($dateMap as $colKey => $dateString) {
                $dayStatus = $attendanceRecord[$dateString]['status'] ?? '#';
                $remarks = $attendanceRecord[$dateString]['remarks'] ?? '';
                $sheet->setCellValue("{$colKey}{$row}", $dayStatus);

                if ($remarks === 'On Leave' && isset($symbolToTypeMap[$dayStatus])) {
                    $leaveType = $symbolToTypeMap[$dayStatus];
                    $leaveCounts[$leaveType]++;
                }
                $colCursor++;
            }

            foreach ($leaveTypes as $leaveType) {
                $count = $leaveCounts[$leaveType->type] ?? 0;
                $sheet->setCellValue("{$colCursor}{$row}", $count > 0 ? $count : '-');
                $colCursor++;
            }

            $sheet->setCellValue("{$colCursor}{$row}", '');
            $row++;
        }

        $lastCol = $sheet->getHighestColumn();
        $lastRow = $sheet->getHighestRow();
        $sheet->getStyle("A4:{$lastCol}{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        $sheet->getStyle("A4:{$lastCol}4")->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setARGB('FFE0E0E0');
        $sheet->getStyle("A4:{$lastCol}4")->getFont()->setBold(true);

        // Fix range for autosize
        for ($col = 'A'; $col !== $this->nextExcelColumn($lastCol); $col = $this->nextExcelColumn($col)) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $fileName = "DBEDC_Attendance_{$monthName}.xlsx";
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'attendance');
        $writer->save($tempFile);

        return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);
    }

    private function nextExcelColumn($col)
    {
        $letters = str_split($col);
        $len = count($letters);
        for ($i = $len - 1; $i >= 0; $i--) {
            if ($letters[$i] !== 'Z') {
                $letters[$i] = chr(ord($letters[$i]) + 1);
                for ($j = $i + 1; $j < $len; $j++) {
                    $letters[$j] = 'A';
                }

                return implode('', $letters);
            }
        }

        return 'A'.str_repeat('A', $len);
    }
}
