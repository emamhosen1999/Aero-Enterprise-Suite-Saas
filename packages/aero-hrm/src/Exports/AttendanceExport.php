<?php

namespace Aero\HRM\Exports;

use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\Leave;
use Aero\HRM\Models\LeaveSetting;
use Aero\Core\Models\User;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Border;

class AttendanceExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings
{
    protected $date;

    public function __construct(string $date)
    {
        $this->date = $date;
    }

    public function collection()
    {
        $users = User::join('designations', 'users.designation_id', '=', 'designations.id')
            ->select('users.*', 'designations.title as designation_title')
            ->get();

        $rows = collect();
        $counter = 1;
        $dateIsToday = now()->toDateString() === $this->date;

        foreach ($users as $user) {
            $attendances = Attendance::where('user_id', $user->id)
                ->whereDate('date', $this->date)
                ->orderBy('punchin')
                ->get();

            $leave = Leave::where('user_id', $user->id)
                ->whereDate('from_date', '<=', $this->date)
                ->whereDate('to_date', '>=', $this->date)
                ->first();

            if ($attendances->count()) {
                $allClockIns = [];
                $allClockOuts = [];
                $totalMinutes = 0;
                $completePunches = 0;
                $incomplete = false;

                foreach ($attendances as $attendance) {
                    // Collect all clock in times with numbers
                    if ($attendance->punchin) {
                        $allClockIns[] = Carbon::parse($attendance->punchin)->format('h:i A');

                        // For each punch in, add corresponding punch out or "No punch out"
                        if ($attendance->punchout) {
                            $allClockOuts[] = Carbon::parse($attendance->punchout)->format('h:i A');
                        } else {
                            $allClockOuts[] = 'No punch out';
                        }
                    }

                    if ($attendance->punchin && $attendance->punchout) {
                        $inTime = Carbon::parse($attendance->punchin);
                        $outTime = Carbon::parse($attendance->punchout);
                        if ($outTime->lt($inTime)) {
                            $outTime->addDay();
                        }
                        $totalMinutes += $inTime->diffInMinutes($outTime);
                        $completePunches++;
                    }

                    if ($attendance->punchin && ! $attendance->punchout) {
                        $incomplete = true;
                    }
                }

                // Format work hours
                $workTime = $totalMinutes > 0
                    ? intval($totalMinutes / 60).'h '.($totalMinutes % 60).'m'
                    : '';

                // Format all clock in times (each on new line with numbers)
                $in = count($allClockIns) > 0
                    ? implode("\r\n", array_map(function ($time, $index) {
                        return ($index + 1).'. '.$time;
                    }, $allClockIns, array_keys($allClockIns)))
                    : 'Not clocked in';

                // Format all clock out times (each on new line with numbers)
                $out = count($allClockOuts) > 0
                    ? implode("\r\n", array_map(function ($time, $index) {
                        return ($index + 1).'. '.$time;
                    }, $allClockOuts, array_keys($allClockOuts)))
                    : ($incomplete
                        ? ($dateIsToday ? 'Still working' : 'No punchout')
                        : 'Not punched out');

                // Define status and remarks
                if ($attendances->count() === 1) {
                    if ($incomplete) {
                        $workTime = $dateIsToday ? 'Still Working' : 'Not Punched Out';
                        $status = 'Present';
                        $remarks = $dateIsToday ? 'Currently Working' : 'Not Punched Out';
                    } else {
                        $status = 'Present';
                        $remarks = 'All punches complete';
                    }
                } elseif ($completePunches === $attendances->count()) {
                    $status = 'Present';
                    $remarks = 'All punches complete';
                } else {
                    $status = 'Present';
                    $remarks = 'Incomplete punches';
                    if ($incomplete && $dateIsToday) {
                        $workTime .= ' + Currently Working';
                    }
                }

                $rows->push([
                    'No.' => $counter++,
                    'Date' => date('M d, Y', strtotime($this->date)),
                    'Employee Name' => $user->name,
                    'Employee ID' => $user->employee_id,
                    'Designation' => $user->designation_title ?? 'N/A',
                    'Phone' => $user->phone,
                    'Clock In' => $in,
                    'Clock Out' => $out,
                    'Work Hours' => $workTime ?: '0h 0m',
                    'Total Punches' => $attendances->count(),
                    'Complete Punches' => $completePunches,
                    'Status' => $status,
                    'Remarks' => $remarks,
                ]);
            } elseif ($leave) {
                $duration = $leave->from_date === $leave->to_date
                    ? $this->date
                    : $leave->from_date.' to '.$leave->to_date;
                $leave_type = LeaveSetting::find($leave->leave_type)->type ?? 'Unknown';

                $remarks = "On {$leave_type} Leave ({$duration}) - Status: {$leave->status}";

                $rows->push([
                    'No.' => $counter++,
                    'Date' => date('M d, Y', strtotime($this->date)),
                    'Employee Name' => $user->name,
                    'Employee ID' => $user->employee_id,
                    'Designation' => $user->designation_title ?? 'N/A',
                    'Phone' => $user->phone,
                    'Clock In' => 'On Leave',
                    'Clock Out' => 'On Leave',
                    'Work Hours' => '0h 0m',
                    'Total Punches' => 0,
                    'Complete Punches' => 0,
                    'Status' => 'On Leave',
                    'Remarks' => $remarks,
                ]);
            } else {
                $rows->push([
                    'No.' => $counter++,
                    'Date' => date('M d, Y', strtotime($this->date)),
                    'Employee Name' => $user->name,
                    'Employee ID' => $user->employee_id,
                    'Designation' => $user->designation_title ?? 'N/A',
                    'Phone' => $user->phone,
                    'Clock In' => 'Absent',
                    'Clock Out' => 'Absent',
                    'Work Hours' => '0h 0m',
                    'Total Punches' => 0,
                    'Complete Punches' => 0,
                    'Status' => 'Absent',
                    'Remarks' => 'Absent without leave',
                ]);
            }
        }

        return $rows;
    }

    public function headings(): array
    {
        return [
            'No.',
            'Date',
            'Employee Name',
            'Employee ID',
            'Designation',
            'Phone',
            'Clock In',
            'Clock Out',
            'Work Hours',
            'Total Punches',
            'Complete Punches',
            'Status',
            'Remarks',
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $firstDataRow = 2;
                $lastDataRow = $sheet->getHighestDataRow();

                /* 3. Pull only the data block (columns A-L, rows 2-N)      *
                 *    ─ $returnCellRef = true → every row is keyed by       *
                 *      column letters (‘A’, ‘B’, … ‘L’)                    */
                $rows = collect(
                    $sheet->rangeToArray(
                        "A{$firstDataRow}:L{$lastDataRow}",
                        null,        // $nullValue
                        true,        // $calculateFormulas
                        false,       // $formatData
                        true         // $returnCellRef
                    )
                );

                /* 4. Quick counts based on the “Status” column (L) */
                $present = $rows->where('L', 'Present')->count();
                $absent = $rows->where('L', 'Absent')->count();
                $onLeave = $rows->where('L', 'On Leave')->count();
                $total = $rows->count();
                $sheet->insertNewRowBefore(1, 3); // Shift everything down by 4 rows

                // ====== Title ======
                $sheet->mergeCells('A1:M1');
                $sheet->setCellValue('A1', 'Daily Timesheet - '.date('F d, Y', strtotime($this->date)));
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

                // ====== Generated on ======
                $sheet->mergeCells('A2:M2');
                $sheet->setCellValue('A2', 'Generated on: '.now()->format('F d, Y h:i A'));
                $sheet->getStyle('A2')->getAlignment()->setHorizontal('center');

                // ====== Summary row ======

                $sheet->mergeCells('A3:M3');
                $sheet->setCellValue('A3', "Total Employees: {$total} (Present: {$present}, On Leave: {$onLeave}), Absent: {$absent})");
                $sheet->getStyle('A3')->getAlignment()->setHorizontal('center');

                // ====== Style the headers ======
                $sheet->getStyle('A4:M4')->getFont()->setBold(true);
                $sheet->getStyle('A4:M4')->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('E3F2FD');
                $sheet->getStyle('A4:M4')->getAlignment()->setHorizontal('center');

                // ====== Borders for the full range ======
                $highestRow = $sheet->getHighestRow();
                $highestCol = $sheet->getHighestColumn();
                $sheet->getStyle("A1:{$highestCol}{$highestRow}")
                    ->getBorders()->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN);
                $sheet->getStyle("A1:{$highestCol}{$highestRow}")
                    ->getAlignment()->setHorizontal('center');

                // ====== Enable text wrapping for Clock In and Clock Out columns ======
                $dataStartRow = 5; // After headers and summary rows
                $sheet->getStyle("G{$dataStartRow}:H{$highestRow}")
                    ->getAlignment()->setWrapText(true);
                $sheet->getStyle("G{$dataStartRow}:H{$highestRow}")
                    ->getAlignment()->setVertical('top');

                // ====== Freeze pane after headers ======
                $sheet->freezePane('A5');
            },
        ];
    }
}
