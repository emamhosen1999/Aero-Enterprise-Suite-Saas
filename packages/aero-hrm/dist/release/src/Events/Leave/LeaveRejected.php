<?php

namespace Aero\HRM\Events\Leave;

use Aero\HRM\Models\Leave;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LeaveRejected
{
    use Dispatchable, SerializesModels;

    public function __construct(public Leave $leave) {}
}
