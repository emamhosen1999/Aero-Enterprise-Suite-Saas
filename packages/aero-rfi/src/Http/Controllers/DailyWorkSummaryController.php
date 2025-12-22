<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Core\Models\User;
use Aero\Rfi\Models\DailyWork;
use Aero\Rfi\Models\WorkLocation;
use Aero\Rfi\Services\DailyWorkSummaryService;
use Aero\Rfi\Traits\DailyWorkFilterable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * DailyWorkSummaryController
 *
 * Handles Daily Work summary, statistics, and aggregate views.
 */
class DailyWorkSummaryController extends Controller
{
    use DailyWorkFilterable;

    public function __construct(
        protected DailyWorkSummaryService $summaryService
    ) {}

    /**
     * Display daily work summary page.
     */
    public function index(): Response
    {
        $user = User::with('designation')->find(Auth::id());
        $userDesignationTitle = $user->designation?->title ?? null;

        // Get daily works based on user role
        $query = DailyWork::with(['inchargeUser', 'assignedUser']);

        if ($userDesignationTitle === 'Supervision Engineer') {
            $query->where('incharge_user_id', $user->id);
        }

        $dailyWorks = $query->get();
        $summaries = $this->generateSummariesFromDailyWorks($dailyWorks);

        $inCharges = User::whereHas('designation', function ($q) {
            $q->where('title', 'Supervision Engineer');
        })->get(['id', 'name']);

        return Inertia::render('Rfi/DailyWorks/Summary/Index', [
            'summary' => $summaries,
            'workLocations' => WorkLocation::active()->get(['id', 'name']),
            'inCharges' => $inCharges,
            'title' => 'Daily Work Summary',
        ]);
    }

    /**
     * Filter summary by date range, incharge, and work location.
     */
    public function filterSummary(Request $request): JsonResponse
    {
        $user = User::with('designation')->find(Auth::id());
        $userDesignationTitle = $user->designation?->title ?? null;

        try {
            $query = DailyWork::with(['inchargeUser', 'assignedUser']);

            // Apply user role filter
            if ($userDesignationTitle === 'Supervision Engineer') {
                $query->where('incharge_user_id', $user->id);
            }

            // Apply date range filter
            if ($request->has('startDate') && $request->has('endDate')) {
                $query->whereBetween('date', [$request->startDate, $request->endDate]);
            } elseif ($request->has('month')) {
                $startDate = date('Y-m-01', strtotime($request->month));
                $endDate = date('Y-m-t', strtotime($request->month));
                $query->whereBetween('date', [$startDate, $endDate]);
            }

            $inchargeFilter = $this->normalizeIdFilter($request->input('incharge'));
            $workLocationFilter = $this->normalizeIdFilter($request->input('work_location_id'));

            $this->applyInchargeWorkLocationFilters($query, $inchargeFilter, $workLocationFilter);

            $filteredWorks = $query->get();
            $summaries = $this->generateSummariesFromDailyWorks($filteredWorks);

            return response()->json([
                'summaries' => $summaries,
                'message' => 'Summary filtered successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while filtering summary: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Export daily summary data.
     */
    public function exportDailySummary(Request $request): JsonResponse
    {
        $user = User::with('designation')->find(Auth::id());
        $userDesignationTitle = $user->designation?->title ?? null;

        try {
            $query = DailyWork::with(['inchargeUser', 'assignedUser']);

            // Apply user role filter
            if ($userDesignationTitle === 'Supervision Engineer') {
                $query->where('incharge_user_id', $user->id);
            }

            // Apply filters from request
            if ($request->has('startDate') && $request->has('endDate')) {
                $query->whereBetween('date', [$request->startDate, $request->endDate]);
            }

            $inchargeFilter = $this->normalizeIdFilter($request->input('incharge'));
            $workLocationFilter = $this->normalizeIdFilter($request->input('work_location_id'));

            $this->applyInchargeWorkLocationFilters($query, $inchargeFilter, $workLocationFilter);

            $dailyWorks = $query->get();
            $summaries = $this->generateSummariesFromDailyWorks($dailyWorks);

            return response()->json([
                'data' => $summaries,
                'message' => 'Export data prepared successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Export failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get comprehensive statistics for current user's daily works.
     */
    public function getStatistics(Request $request): JsonResponse
    {
        $user = User::with(['designation', 'roles'])->find(Auth::id());
        $userDesignationTitle = $user->designation?->title ?? null;
        $userRoles = $user->roles->pluck('name')->toArray();

        $query = DailyWork::query();

        // Check if user is Super Administrator or Administrator
        $isAdmin = in_array('Super Administrator', $userRoles) || in_array('Administrator', $userRoles);

        // Filter based on user role
        if ($isAdmin) {
            // Super Administrator and Administrator get all data - no filtering
        } elseif ($userDesignationTitle === 'Supervision Engineer') {
            $query->where('incharge_user_id', $user->id);
        } else {
            $query->where(function ($q) use ($user) {
                $q->where('assigned_user_id', $user->id)
                    ->orWhere('incharge_user_id', $user->id);
            });
        }

        // Apply date range if provided
        if ($request->has('startDate') && $request->has('endDate')) {
            $query->whereBetween('date', [$request->startDate, $request->endDate]);
        }

        $dailyWorks = $query->get();

        // Calculate comprehensive statistics
        $totalWorks = $dailyWorks->count();

        // Status counts - handle both formats (e.g., 'completed' or 'completed:pass')
        $completedWorks = $dailyWorks->filter(function ($work) {
            return $work->status === 'completed' || str_starts_with($work->status ?? '', 'completed:');
        })->count();

        $pendingWorks = $dailyWorks->whereIn('status', ['new', 'pending', 'resubmission', 'in-progress'])->count();
        $inProgressWorks = $dailyWorks->where('status', 'in-progress')->count();
        $newWorks = $dailyWorks->where('status', 'new')->count();
        $emergencyWorks = $dailyWorks->where('status', 'emergency')->count();
        $resubmissionWorks = $dailyWorks->where('status', 'resubmission')->count();

        // Inspection results
        $passedInspections = $dailyWorks->filter(function ($work) {
            return in_array($work->inspection_result, ['pass', 'approved']);
        })->count();

        $failedInspections = $dailyWorks->filter(function ($work) {
            return in_array($work->inspection_result, ['fail', 'rejected']);
        })->count();

        $conditionalInspections = $dailyWorks->where('inspection_result', 'conditional')->count();
        $pendingInspections = $dailyWorks->where('inspection_result', 'pending')->count();

        // RFI and resubmission metrics
        $rfiSubmissions = $dailyWorks->whereNotNull('rfi_submission_date')->count();
        $worksWithResubmissions = $dailyWorks->where('resubmission_count', '>', 0)->count();
        $totalResubmissions = (int) $dailyWorks->sum('resubmission_count');

        // Time metrics
        $worksWithCompletionTime = $dailyWorks->whereNotNull('completion_time')->count();

        // Type breakdown
        $embankmentCount = $dailyWorks->filter(fn ($w) => stripos($w->type ?? '', 'embankment') !== false)->count();
        $structureCount = $dailyWorks->filter(fn ($w) => stripos($w->type ?? '', 'structure') !== false)->count();
        $pavementCount = $dailyWorks->filter(fn ($w) => stripos($w->type ?? '', 'pavement') !== false)->count();

        // Recent activity
        $todayWorks = $dailyWorks->filter(fn ($w) => $w->date?->isToday())->count();
        $thisWeekWorks = $dailyWorks->filter(fn ($w) => $w->date?->isCurrentWeek())->count();
        $thisMonthWorks = $dailyWorks->filter(fn ($w) => $w->date?->isCurrentMonth())->count();

        // Performance indicators
        $completionRate = $totalWorks > 0 ? round(($completedWorks / $totalWorks) * 100, 1) : 0;

        $totalInspected = $passedInspections + $failedInspections + $conditionalInspections;
        $inspectionPassRate = $totalInspected > 0
            ? round(($passedInspections / $totalInspected) * 100, 1)
            : 0;

        $rfiRate = $totalWorks > 0 ? round(($rfiSubmissions / $totalWorks) * 100, 1) : 0;

        // First-time pass rate (works that passed without resubmissions)
        $firstTimePassCount = $dailyWorks->filter(function ($work) {
            return in_array($work->inspection_result, ['pass', 'approved'])
                && ($work->resubmission_count ?? 0) === 0;
        })->count();
        $firstTimePassRate = $completedWorks > 0
            ? round(($firstTimePassCount / $completedWorks) * 100, 1)
            : 0;

        $stats = [
            'overview' => [
                'totalWorks' => $totalWorks,
                'completedWorks' => $completedWorks,
                'pendingWorks' => $pendingWorks,
                'inProgressWorks' => $inProgressWorks,
                'newWorks' => $newWorks,
                'emergencyWorks' => $emergencyWorks,
            ],
            'statusBreakdown' => [
                'new' => $newWorks,
                'in_progress' => $inProgressWorks,
                'completed' => $completedWorks,
                'resubmission' => $resubmissionWorks,
                'emergency' => $emergencyWorks,
            ],
            'typeBreakdown' => [
                'embankment' => $embankmentCount,
                'structure' => $structureCount,
                'pavement' => $pavementCount,
            ],
            'qualityMetrics' => [
                'rfiSubmissions' => $rfiSubmissions,
                'worksWithResubmissions' => $worksWithResubmissions,
                'totalResubmissions' => $totalResubmissions,
                'passedInspections' => $passedInspections,
                'failedInspections' => $failedInspections,
                'conditionalInspections' => $conditionalInspections,
                'pendingInspections' => $pendingInspections,
            ],
            'timeMetrics' => [
                'worksWithCompletionTime' => $worksWithCompletionTime,
                'averageResubmissions' => $worksWithResubmissions > 0
                    ? round($totalResubmissions / $worksWithResubmissions, 1)
                    : 0,
            ],
            'recentActivity' => [
                'todayWorks' => $todayWorks,
                'thisWeekWorks' => $thisWeekWorks,
                'thisMonthWorks' => $thisMonthWorks,
            ],
            'userRole' => [
                'designation' => $userDesignationTitle,
                'isIncharge' => $userDesignationTitle === 'Supervision Engineer',
                'totalAsIncharge' => $dailyWorks->where('incharge_user_id', $user->id)->count(),
                'totalAsAssigned' => $dailyWorks->where('assigned_user_id', $user->id)->count(),
            ],
            'performanceIndicators' => [
                'completionRate' => $completionRate,
                'inspectionPassRate' => $inspectionPassRate,
                'firstTimePassRate' => $firstTimePassRate,
                'rfiRate' => $rfiRate,
                'qualityRate' => $inspectionPassRate, // Alias for backward compatibility
            ],
        ];

        return response()->json($stats);
    }

    /**
     * Generate summaries from daily works collection.
     *
     * @param \Illuminate\Support\Collection $dailyWorks
     * @return array
     */
    private function generateSummariesFromDailyWorks($dailyWorks): array
    {
        // Group by date
        $groupedByDate = $dailyWorks->groupBy(fn ($work) => $work->date?->format('Y-m-d'));

        $summaries = [];

        foreach ($groupedByDate as $date => $works) {
            $totalWorks = $works->count();
            $completed = $works->where('status', 'completed')->count();
            $rfiSubmissions = $works->whereNotNull('rfi_submission_date')->count();

            // Group by type
            $typeBreakdown = $works->groupBy('type');

            $summary = [
                'date' => $date,
                'totalDailyWorks' => $totalWorks,
                'completed' => $completed,
                'pending' => $totalWorks - $completed,
                'rfiSubmissions' => $rfiSubmissions,
                'completionPercentage' => $totalWorks > 0 ? round(($completed / $totalWorks) * 100, 1) : 0,
                'rfiSubmissionPercentage' => $totalWorks > 0 ? round(($rfiSubmissions / $totalWorks) * 100, 1) : 0,
                'embankment' => $typeBreakdown->get('Embankment', collect())->count(),
                'structure' => $typeBreakdown->get('Structure', collect())->count(),
                'pavement' => $typeBreakdown->get('Pavement', collect())->count(),
                'resubmissions' => $works->where('resubmission_count', '>', 0)->count(),
            ];

            $summaries[] = $summary;
        }

        // Sort by date descending
        usort($summaries, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return $summaries;
    }

    /**
     * Refresh summary data.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh(): JsonResponse
    {
        return response()->json([
            'message' => 'Summary is automatically calculated from current data - no refresh needed',
        ]);
    }

    /**
     * Legacy daily summary method - redirects to index.
     */
    public function dailySummary(): Response
    {
        return $this->index();
    }
}
