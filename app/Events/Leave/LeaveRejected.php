<?php

namespace App\Events\Leave;

use App\Models\HRM\Leave;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LeaveRejected
{
    use Dispatchable, SerializesModels;

    public function __construct(public Leave $leave) {}
}
