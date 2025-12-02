<?php

namespace App\Listeners\Leave;

use App\Events\Leave\LeaveRequested;
use App\Services\Leave\LeaveBalanceService;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateBalanceOnLeaveRequest implements ShouldQueue
{
    public function __construct(private LeaveBalanceService $leaveBalanceService) {}

    public function handle(LeaveRequested $event): void
    {
        $this->leaveBalanceService->handleLeaveRequest($event->leave);
    }
}
