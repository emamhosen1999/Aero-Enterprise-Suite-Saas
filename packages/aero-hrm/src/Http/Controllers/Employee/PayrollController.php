<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Models\Payroll;
use Aero\HRM\Models\PayrollAllowance;
use Aero\HRM\Models\PayrollDeduction;
use Aero\HRM\Models\Payslip;
use Aero\HRM\Services\PayrollCalculationService;
use Aero\HRM\Services\PayrollReportService;
use Aero\HRM\Services\PayslipService;
use Aero\HRM\Http\Controllers\Controller;
use Aero\Core\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PayrollController extends Controller
{
    public function index()
    {
        $payrolls = Payroll::with(['employee', 'processedBy'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Pages/HRM/Payroll/Index', [
            'title' => 'Payroll Management',
            'payrolls' => $payrolls,
            'stats' => $this->getPayrollStats(),
        ]);
    }

    public function create()
    {
        $employees = User::role('Employee')->select('id', 'name', 'employee_id', 'email')->get();

        return Inertia::render('Pages/HRM/Payroll/Create', [
            'title' => 'Generate Payroll',
            'employees' => $employees,
            'allowanceTypes' => PayrollAllowance::allowanceTypes(),
            'deductionTypes' => PayrollDeduction::deductionTypes(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'pay_period_start' => 'required|date',
            'pay_period_end' => 'required|date|after:pay_period_start',
            'basic_salary' => 'required|numeric|min:0',
            'working_days' => 'required|integer|min:1|max:31',
            'present_days' => 'required|integer|min:0',
            'absent_days' => 'required|integer|min:0',
            'leave_days' => 'required|integer|min:0',
            'overtime_hours' => 'nullable|numeric|min:0',
            'allowances' => 'nullable|array',
            'allowances.*.type' => 'required_with:allowances|string',
            'allowances.*.amount' => 'required_with:allowances|numeric|min:0',
            'allowances.*.is_taxable' => 'boolean',
            'deductions' => 'nullable|array',
            'deductions.*.type' => 'required_with:deductions|string',
            'deductions.*.amount' => 'required_with:deductions|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated) {
            // Calculate salary components
            $basicSalary = $validated['basic_salary'];
            $dailySalary = $basicSalary / $validated['working_days'];
            $absentDeduction = $dailySalary * $validated['absent_days'];
            $adjustedBasicSalary = $basicSalary - $absentDeduction;

            // Calculate overtime
            $overtimeAmount = 0;
            if ($validated['overtime_hours'] > 0) {
                $hourlyRate = $dailySalary / 8; // Assuming 8 hours per day
                $overtimeAmount = $validated['overtime_hours'] * $hourlyRate * 1.5; // 1.5x rate
            }

            // Create payroll record
            $payroll = Payroll::create([
                'user_id' => $validated['user_id'],
                'pay_period_start' => $validated['pay_period_start'],
                'pay_period_end' => $validated['pay_period_end'],
                'basic_salary' => $adjustedBasicSalary,
                'working_days' => $validated['working_days'],
                'present_days' => $validated['present_days'],
                'absent_days' => $validated['absent_days'],
                'leave_days' => $validated['leave_days'],
                'overtime_hours' => $validated['overtime_hours'] ?? 0,
                'overtime_amount' => $overtimeAmount,
                'status' => 'draft',
                'processed_by' => Auth::id(),
                'remarks' => $validated['remarks'],
            ]);

            // Add allowances
            $totalAllowances = $overtimeAmount;
            if (isset($validated['allowances'])) {
                foreach ($validated['allowances'] as $allowance) {
                    PayrollAllowance::create([
                        'payroll_id' => $payroll->id,
                        'allowance_type' => $allowance['type'],
                        'amount' => $allowance['amount'],
                        'is_taxable' => $allowance['is_taxable'] ?? true,
                    ]);
                    $totalAllowances += $allowance['amount'];
                }
            }

            // Add deductions
            $totalDeductions = 0;
            if (isset($validated['deductions'])) {
                foreach ($validated['deductions'] as $deduction) {
                    PayrollDeduction::create([
                        'payroll_id' => $payroll->id,
                        'deduction_type' => $deduction['type'],
                        'amount' => $deduction['amount'],
                    ]);
                    $totalDeductions += $deduction['amount'];
                }
            }

            // Calculate final amounts
            $grossSalary = $adjustedBasicSalary + $totalAllowances;
            $netSalary = $grossSalary - $totalDeductions;

            // Update payroll with calculated amounts
            $payroll->update([
                'gross_salary' => $grossSalary,
                'total_deductions' => $totalDeductions,
                'net_salary' => $netSalary,
            ]);
        });

        return redirect()->route('hr.payroll.index')->with('success', 'Payroll generated successfully');
    }

    public function show($id)
    {
        $payroll = Payroll::with(['employee', 'allowances', 'deductions', 'processedBy', 'payslip'])
            ->findOrFail($id);

        return Inertia::render('Pages/HRM/Payroll/Show', [
            'title' => 'Payroll Details',
            'payroll' => $payroll,
        ]);
    }

    /**
     * View printable payslip
     */
    public function viewPayslip($id)
    {
        $payroll = Payroll::with([
            'employee.department',
            'employee.designation',
            'employee.bankDetails',
            'allowances',
            'deductions',
            'processedBy',
        ])->findOrFail($id);

        // Get tenant/company information
        $company = [
            'name' => tenant('company_name') ?? config('app.name'),
            'address' => tenant('company_address') ?? '',
            'logo' => tenant('company_logo') ?? null,
            'phone' => tenant('company_phone') ?? '',
            'email' => tenant('company_email') ?? '',
        ];

        // Calculate attendance summary
        $attendance = [
            'working_days' => $payroll->working_days,
            'present_days' => $payroll->present_days,
            'absent_days' => $payroll->absent_days,
            'leave_days' => $payroll->leave_days,
            'overtime_hours' => $payroll->overtime_hours,
            'late_days' => $payroll->late_days ?? 0,
        ];

        // Map allowances to earnings
        $earnings = $payroll->allowances->map(fn ($allowance) => [
            'id' => $allowance->id,
            'name' => $allowance->allowance_type,
            'amount' => $allowance->amount,
            'is_taxable' => $allowance->is_taxable ?? true,
        ])->toArray();

        // Add basic salary as first earning
        array_unshift($earnings, [
            'id' => 'basic',
            'name' => 'Basic Salary',
            'amount' => $payroll->basic_salary,
            'is_taxable' => true,
        ]);

        // Add overtime if exists
        if ($payroll->overtime_amount > 0) {
            $earnings[] = [
                'id' => 'overtime',
                'name' => 'Overtime Pay',
                'amount' => $payroll->overtime_amount,
                'is_taxable' => true,
            ];
        }

        // Map deductions
        $deductions = $payroll->deductions->map(fn ($deduction) => [
            'id' => $deduction->id,
            'name' => $deduction->deduction_type,
            'amount' => $deduction->amount,
        ])->toArray();

        return Inertia::render('Pages/HRM/Payroll/Payslip', [
            'title' => 'Payslip',
            'payroll' => $payroll,
            'company' => $company,
            'employee' => [
                'id' => $payroll->employee->id,
                'name' => $payroll->employee->name,
                'employee_id' => $payroll->employee->employee_id,
                'email' => $payroll->employee->email,
                'department' => $payroll->employee->department?->name ?? 'N/A',
                'designation' => $payroll->employee->designation?->name ?? 'N/A',
                'bank_name' => $payroll->employee->bankDetails?->bank_name ?? 'N/A',
                'account_number' => $payroll->employee->bankDetails?->account_number ?? 'N/A',
                'date_of_joining' => $payroll->employee->date_of_joining,
            ],
            'payPeriod' => [
                'start' => $payroll->pay_period_start,
                'end' => $payroll->pay_period_end,
            ],
            'attendance' => $attendance,
            'earnings' => $earnings,
            'deductions' => $deductions,
            'summary' => [
                'gross_salary' => $payroll->gross_salary,
                'total_deductions' => $payroll->total_deductions,
                'net_salary' => $payroll->net_salary,
            ],
        ]);
    }

    public function edit($id)
    {
        $payroll = Payroll::with(['employee', 'allowances', 'deductions'])
            ->findOrFail($id);

        if ($payroll->isProcessed()) {
            return redirect()->back()->with('error', 'Cannot edit processed payroll');
        }

        return Inertia::render('Pages/HRM/Payroll/Edit', [
            'title' => 'Edit Payroll',
            'payroll' => $payroll,
            'allowanceTypes' => PayrollAllowance::allowanceTypes(),
            'deductionTypes' => PayrollDeduction::deductionTypes(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $payroll = Payroll::findOrFail($id);

        if ($payroll->isProcessed()) {
            return redirect()->back()->with('error', 'Cannot update processed payroll');
        }

        $validated = $request->validate([
            'basic_salary' => 'required|numeric|min:0',
            'working_days' => 'required|integer|min:1|max:31',
            'present_days' => 'required|integer|min:0',
            'absent_days' => 'required|integer|min:0',
            'leave_days' => 'required|integer|min:0',
            'overtime_hours' => 'nullable|numeric|min:0',
            'allowances' => 'nullable|array',
            'deductions' => 'nullable|array',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($payroll, $validated) {
            // Recalculate salary components
            $basicSalary = $validated['basic_salary'];
            $dailySalary = $basicSalary / $validated['working_days'];
            $absentDeduction = $dailySalary * $validated['absent_days'];
            $adjustedBasicSalary = $basicSalary - $absentDeduction;

            // Update allowances and deductions
            $payroll->allowances()->delete();
            $payroll->deductions()->delete();

            $totalAllowances = 0;
            $totalDeductions = 0;

            // Re-add allowances
            if (isset($validated['allowances'])) {
                foreach ($validated['allowances'] as $allowance) {
                    $payroll->allowances()->create($allowance);
                    $totalAllowances += $allowance['amount'];
                }
            }

            // Re-add deductions
            if (isset($validated['deductions'])) {
                foreach ($validated['deductions'] as $deduction) {
                    $payroll->deductions()->create($deduction);
                    $totalDeductions += $deduction['amount'];
                }
            }

            // Update payroll
            $grossSalary = $adjustedBasicSalary + $totalAllowances;
            $netSalary = $grossSalary - $totalDeductions;

            $payroll->update([
                'basic_salary' => $adjustedBasicSalary,
                'gross_salary' => $grossSalary,
                'total_deductions' => $totalDeductions,
                'net_salary' => $netSalary,
                'working_days' => $validated['working_days'],
                'present_days' => $validated['present_days'],
                'absent_days' => $validated['absent_days'],
                'leave_days' => $validated['leave_days'],
                'overtime_hours' => $validated['overtime_hours'] ?? 0,
                'remarks' => $validated['remarks'],
            ]);
        });

        return redirect()->route('hr.payroll.show', $payroll->id)->with('success', 'Payroll updated successfully');
    }

    public function destroy($id)
    {
        $payroll = Payroll::findOrFail($id);

        if ($payroll->isProcessed()) {
            return redirect()->back()->with('error', 'Cannot delete processed payroll');
        }

        $payroll->delete();

        return redirect()->route('hr.payroll.index')->with('success', 'Payroll deleted successfully');
    }

    public function process($id)
    {
        $payroll = Payroll::with(['employee', 'allowances', 'deductions'])->findOrFail($id);

        if ($payroll->isProcessed()) {
            return redirect()->back()->with('error', 'Payroll already processed');
        }

        DB::transaction(function () use ($payroll) {
            // Update payroll status
            $payroll->update([
                'status' => 'processed',
                'processed_at' => now(),
            ]);

            // Generate payslip
            $payslip = Payslip::create([
                'payroll_id' => $payroll->id,
                'user_id' => $payroll->user_id,
                'payslip_number' => Payslip::generatePayslipNumber(),
                'pay_period_start' => $payroll->pay_period_start,
                'pay_period_end' => $payroll->pay_period_end,
                'basic_salary' => $payroll->basic_salary,
                'gross_salary' => $payroll->gross_salary,
                'total_allowances' => $payroll->total_allowances,
                'total_deductions' => $payroll->total_deductions,
                'net_salary' => $payroll->net_salary,
                'generated_at' => now(),
                'status' => 'generated',
            ]);
        });

        return redirect()->route('hr.payroll.show', $payroll->id)->with('success', 'Payroll processed successfully');
    }

    public function bulk()
    {
        $employees = User::role('Employee')->select('id', 'name', 'employee_id', 'email')->get();

        return Inertia::render('Pages/HRM/Payroll/Bulk', [
            'title' => 'Bulk Payroll Generation',
            'employees' => $employees,
        ]);
    }

    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'pay_period_start' => 'required|date',
            'pay_period_end' => 'required|date|after:pay_period_start',
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:users,id',
            'working_days' => 'required|integer|min:1|max:31',
        ]);

        $processedCount = 0;

        DB::transaction(function () use ($validated, &$processedCount) {
            foreach ($validated['employee_ids'] as $employeeId) {
                // Check if payroll already exists for this period
                $existingPayroll = Payroll::where('user_id', $employeeId)
                    ->where('pay_period_start', $validated['pay_period_start'])
                    ->where('pay_period_end', $validated['pay_period_end'])
                    ->first();

                if ($existingPayroll) {
                    continue;
                }

                $employee = User::find($employeeId);

                // Basic payroll creation with default values
                Payroll::create([
                    'user_id' => $employeeId,
                    'pay_period_start' => $validated['pay_period_start'],
                    'pay_period_end' => $validated['pay_period_end'],
                    'basic_salary' => $employee->basic_salary ?? 0,
                    'gross_salary' => $employee->basic_salary ?? 0,
                    'total_deductions' => 0,
                    'net_salary' => $employee->basic_salary ?? 0,
                    'working_days' => $validated['working_days'],
                    'present_days' => $validated['working_days'],
                    'absent_days' => 0,
                    'leave_days' => 0,
                    'overtime_hours' => 0,
                    'overtime_amount' => 0,
                    'status' => 'draft',
                    'processed_by' => Auth::id(),
                ]);

                $processedCount++;
            }
        });

        return redirect()->route('hr.payroll.index')->with('success', "Bulk payroll generated for {$processedCount} employees");
    }

    public function payslips()
    {
        $payslips = Payslip::with(['employee', 'payroll'])
            ->latest()
            ->paginate(15);

        return Inertia::render('Pages/HRM/Payroll/Payslips', [
            'title' => 'Payslips',
            'payslips' => $payslips,
        ]);
    }

    /**
     * Generate bulk payroll
     */
    public function bulkGenerate(Request $request)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array',
            'employee_ids.*' => 'exists:users,id',
            'pay_period_start' => 'required|date',
            'pay_period_end' => 'required|date|after:pay_period_start',
        ]);

        $payrollService = new PayrollCalculationService;

        $results = $payrollService->processBulkPayroll(
            $validated['employee_ids'],
            Carbon::parse($validated['pay_period_start']),
            Carbon::parse($validated['pay_period_end']),
            Auth::id()
        );

        $successCount = collect($results)->where('status', 'success')->count();
        $errorCount = collect($results)->where('status', 'error')->count();

        return redirect()->route('hr.payroll.index')
            ->with('success', "Bulk payroll generated: {$successCount} successful, {$errorCount} errors");
    }

    /**
     * Generate payslip for a payroll
     */
    public function generatePayslip($id)
    {
        $payroll = Payroll::with(['employee', 'allowances', 'deductions'])
            ->findOrFail($id);

        if ($payroll->status !== 'processed') {
            return redirect()->back()->with('error', 'Payroll must be processed before generating payslip');
        }

        $payslipService = new PayslipService;
        $payslip = $payslipService->generatePayslip($payroll);

        return redirect()->back()->with('success', 'Payslip generated successfully');
    }

    /**
     * Generate bulk payslips
     */
    public function bulkGeneratePayslips(Request $request)
    {
        $validated = $request->validate([
            'payroll_ids' => 'required|array',
            'payroll_ids.*' => 'exists:payrolls,id',
            'send_email' => 'boolean',
        ]);

        $payslipService = new PayslipService;
        $results = $payslipService->generateBulkPayslips(
            $validated['payroll_ids'],
            ['send_email' => $validated['send_email'] ?? false]
        );

        $successCount = collect($results)->where('status', 'success')->count();
        $errorCount = collect($results)->where('status', 'error')->count();

        return redirect()->back()
            ->with('success', "Bulk payslips generated: {$successCount} successful, {$errorCount} errors");
    }

    /**
     * Send payslip email
     */
    public function sendPayslipEmail($id)
    {
        $payroll = Payroll::with(['employee', 'payslip'])
            ->findOrFail($id);

        if (! $payroll->payslip) {
            return redirect()->back()->with('error', 'Payslip not found. Please generate payslip first.');
        }

        $payslipService = new PayslipService;
        $payslipService->sendPayslipEmail($payroll->payslip);

        return redirect()->back()->with('success', 'Payslip email sent successfully');
    }

    /**
     * Download payslip
     */
    public function downloadPayslip($id)
    {
        $payroll = Payroll::with(['payslip'])
            ->findOrFail($id);

        if (! $payroll->payslip) {
            return redirect()->back()->with('error', 'Payslip not found. Please generate payslip first.');
        }

        $payslipService = new PayslipService;

        return $payslipService->downloadPayslip($payroll->payslip);
    }

    /**
     * Process payroll (change status to processed)
     */
    public function processPayroll($id)
    {
        $payroll = Payroll::findOrFail($id);

        if ($payroll->status === 'processed') {
            return redirect()->back()->with('error', 'Payroll already processed');
        }

        $payroll->update([
            'status' => 'processed',
            'processed_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Payroll processed successfully');
    }

    /**
     * Bulk process payrolls
     */
    public function bulkProcess(Request $request)
    {
        $validated = $request->validate([
            'payroll_ids' => 'required|array',
            'payroll_ids.*' => 'exists:payrolls,id',
        ]);

        $updated = Payroll::whereIn('id', $validated['payroll_ids'])
            ->where('status', 'draft')
            ->update([
                'status' => 'processed',
                'processed_at' => now(),
            ]);

        return redirect()->back()
            ->with('success', "{$updated} payrolls processed successfully");
    }

    /**
     * Payroll reports dashboard
     */
    public function reports()
    {
        $reportService = new PayrollReportService;
        $currentMonth = now()->month;
        $currentYear = now()->year;

        $monthlyStats = $reportService->generateMonthlySummary($currentMonth, $currentYear);

        return Inertia::render('Pages/HRM/Payroll/Reports', [
            'title' => 'Payroll Reports',
            'monthlyStats' => $monthlyStats,
            'availableMonths' => $this->getAvailableMonths(),
        ]);
    }

    /**
     * Generate monthly summary report
     */
    public function monthlySummaryReport(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2030',
        ]);

        $reportService = new PayrollReportService;
        $report = $reportService->generateMonthlySummary($validated['month'], $validated['year']);

        return response()->json($report);
    }

    /**
     * Generate tax report
     */
    public function taxReport(Request $request)
    {
        $validated = $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $reportService = new PayrollReportService;
        $report = $reportService->generateTaxReport(
            Carbon::parse($validated['start_date']),
            Carbon::parse($validated['end_date'])
        );

        return response()->json($report);
    }

    /**
     * Generate bank transfer report
     */
    public function bankTransferReport(Request $request)
    {
        $validated = $request->validate([
            'payroll_ids' => 'required|array',
            'payroll_ids.*' => 'exists:payrolls,id',
        ]);

        $reportService = new PayrollReportService;
        $report = $reportService->generateBankTransferReport($validated['payroll_ids']);

        return response()->json($report);
    }

    /**
     * Generate statutory compliance report
     */
    public function statutoryReport(Request $request)
    {
        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020|max:2030',
        ]);

        $reportService = new PayrollReportService;
        $report = $reportService->generateStatutoryReport($validated['month'], $validated['year']);

        return response()->json($report);
    }

    /**
     * Get available months for reporting
     */
    private function getAvailableMonths()
    {
        $months = Payroll::selectRaw('MONTH(pay_period_start) as month, YEAR(pay_period_start) as year')
            ->distinct()
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'month' => $item->month,
                    'year' => $item->year,
                    'label' => Carbon::create($item->year, $item->month, 1)->format('F Y'),
                ];
            });

        return $months;
    }

    /**
     * Get payroll statistics
     */
    private function getPayrollStats()
    {
        $currentMonth = now()->startOfMonth();
        $currentMonthEnd = now()->endOfMonth();

        return [
            'total_payrolls' => Payroll::count(),
            'current_month_payrolls' => Payroll::whereBetween('pay_period_start', [$currentMonth, $currentMonthEnd])->count(),
            'processed_payrolls' => Payroll::where('status', 'processed')->count(),
            'total_payout' => Payroll::where('status', 'processed')->sum('net_salary'),
            'pending_payrolls' => Payroll::where('status', 'draft')->count(),
            'average_salary' => Payroll::where('status', 'processed')->avg('net_salary'),
        ];
    }
}
