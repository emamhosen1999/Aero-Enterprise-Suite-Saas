<?php

namespace Aero\HRM\Listeners\Leave;

use Aero\HRM\Events\Leave\LeaveCancelled;
use Aero\HRM\Services\LeaveBalanceService;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateBalanceOnLeaveCancellation implements ShouldQueue
{
    public function __construct(private LeaveBalanceService $leaveBalanceService) {}

    public function handle(LeaveCancelled $event): void
    {
        $this->leaveBalanceService->handleLeaveCancellation($event->leave);
    }
}
