<?php

namespace Aero\HRM\Http\Controllers\Leave;

use Aero\HRM\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaveAccrualController extends Controller
{
    /**
     * Resolve configured user model to avoid cross-package coupling.
     */
    protected function userModel(): string
    {
        return config('hrm.user_model', config('auth.providers.users.model'));
    }

    public function index(): Response
    {
        $users = $this->userModel()::with(['leaveBalances.leaveType'])
            ->orderBy('name')
            ->get();

        return Inertia::render('HRM/TimeOff/Index', [
            'title' => 'Leave Accrual Engine',
            'users' => $users,
        ]);
    }

    public function processAccrual(Request $request)
    {
        // This would handle automatic leave accrual processing
        return response()->json([
            'success' => true,
            'message' => 'Leave accrual processed successfully',
        ]);
    }
}
