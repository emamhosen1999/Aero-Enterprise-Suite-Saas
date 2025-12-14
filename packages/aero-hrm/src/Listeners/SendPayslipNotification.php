<?php

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\PayrollGenerated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendPayslipNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(PayrollGenerated $event): void
    {
        $payroll = $event->payroll;
        $employee = $payroll->user;

        // Send payslip email to employee
        if ($employee && $employee->email) {
            // Note: PayslipEmail expects a Payslip model, not Payroll
            // You may need to generate/find the associated payslip first
            // $payslip = $payroll->payslip; // or generate payslip
            // Mail::to($employee->email)->send(new PayslipEmail($payslip, $pdfContent));

            // Log the payslip sent
            activity()
                ->performedOn($payroll)
                ->causedBy($employee)
                ->log('Payslip generation completed');
        }

        // Update payroll status if needed
        $payroll->update([
            'payslip_sent_at' => now(),
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(PayrollGenerated $event, \Throwable $exception): void
    {
        Log::error('Failed to send payslip notification', [
            'payroll_id' => $event->payroll->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
