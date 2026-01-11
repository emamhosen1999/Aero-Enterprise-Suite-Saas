<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Employee;

use Aero\HRM\Models\Employee;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * EmployeeTerminated Event
 *
 * Dispatched when an employee is terminated by the company.
 *
 * Triggers:
 * - Immediate offboarding
 * - System access revocation
 * - Asset return enforcement
 * - Exit notification
 * - Final settlement processing
 * - Manager notification
 * - HR notification
 */
class EmployeeTerminated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Employee  $employee
     * @param  \DateTimeInterface  $terminationDate
     * @param  string  $reason  Reason for termination
     * @param  int|null  $terminatedBy  User ID who performed termination
     * @param  bool  $immediate  Whether termination is immediate (no notice)
     */
    public function __construct(
        public Employee $employee,
        public \DateTimeInterface $terminationDate,
        public string $reason,
        public ?int $terminatedBy = null,
        public bool $immediate = false
    ) {}
}
