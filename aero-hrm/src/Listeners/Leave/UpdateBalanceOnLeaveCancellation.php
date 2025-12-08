<?php

namespace Aero\HRM\Listeners\Leave;

use App\Events\Leave\LeaveCancelled;
use App\Services\Leave\LeaveBalanceService;
use Illuminate\Contracts\Queue\ShouldQueue;

class UpdateBalanceOnLeaveCancellation implements ShouldQueue
{
    public function __construct(private LeaveBalanceService $leaveBalanceService) {}

    public function handle(LeaveCancelled $event): void
    {
        $this->leaveBalanceService->handleLeaveCancellation($event->leave);
    }
}
