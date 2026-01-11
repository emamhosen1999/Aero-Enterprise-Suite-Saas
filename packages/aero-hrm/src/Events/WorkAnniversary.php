<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\Employee;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event fired when it's an employee's work anniversary.
 *
 * This event is typically dispatched by a scheduled job that
 * checks for work anniversaries each day.
 */
class WorkAnniversary
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Employee $employee,
        public int $yearsOfService
    ) {}
}
