<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\User;

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
