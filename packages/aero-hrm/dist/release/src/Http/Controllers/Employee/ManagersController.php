<?php

namespace Aero\HRM\Http\Controllers\Employee;

use Aero\HRM\Http\Controllers\Controller;
use Aero\Core\Models\User;

class ManagersController extends Controller
{
    /**
     * Get a list of all managers for dropdowns.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        // Use the same query as in RecruitmentController
        $managers = User::role(['Super Administrator', 'Administrator', 'HR Manager', 'Department Manager', 'Team Lead'])
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return response()->json($managers);
    }
}
