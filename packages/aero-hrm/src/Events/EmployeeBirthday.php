<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\Employee;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event fired when it's an employee's birthday.
 *
 * This event is typically dispatched by a scheduled job that
 * checks for birthdays each day.
 */
class EmployeeBirthday
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Employee $employee,
        public int $age
    ) {}
}
