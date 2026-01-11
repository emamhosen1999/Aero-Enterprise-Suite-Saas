<?php

declare(strict_types=1);

namespace Aero\HRM\Notifications;

use Aero\HRM\Models\Payslip;
use Illuminate\Notifications\Messages\MailMessage;

/**
 * Notification sent when a payslip is ready for viewing.
 *
 * Recipients: The employee whose payslip was generated
 */
class PayslipReadyNotification extends BaseHrmNotification
{
    protected string $eventType = 'payslip_ready';

    public function __construct(
        public Payslip $payslip
    ) {
        $this->afterCommit();
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $period = $this->payslip->month
            ? date('F Y', strtotime($this->payslip->month))
            : 'Current Period';

        return (new MailMessage)
            ->subject("Your Payslip for {$period} is Ready")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your payslip for {$period} has been generated and is ready for viewing.")
            ->line('**Payslip Summary:**')
            ->line("Period: {$period}")
            ->line("Net Pay: " . number_format($this->payslip->net_salary ?? 0, 2))
            ->line("Generated on: " . ($this->payslip->created_at?->format('d M Y') ?? now()->format('d M Y')))
            ->action('View Payslip', url("/hrm/payslips/{$this->payslip->id}"))
            ->line('If you have any questions about your payslip, please contact HR.');
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        $period = $this->payslip->month
            ? date('F Y', strtotime($this->payslip->month))
            : 'Current Period';

        return [
            'type' => 'payslip_ready',
            'payslip_id' => $this->payslip->id,
            'payroll_id' => $this->payslip->payroll_id,
            'period' => $period,
            'net_salary' => $this->payslip->net_salary,
            'gross_salary' => $this->payslip->gross_salary,
            'message' => "Your payslip for {$period} is ready to view",
            'action_url' => "/hrm/payslips/{$this->payslip->id}",
        ];
    }

    /**
     * Get FCM notification title.
     */
    protected function getFcmTitle(): string
    {
        return 'Payslip Ready';
    }

    /**
     * Get FCM notification body.
     */
    protected function getFcmBody(): string
    {
        $period = $this->payslip->month
            ? date('F Y', strtotime($this->payslip->month))
            : 'this month';

        return "Your payslip for {$period} is now available.";
    }

    /**
     * Get SMS message.
     */
    protected function getSmsMessage(): string
    {
        $period = $this->payslip->month
            ? date('M Y', strtotime($this->payslip->month))
            : 'this month';

        return "Your payslip for {$period} is ready. Net pay: " . number_format($this->payslip->net_salary ?? 0, 2);
    }

    /**
     * Get FCM data payload.
     */
    protected function getFcmData(): array
    {
        return [
            'type' => 'payslip_ready',
            'payslip_id' => (string) $this->payslip->id,
            'click_action' => 'FLUTTER_NOTIFICATION_CLICK',
            'route' => "/hrm/payslips/{$this->payslip->id}",
        ];
    }
}
