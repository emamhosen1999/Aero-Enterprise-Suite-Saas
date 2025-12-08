<?php

namespace Aero\HRM\Listeners\Leave;

use App\Events\Leave\LeaveRejected;
use App\Services\Leave\LeaveBalanceService;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateBalanceOnLeaveRejection implements ShouldQueue
{
    public function __construct(private LeaveBalanceService $leaveBalanceService) {}

    public function handle(LeaveRejected $event): void
    {
        $this->leaveBalanceService->handleLeaveRejection($event->leave);
    }
}
