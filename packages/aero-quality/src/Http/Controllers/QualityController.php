<?php

namespace Aero\Quality\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Aero\Quality\Models\QualityInspection;

class QualityController extends Controller
{
    public function dashboard()
    {
        return Inertia::render('Quality/Dashboard', [
            'title' => 'Quality Dashboard',
        ]);
    }

    public function index()
    {
        return Inertia::render('Quality/Dashboard', [
            'title' => 'Quality Management',
        ]);
    }
}
