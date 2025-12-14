<?php

namespace Aero\Platform\Http\Controllers\Integrations;

use Aero\Platform\Http\Controllers\Controller;
use Inertia\Inertia;

/**
 * Integration Dashboard Controller
 *
 * Handles the integrations dashboard displaying connected services and status
 */
class IntegrationDashboardController extends Controller
{
    /**
     * Display the integrations dashboard
     */
    public function index()
    {
        // TODO: Fetch integrations and their status from database
        $integrations = [];
        $stats = [
            'total_integrations' => 0,
            'active_integrations' => 0,
            'failed_syncs' => 0,
            'last_sync' => null,
        ];

        return Inertia::render('Pages/Shared/Integrations/Dashboard', [
            'title' => 'Integrations Dashboard',
            'integrations' => $integrations,
            'stats' => $stats,
        ]);
    }
}
