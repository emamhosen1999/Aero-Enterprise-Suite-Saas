<?php

declare(strict_types=1);

namespace Aero\HRM\Providers;

use Aero\HRM\Events\ContractExpiring;
use Aero\HRM\Events\DocumentExpiring;
use Aero\HRM\Events\EmployeeBirthday;
use Aero\HRM\Events\Leave\LeaveApproved;
use Aero\HRM\Events\Leave\LeaveCancelled;
use Aero\HRM\Events\Leave\LeaveRejected;
use Aero\HRM\Events\Leave\LeaveRequested;
use Aero\HRM\Events\PayrollGenerated;
use Aero\HRM\Events\ProbationEnding;
use Aero\HRM\Events\WorkAnniversary;
use Aero\HRM\Listeners\Leave\NotifyOnLeaveCancellation;
use Aero\HRM\Listeners\Leave\UpdateBalanceOnLeaveApproval;
use Aero\HRM\Listeners\Leave\UpdateBalanceOnLeaveCancellation;
use Aero\HRM\Listeners\Leave\UpdateBalanceOnLeaveRejection;
use Aero\HRM\Listeners\Leave\UpdateBalanceOnLeaveRequest;
use Aero\HRM\Listeners\NotifyManagerOfLeaveRequest;
use Aero\HRM\Listeners\SendBirthdayNotifications;
use Aero\HRM\Listeners\SendContractExpiryNotifications;
use Aero\HRM\Listeners\SendDocumentExpiryNotifications;
use Aero\HRM\Listeners\SendPayslipNotificationsNew;
use Aero\HRM\Listeners\SendProbationEndingNotifications;
use Aero\HRM\Listeners\SendWorkAnniversaryNotifications;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

/**
 * HRM Event Service Provider
 *
 * Explicitly registers all HRM events and their listeners.
 * This provides better discoverability and control over event handling.
 */
class HrmEventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the HRM module.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        // Leave Events
        LeaveRequested::class => [
            UpdateBalanceOnLeaveRequest::class,
            NotifyManagerOfLeaveRequest::class,
        ],

        LeaveApproved::class => [
            UpdateBalanceOnLeaveApproval::class,
            // Notification is sent directly in LeaveApprovalService
        ],

        LeaveRejected::class => [
            UpdateBalanceOnLeaveRejection::class,
            // Notification is sent directly in LeaveApprovalService
        ],

        LeaveCancelled::class => [
            UpdateBalanceOnLeaveCancellation::class,
            NotifyOnLeaveCancellation::class,
        ],

        // Payroll Events
        PayrollGenerated::class => [
            SendPayslipNotificationsNew::class,
        ],

        // Employee Lifecycle Events
        EmployeeBirthday::class => [
            SendBirthdayNotifications::class,
        ],

        WorkAnniversary::class => [
            SendWorkAnniversaryNotifications::class,
        ],

        DocumentExpiring::class => [
            SendDocumentExpiryNotifications::class,
        ],

        ProbationEnding::class => [
            SendProbationEndingNotifications::class,
        ],

        ContractExpiring::class => [
            SendContractExpiryNotifications::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        parent::boot();
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false; // Explicit registration preferred for clarity
    }
}
