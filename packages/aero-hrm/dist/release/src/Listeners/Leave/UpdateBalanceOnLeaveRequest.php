<?php

namespace Aero\HRM\Listeners\Leave;

use Aero\HRM\Events\Leave\LeaveRequested;
use Aero\HRM\Services\LeaveBalanceService;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateBalanceOnLeaveRequest implements ShouldQueue
{
    public function __construct(private LeaveBalanceService $leaveBalanceService) {}

    public function handle(LeaveRequested $event): void
    {
        $this->leaveBalanceService->handleLeaveRequest($event->leave);
    }
}
