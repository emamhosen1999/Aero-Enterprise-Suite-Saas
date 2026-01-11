<?php

namespace Aero\HRM\Events;

use Aero\HRM\Models\Employee;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * @deprecated Use Aero\HRM\Events\Employee\EmployeeCreated instead
 * 
 * This legacy event is maintained for backward compatibility.
 * New code should use the Employee model directly via Events\Employee\EmployeeCreated.
 */
class EmployeeCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     * 
     * @param Employee $employee The employee that was created
     */
    public function __construct(
        public Employee $employee
    ) {}
}
