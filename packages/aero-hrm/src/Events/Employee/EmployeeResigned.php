<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Employee;

use Aero\HRM\Models\Employee;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * EmployeeResigned Event
 *
 * Dispatched when an employee submits resignation.
 *
 * Triggers:
 * - Offboarding workflow initiation
 * - Manager notification
 * - HR notification
 * - Asset return reminders
 * - Exit interview scheduling
 * - Knowledge transfer planning
 */
class EmployeeResigned
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Employee  $employee
     * @param  \DateTimeInterface  $resignationDate  Date resignation was submitted
     * @param  \DateTimeInterface  $lastWorkingDate  Employee's last day
     * @param  string|null  $reason  Reason for resignation
     * @param  int|null  $noticePeriodDays  Notice period in days
     */
    public function __construct(
        public Employee $employee,
        public \DateTimeInterface $resignationDate,
        public \DateTimeInterface $lastWorkingDate,
        public ?string $reason = null,
        public ?int $noticePeriodDays = null
    ) {}
}
