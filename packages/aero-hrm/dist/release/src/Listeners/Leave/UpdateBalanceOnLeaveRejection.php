<?php

namespace Aero\HRM\Listeners\Leave;

use Aero\HRM\Events\Leave\LeaveRejected;
use Aero\HRM\Services\LeaveBalanceService;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateBalanceOnLeaveRejection implements ShouldQueue
{
    public function __construct(private LeaveBalanceService $leaveBalanceService) {}

    public function handle(LeaveRejected $event): void
    {
        $this->leaveBalanceService->handleLeaveRejection($event->leave);
    }
}
