<?php

namespace Aero\Quality\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Aero\Quality\Models\NonConformanceReport;

class NCRController extends Controller
{
    public function index()
    {
        return Inertia::render('Quality/NCR/Index', [
            'title' => 'Non-Conformance Reports',
        ]);
    }

    public function create()
    {
        return Inertia::render('Quality/NCR/Create', [
            'title' => 'Create NCR',
        ]);
    }

    public function store(Request $request)
    {
        // Validation and storage logic
        return redirect()->route('quality.ncrs.index');
    }

    public function show($id)
    {
        return Inertia::render('Quality/NCR/Show', [
            'title' => 'NCR Details',
        ]);
    }

    public function edit($id)
    {
        return Inertia::render('Quality/NCR/Edit', [
            'title' => 'Edit NCR',
        ]);
    }

    public function update(Request $request, $id)
    {
        // Update logic
        return redirect()->route('quality.ncrs.show', $id);
    }

    public function destroy($id)
    {
        // Delete logic
        return redirect()->route('quality.ncrs.index');
    }
}
