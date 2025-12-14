<?php

namespace Aero\HRM\Exports;

use Aero\HRM\Services\LeaveSummaryService;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Border;

class LeaveSummaryExport implements FromCollection, ShouldAutoSize, WithEvents, WithHeadings
{
    protected $filters;

    protected $summaryService;

    public function __construct(array $filters)
    {
        $this->filters = $filters;
        $this->summaryService = app(LeaveSummaryService::class);
    }

    public function collection()
    {
        $summaryData = $this->summaryService->generateLeaveSummary($this->filters);
        $data = $summaryData['data'] ?? [];
        $leaveTypes = $summaryData['leave_types'] ?? [];

        $rows = collect();
        $counter = 1;

        foreach ($data as $employee) {
            $row = [
                'No.' => $counter++,
                'Employee Name' => $employee['employee_name'] ?? 'N/A',
                'Department' => $employee['department'] ?? 'N/A',
                'January' => $employee['JAN'] ?? '',
                'February' => $employee['FEB'] ?? '',
                'March' => $employee['MAR'] ?? '',
                'April' => $employee['APR'] ?? '',
                'May' => $employee['MAY'] ?? '',
                'June' => $employee['JUN'] ?? '',
                'July' => $employee['JUL'] ?? '',
                'August' => $employee['AUG'] ?? '',
                'September' => $employee['SEP'] ?? '',
                'October' => $employee['OCT'] ?? '',
                'November' => $employee['NOV'] ?? '',
                'December' => $employee['DEC'] ?? '',
                'Total Approved' => $employee['total_approved'] ?? 0,
                'Total Pending' => $employee['total_pending'] ?? 0,
            ];

            // Add detailed leave type columns (used and remaining for each type)
            foreach ($leaveTypes as $leaveType) {
                $type = $leaveType->type;
                $row[$type.' Used'] = $employee[$type.'_used'] ?? 0;
                $row[$type.' Remaining'] = $employee[$type.'_remaining'] ?? 0;
            }

            $row['Total Balance'] = $employee['total_balance'] ?? 0;
            $row['Usage Percentage'] = ($employee['usage_percentage'] ?? 0).'%';

            $rows->push($row);
        }

        return $rows;
    }

    public function headings(): array
    {
        $summaryData = $this->summaryService->generateLeaveSummary($this->filters);
        $leaveTypes = $summaryData['leave_types'] ?? [];

        $baseHeaders = [
            'No.',
            'Employee Name',
            'Department',
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
            'Total Approved',
            'Total Pending',
        ];

        // Add leave type headers (used and remaining for each type)
        $leaveTypeHeaders = [];
        foreach ($leaveTypes as $leaveType) {
            $leaveTypeHeaders[] = $leaveType->type.' Used';
            $leaveTypeHeaders[] = $leaveType->type.' Remaining';
        }

        $endHeaders = [
            'Total Balance',
            'Usage Percentage',
        ];

        return array_merge($baseHeaders, $leaveTypeHeaders, $endHeaders);
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $summaryData = $this->summaryService->generateLeaveSummary($this->filters);
                $stats = $summaryData['stats'] ?? [];
                $leaveTypes = $summaryData['leave_types'] ?? [];

                // Calculate dynamic column range based on leave types
                $leaveTypeColumnsCount = count($leaveTypes) * 2; // used + remaining for each type
                $baseColumnsCount = 17; // base columns before leave types
                $totalColumns = $baseColumnsCount + $leaveTypeColumnsCount + 2; // +2 for total balance and usage

                // Generate last column letter dynamically
                $lastColumn = '';
                if ($totalColumns <= 26) {
                    $lastColumn = chr(64 + $totalColumns);
                } else {
                    $lastColumn = 'Z'.chr(64 + ($totalColumns - 26));
                }

                $firstDataRow = 2;
                $lastDataRow = $sheet->getHighestDataRow();
                $totalEmployees = $stats['total_employees'] ?? 0;
                $totalApproved = $stats['total_approved_leaves'] ?? 0;
                $totalPending = $stats['total_pending_leaves'] ?? 0;
                $totalDepartments = $stats['departments_count'] ?? 0;

                // Insert header rows
                $sheet->insertNewRowBefore(1, 3);

                // ====== Title ======
                $sheet->mergeCells("A1:{$lastColumn}1");
                $sheet->setCellValue('A1', 'Leave Summary Report - '.($this->filters['year'] ?? now()->year));
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal('center');

                // ====== Generated on ======
                $sheet->mergeCells("A2:{$lastColumn}2");
                $sheet->setCellValue('A2', 'Generated on: '.now()->format('F d, Y h:i A'));
                $sheet->getStyle('A2')->getAlignment()->setHorizontal('center');

                // ====== Summary statistics ======
                $sheet->mergeCells("A3:{$lastColumn}3");
                $summaryText = "Total Employees: {$totalEmployees} | Approved Leaves: {$totalApproved} | Pending Leaves: {$totalPending} | Departments: {$totalDepartments}";
                $sheet->setCellValue('A3', $summaryText);
                $sheet->getStyle('A3')->getAlignment()->setHorizontal('center');
                $sheet->getStyle('A3')->getFont()->setBold(true);

                // ====== Style the headers ======
                $sheet->getStyle("A4:{$lastColumn}4")->getFont()->setBold(true);
                $sheet->getStyle("A4:{$lastColumn}4")->getFill()
                    ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                    ->getStartColor()->setARGB('E3F2FD');
                $sheet->getStyle("A4:{$lastColumn}4")->getAlignment()->setHorizontal('center');

                // ====== Borders for the full range ======
                $highestRow = $sheet->getHighestRow();
                $highestCol = $sheet->getHighestColumn();
                $sheet->getStyle("A1:{$highestCol}{$highestRow}")
                    ->getBorders()->getAllBorders()
                    ->setBorderStyle(Border::BORDER_THIN);
                $sheet->getStyle("A4:{$highestCol}{$highestRow}")
                    ->getAlignment()->setHorizontal('center');

                // ====== Freeze pane after headers ======
                $sheet->freezePane('A5');
            },
        ];
    }
}
