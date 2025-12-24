<?php

namespace Aero\Core\Http\Controllers;

use Aero\Core\Models\User;
use Aero\Core\Services\DashboardWidgetRegistry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;



/**
 * Dashboard Controller
 *
 * Main dashboard for the core system.
 * Aggregates widgets from Core and all active modules.
 */
class DashboardController extends Controller
{
    public function __construct(
        protected DashboardWidgetRegistry $widgetRegistry
    ) {}

    /**
     * Display the main dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Basic stats with null safety
        $stats = [
            'totalUsers' => User::count(),
            'activeUsers' => User::where('active', true)->count(),
            'inactiveUsers' => User::where('active', false)->count(),
            'totalRoles' => Role::count(),
            'usersThisMonth' => User::whereMonth('created_at', now()->month)->count(),
        ];

        // Safely get user roles
        $userRoles = [];
        if ($user && method_exists($user, 'roles')) {
            try {
                $userRoles = $user->roles?->pluck('name') ?? collect([]);
            } catch (\Throwable $e) {
                $userRoles = collect([]);
            }
        }

        // Get dynamic widgets from registry (from Core + all modules)
        // The registry handles lazy loading and permission checks
        $dynamicWidgets = $this->widgetRegistry->getWidgetsForFrontend();

        // Note: Navigation is provided by HandleInertiaRequests middleware
        // Do NOT pass 'navigation' here as it would override the middleware's prop
        return Inertia::render('Core/Dashboard', [
            'title' => 'Dashboard',
            'stats' => $stats,
            'dynamicWidgets' => $dynamicWidgets,
        ]);
    }

    /**
     * Get dashboard stats (for async loading).
     */
    public function stats(Request $request)
    {
        return response()->json([
            'totalUsers' => User::count(),
            'activeUsers' => User::where('active', true)->count(),
            'inactiveUsers' => User::where('active', false)->count(),
            'totalRoles' => Role::count(),
            'usersThisMonth' => User::whereMonth('created_at', now()->month)->count(),
        ]);
    }

    /**
     * Get widget data for a specific widget (for lazy loading).
     */
    public function widgetData(Request $request, string $widgetKey)
    {
        $user = $request->user();
        $widgets = $this->widgetRegistry->getWidgets($user);

        foreach ($widgets as $widget) {
            if ($widget->getKey() === $widgetKey) {
                return response()->json([
                    'key' => $widget->getKey(),
                    'data' => $widget->getData($user),
                ]);
            }
        }

        return response()->json(['error' => 'Widget not found'], 404);
    }
}
