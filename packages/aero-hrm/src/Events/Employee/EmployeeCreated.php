<?php

declare(strict_types=1);

namespace Aero\HRM\Events\Employee;

use Aero\HRM\Models\Employee;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * EmployeeCreated Event
 *
 * Dispatched when a new employee record is created in the system.
 * This is the primary event for employee lifecycle management.
 *
 * Triggers:
 * - Welcome email to new employee
 * - Onboarding workflow initiation
 * - Manager notification
 * - HR team notification
 * - Asset allocation reminders
 * - System access provisioning
 *
 * Related Events:
 * - OnboardingStarted (if onboarding enabled)
 * - WelcomeEmailSent
 */
class EmployeeCreated
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     *
     * @param  \Aero\HRM\Models\Employee  $employee  The newly created employee
     * @param  int|null  $createdBy  User ID of the person who created the employee
     * @param  array  $metadata  Additional context (e.g., onboarding enabled, welcome email sent)
     */
    public function __construct(
        public Employee $employee,
        public ?int $createdBy = null,
        public array $metadata = []
    ) {}
}
