<?php

namespace App\Listeners\Leave;

use App\Events\Leave\LeaveApproved;
use App\Services\Leave\LeaveBalanceService;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateBalanceOnLeaveApproval implements ShouldQueue
{
    public function __construct(private LeaveBalanceService $leaveBalanceService) {}

    public function handle(LeaveApproved $event): void
    {
        $this->leaveBalanceService->handleLeaveApproval($event->leave);
    }
}
