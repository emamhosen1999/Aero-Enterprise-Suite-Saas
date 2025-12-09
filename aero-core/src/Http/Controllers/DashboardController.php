<?php

namespace Aero\Core\Http\Controllers;

use Aero\Core\Models\User;
use Aero\Core\Services\NavigationRegistry;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

/**
 * Dashboard Controller
 *
 * Main dashboard for the core system.
 */
class DashboardController extends Controller
{
    /**
     * Display the main dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get navigation from registry
        $navigationRegistry = app(NavigationRegistry::class);
        $navigation = $navigationRegistry->all();

        // Basic stats with null safety
        $stats = [
            'totalUsers' => User::count(),
            'activeUsers' => User::where('active', true)->count(),
            'totalRoles' => Role::count(),
            'recentUsers' => User::latest()->take(5)->get(['id', 'name', 'email', 'created_at']),
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

        return Inertia::render('Core/Dashboard', [
            'title' => 'Dashboard',
            'stats' => $stats,
            'navigation' => $navigation,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $userRoles,
            ],
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
}
