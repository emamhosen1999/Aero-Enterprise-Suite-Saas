<?php

declare(strict_types=1);

namespace Aero\HRM\Listeners;

use Aero\HRM\Events\PayrollGenerated;
use Aero\HRM\Notifications\PayslipReadyNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Log;

/**
 * Listener that sends payslip notifications when payroll is generated.
 */
class SendPayslipNotifications implements ShouldQueue
{
    /**
     * Handle the payroll generated event.
     */
    public function handle(PayrollGenerated $event): void
    {
        $payroll = $event->payroll;

        // Load payslips with employees
        $payslips = $payroll->payslips()->with('employee.user')->get();

        foreach ($payslips as $payslip) {
            $this->notifyEmployee($payslip);
        }

        Log::info('Payslip notifications sent', [
            'payroll_id' => $payroll->id,
            'payslip_count' => $payslips->count(),
        ]);
    }

    /**
     * Notify an employee about their payslip.
     */
    protected function notifyEmployee($payslip): void
    {
        $employee = $payslip->employee;
        $user = $employee?->user ?? $payslip->user;

        if (! $user) {
            Log::warning('PayslipReady: No user found for payslip', [
                'payslip_id' => $payslip->id,
            ]);

            return;
        }

        try {
            $user->notify(new PayslipReadyNotification($payslip));

            // Update payslip notification timestamp
            $payslip->update(['payslip_sent_at' => now()]);
        } catch (\Throwable $e) {
            Log::error('Failed to send payslip notification', [
                'payslip_id' => $payslip->id,
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a failed job.
     */
    public function failed(PayrollGenerated $event, \Throwable $exception): void
    {
        Log::error('Failed to send payslip notifications', [
            'payroll_id' => $event->payroll->id,
            'error' => $exception->getMessage(),
        ]);
    }
}
