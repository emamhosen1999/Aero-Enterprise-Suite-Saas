<?php

namespace Aero\HRM\Events\Leave;

use Aero\Core\Models\User;
use Aero\HRM\Models\Leave;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LeaveCancelled
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Leave $leave,
        public ?User $cancelledBy = null
    ) {}
}
