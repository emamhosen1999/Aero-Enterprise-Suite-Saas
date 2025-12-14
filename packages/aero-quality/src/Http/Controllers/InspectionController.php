<?php

namespace Aero\Quality\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Aero\Quality\Models\QualityInspection;

class InspectionController extends Controller
{
    public function index()
    {
        return Inertia::render('Pages/Quality/Inspections/Index', [
            'title' => 'Quality Inspections',
        ]);
    }

    public function create()
    {
        return Inertia::render('Pages/Quality/Inspections/Create', [
            'title' => 'Create Inspection',
        ]);
    }

    public function store(Request $request)
    {
        // Validation and storage logic
        return redirect()->route('quality.inspections.index');
    }

    public function show($id)
    {
        return Inertia::render('Pages/Quality/Inspections/Show', [
            'title' => 'Inspection Details',
        ]);
    }

    public function edit($id)
    {
        return Inertia::render('Pages/Quality/Inspections/Edit', [
            'title' => 'Edit Inspection',
        ]);
    }

    public function update(Request $request, $id)
    {
        // Update logic
        return redirect()->route('quality.inspections.show', $id);
    }

    public function destroy($id)
    {
        // Delete logic
        return redirect()->route('quality.inspections.index');
    }
}
