<?php

namespace Aero\Quality\Http\Controllers;

use Illuminate\Routing\Controller;
use Inertia\Inertia;

class LabController extends Controller
{
    /**
     * Display the Concrete Cube Register page.
     */
    public function concrete()
    {
        return Inertia::render('Quality/Lab/Concrete', [
            'title' => 'Concrete Cube Register',
        ]);
    }

    /**
     * Display the Soil Density Tests page.
     */
    public function soil()
    {
        return Inertia::render('Quality/Lab/Soil', [
            'title' => 'Soil Density Tests',
        ]);
    }

    /**
     * Display the Material Submittals page.
     */
    public function materials()
    {
        return Inertia::render('Quality/Lab/Materials', [
            'title' => 'Material Submittals',
        ]);
    }
}
