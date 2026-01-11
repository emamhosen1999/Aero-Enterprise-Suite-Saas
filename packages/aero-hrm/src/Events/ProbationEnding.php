<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\Employee;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event fired when an employee's probation period is about to end.
 */
class ProbationEnding
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Employee $employee,
        public int $daysRemaining
    ) {}
}
