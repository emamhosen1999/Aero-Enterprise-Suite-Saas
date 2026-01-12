<?php

namespace Aero\Quality\Http\Controllers;

use Aero\Core\Services\DashboardWidgetRegistry;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Aero\Quality\Models\QualityInspection;

class QualityController extends Controller
{
    public function __construct(
        protected DashboardWidgetRegistry $widgetRegistry
    ) {}

    public function dashboard()
    {
        // Get dynamic widgets for Quality dashboard
        $dynamicWidgets = $this->widgetRegistry->getWidgetsForFrontend('quality');

        return Inertia::render('Quality/Dashboard', [
            'title' => 'Quality Dashboard',
            'dynamicWidgets' => $dynamicWidgets,
        ]);
    }

    public function index()
    {
        // Get dynamic widgets for Quality dashboard
        $dynamicWidgets = $this->widgetRegistry->getWidgetsForFrontend('quality');

        return Inertia::render('Quality/Dashboard', [
            'title' => 'Quality Management',
            'dynamicWidgets' => $dynamicWidgets,
        ]);
    }
}
