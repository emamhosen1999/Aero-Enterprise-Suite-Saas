<?php

namespace Aero\HRM\Listeners\Leave;

use Aero\HRM\Events\Leave\LeaveApproved;
use Aero\HRM\Services\LeaveBalanceService;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateBalanceOnLeaveApproval implements ShouldQueue
{
    public function __construct(private LeaveBalanceService $leaveBalanceService) {}

    public function handle(LeaveApproved $event): void
    {
        $this->leaveBalanceService->handleLeaveApproval($event->leave);
    }
}
