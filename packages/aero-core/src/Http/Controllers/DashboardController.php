<?php

namespace Aero\Core\Http\Controllers;

use Aero\Core\Http\Requests\StoreAnnouncementRequest;
use Aero\Core\Models\Announcement;
use Aero\Core\Services\Dashboard\AdminDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Dashboard Controller
 *
 * Main dashboard for the core system.
 * Aggregates widgets from Core and all active modules.
 */
class DashboardController extends Controller
{
    public function __construct(
        protected AdminDashboardService $dashboardService,
    ) {}

    /**
     * Display the main dashboard.
     */
    public function index(Request $request): Response
    {
        return Inertia::render('Core/Dashboard', [
            'title' => 'Dashboard',

            // Immediate props (small, fast)
            'welcomeData' => $this->dashboardService->getWelcomeData(),
            'coreStats' => $this->dashboardService->getCoreStats(),
            'subscriptionInfo' => $this->dashboardService->getSubscriptionInfo(),
            'quickActions' => $this->dashboardService->getQuickActions(),
            'announcements' => $this->dashboardService->getAnnouncements(),

            // Deferred props (loaded async after page render)
            'securityOverview' => Inertia::defer(fn () => $this->dashboardService->getSecurityOverview()),
            'recentAuditLog' => Inertia::defer(fn () => $this->dashboardService->getRecentAuditLog()),
            'storageAnalytics' => Inertia::defer(fn () => $this->dashboardService->getStorageAnalytics()),
            'systemHealth' => Inertia::defer(fn () => $this->dashboardService->getSystemHealth()),
            'onboardingProgress' => Inertia::defer(fn () => $this->dashboardService->getOnboardingProgress()),
            'pendingApprovals' => Inertia::defer(fn () => $this->dashboardService->getPendingApprovals()),
            'upcomingEvents' => Inertia::defer(fn () => $this->dashboardService->getUpcomingEvents()),
        ]);
    }

    /**
     * Get dashboard stats (for async loading).
     */
    public function stats(Request $request): JsonResponse
    {
        return response()->json($this->dashboardService->getCoreStats());
    }

    /**
     * User activity chart data.
     */
    public function userActivity(Request $request): JsonResponse
    {
        $period = $request->input('period', 'week');

        return response()->json(
            $this->dashboardService->getUserActivity($period)
        );
    }

    /**
     * Store a new announcement.
     */
    public function storeAnnouncement(StoreAnnouncementRequest $request): JsonResponse
    {
        $announcement = Announcement::create([
            ...$request->validated(),
            'author_id' => $request->user()->id,
        ]);

        Cache::forget('admin_dashboard.announcements');

        return response()->json([
            'message' => 'Announcement created successfully.',
            'data' => $announcement,
        ]);
    }

    /**
     * Delete an announcement.
     */
    public function destroyAnnouncement(Announcement $announcement): JsonResponse
    {
        $announcement->delete();

        Cache::forget('admin_dashboard.announcements');

        return response()->json([
            'message' => 'Announcement deleted successfully.',
        ]);
    }

    /**
     * Dismiss an announcement for the current user.
     */
    public function dismissAnnouncement(Announcement $announcement, Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $dismissed = $announcement->dismissed_by ?? [];

        if (! in_array($userId, $dismissed)) {
            $dismissed[] = $userId;
            $announcement->update(['dismissed_by' => $dismissed]);
        }

        Cache::forget('admin_dashboard.announcements');

        return response()->json(['message' => 'Announcement dismissed.']);
    }

    /**
     * Get widget data for a specific widget (for lazy loading).
     */
    public function widgetData(Request $request, string $widgetKey): JsonResponse
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
