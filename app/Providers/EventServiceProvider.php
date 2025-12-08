<?php

namespace App\Providers;

use Aero\Platform\Listeners\AuthEventSubscriber;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Listeners\SendEmailVerificationNotification;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * The event to listener mappings for the application.
     *
     * @var array<class-string, array<int, class-string>>
     */
    protected $listen = [
        Registered::class => [
            SendEmailVerificationNotification::class,
        ],
        \App\Events\Leave\LeaveRequested::class => [
            \Aero\HRM\Listeners\Leave\UpdateBalanceOnLeaveRequest::class,
        ],
        \App\Events\Leave\LeaveApproved::class => [
            \Aero\HRM\Listeners\Leave\UpdateBalanceOnLeaveApproval::class,
        ],
        \App\Events\Leave\LeaveRejected::class => [
            \Aero\HRM\Listeners\Leave\UpdateBalanceOnLeaveRejection::class,
        ],
        \App\Events\Leave\LeaveCancelled::class => [
            \Aero\HRM\Listeners\Leave\UpdateBalanceOnLeaveCancellation::class,
        ],
        \App\Events\EmployeeCreated::class => [
            \Aero\Platform\Listeners\SendWelcomeEmail::class,
        ],
        \App\Events\LeaveRequested::class => [
            \Aero\HRM\Listeners\NotifyManagerOfLeaveRequest::class,
        ],
        \App\Events\PayrollGenerated::class => [
            \Aero\HRM\Listeners\SendPayslipNotification::class,
        ],
        \App\Events\AttendanceLogged::class => [
            \Aero\HRM\Listeners\LogAttendanceActivity::class,
        ],
        \App\Events\CandidateApplied::class => [
            \Aero\HRM\Listeners\NotifyRecruiterOfApplication::class,
        ],
    ];

    /**
     * The subscriber classes to register.
     *
     * @var array<int, class-string>
     */
    protected $subscribe = [
        AuthEventSubscriber::class,
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be automatically discovered.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
