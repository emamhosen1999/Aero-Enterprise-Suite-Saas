<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Core\Models\User;
use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\WorkLocation;
use Aero\Rfi\Services\RfiSummaryService;
use Aero\Rfi\Traits\RfiFilterable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * RfiSummaryController
 *
 * Handles RFI summary, statistics, and aggregate views.
 */
class RfiSummaryController extends Controller
{
    use RfiFilterable;

    public function __construct(
        protected RfiSummaryService $summaryService
    ) {}

    /**
     * Display RFI summary page.
     */
    public function index(): Response
    {
        $user = User::with('designation')->find(Auth::id());
        $userDesignationTitle = $user->designation?->title ?? null;

        // Get RFIs based on user role
        $query = Rfi::with(['inchargeUser', 'assignedUser']);

        if ($userDesignationTitle === 'Supervision Engineer') {
            $query->where('incharge_user_id', $user->id);
        }

        $rfis = $query->get();
        $summaries = $this->generateSummariesFromRfis($rfis);

        $inCharges = User::whereHas('designation', function ($q) {
            $q->where('title', 'Supervision Engineer');
        })->get(['id', 'name']);

        return Inertia::render('Rfi/Summary/Index', [
            'summary' => $summaries,
            'workLocations' => WorkLocation::active()->get(['id', 'name']),
            'inCharges' => $inCharges,
            'title' => 'RFI Summary',
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
            $query = Rfi::with(['inchargeUser', 'assignedUser']);

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

            $filteredRfis = $query->get();
            $summaries = $this->generateSummariesFromRfis($filteredRfis);

            return response()->json([
                'summaries' => $summaries,
                'message' => 'Summary filtered successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'An error occurred while filtering summary: '.$e->getMessage(),
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
            $query = Rfi::with(['inchargeUser', 'assignedUser']);

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

            $rfis = $query->get();
            $summaries = $this->generateSummariesFromRfis($rfis);

            return response()->json([
                'data' => $summaries,
                'message' => 'Export data prepared successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Export failed: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get comprehensive statistics for current user's RFIs.
     */
    public function getStatistics(Request $request): JsonResponse
    {
        $user = User::with(['designation', 'roles'])->find(Auth::id());
        $userDesignationTitle = $user->designation?->title ?? null;
        $userRoles = $user->roles->pluck('name')->toArray();

        $query = Rfi::query();

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

        $rfis = $query->get();

        // Calculate comprehensive statistics
        $totalRfis = $rfis->count();

        // Status counts - handle both formats (e.g., 'completed' or 'completed:pass')
        $completedRfis = $rfis->filter(function ($rfi) {
            return $rfi->status === 'completed' || str_starts_with($rfi->status ?? '', 'completed:');
        })->count();

        $pendingRfis = $rfis->whereIn('status', ['new', 'pending', 'resubmission', 'in-progress'])->count();
        $inProgressRfis = $rfis->where('status', 'in-progress')->count();
        $newRfis = $rfis->where('status', 'new')->count();
        $emergencyRfis = $rfis->where('status', 'emergency')->count();
        $resubmissionRfis = $rfis->where('status', 'resubmission')->count();

        // Inspection results
        $passedInspections = $rfis->filter(function ($rfi) {
            return in_array($rfi->inspection_result, ['pass', 'approved']);
        })->count();

        $failedInspections = $rfis->filter(function ($rfi) {
            return in_array($rfi->inspection_result, ['fail', 'rejected']);
        })->count();

        $conditionalInspections = $rfis->where('inspection_result', 'conditional')->count();
        $pendingInspections = $rfis->where('inspection_result', 'pending')->count();

        // RFI and resubmission metrics
        $rfiSubmissions = $rfis->whereNotNull('rfi_submission_date')->count();
        $rfisWithResubmissions = $rfis->where('resubmission_count', '>', 0)->count();
        $totalResubmissions = (int) $rfis->sum('resubmission_count');

        // Time metrics
        $rfisWithCompletionTime = $rfis->whereNotNull('completion_time')->count();

        // Type breakdown
        $embankmentCount = $rfis->filter(fn ($r) => stripos($r->type ?? '', 'embankment') !== false)->count();
        $structureCount = $rfis->filter(fn ($r) => stripos($r->type ?? '', 'structure') !== false)->count();
        $pavementCount = $rfis->filter(fn ($r) => stripos($r->type ?? '', 'pavement') !== false)->count();

        // Recent activity
        $todayRfis = $rfis->filter(fn ($r) => $r->date?->isToday())->count();
        $thisWeekRfis = $rfis->filter(fn ($r) => $r->date?->isCurrentWeek())->count();
        $thisMonthRfis = $rfis->filter(fn ($r) => $r->date?->isCurrentMonth())->count();

        // Performance indicators
        $completionRate = $totalRfis > 0 ? round(($completedRfis / $totalRfis) * 100, 1) : 0;

        $totalInspected = $passedInspections + $failedInspections + $conditionalInspections;
        $inspectionPassRate = $totalInspected > 0
            ? round(($passedInspections / $totalInspected) * 100, 1)
            : 0;

        $rfiRate = $totalRfis > 0 ? round(($rfiSubmissions / $totalRfis) * 100, 1) : 0;

        // First-time pass rate (RFIs that passed without resubmissions)
        $firstTimePassCount = $rfis->filter(function ($rfi) {
            return in_array($rfi->inspection_result, ['pass', 'approved'])
                && ($rfi->resubmission_count ?? 0) === 0;
        })->count();
        $firstTimePassRate = $completedRfis > 0
            ? round(($firstTimePassCount / $completedRfis) * 100, 1)
            : 0;

        $stats = [
            'overview' => [
                'totalWorks' => $totalRfis,
                'completedWorks' => $completedRfis,
                'pendingWorks' => $pendingRfis,
                'inProgressWorks' => $inProgressRfis,
                'newWorks' => $newRfis,
                'emergencyWorks' => $emergencyRfis,
            ],
            'statusBreakdown' => [
                'new' => $newRfis,
                'in_progress' => $inProgressRfis,
                'completed' => $completedRfis,
                'resubmission' => $resubmissionRfis,
                'emergency' => $emergencyRfis,
            ],
            'typeBreakdown' => [
                'embankment' => $embankmentCount,
                'structure' => $structureCount,
                'pavement' => $pavementCount,
            ],
            'qualityMetrics' => [
                'rfiSubmissions' => $rfiSubmissions,
                'worksWithResubmissions' => $rfisWithResubmissions,
                'totalResubmissions' => $totalResubmissions,
                'passedInspections' => $passedInspections,
                'failedInspections' => $failedInspections,
                'conditionalInspections' => $conditionalInspections,
                'pendingInspections' => $pendingInspections,
            ],
            'timeMetrics' => [
                'worksWithCompletionTime' => $rfisWithCompletionTime,
                'averageResubmissions' => $rfisWithResubmissions > 0
                    ? round($totalResubmissions / $rfisWithResubmissions, 1)
                    : 0,
            ],
            'recentActivity' => [
                'todayWorks' => $todayRfis,
                'thisWeekWorks' => $thisWeekRfis,
                'thisMonthWorks' => $thisMonthRfis,
            ],
            'userRole' => [
                'designation' => $userDesignationTitle,
                'isIncharge' => $userDesignationTitle === 'Supervision Engineer',
                'totalAsIncharge' => $rfis->where('incharge_user_id', $user->id)->count(),
                'totalAsAssigned' => $rfis->where('assigned_user_id', $user->id)->count(),
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
     * Generate summaries from RFIs collection.
     *
     * @param  \Illuminate\Support\Collection  $rfis
     * @return array
     */
    private function generateSummariesFromRfis($rfis): array
    {
        // Group by date
        $groupedByDate = $rfis->groupBy(fn ($rfi) => $rfi->date?->format('Y-m-d'));

        $summaries = [];

        foreach ($groupedByDate as $date => $items) {
            $totalItems = $items->count();
            $completed = $items->where('status', 'completed')->count();
            $rfiSubmissions = $items->whereNotNull('rfi_submission_date')->count();

            // Group by type
            $typeBreakdown = $items->groupBy('type');

            $summary = [
                'date' => $date,
                'totalRfis' => $totalItems,
                'completed' => $completed,
                'pending' => $totalItems - $completed,
                'rfiSubmissions' => $rfiSubmissions,
                'completionPercentage' => $totalItems > 0 ? round(($completed / $totalItems) * 100, 1) : 0,
                'rfiSubmissionPercentage' => $totalItems > 0 ? round(($rfiSubmissions / $totalItems) * 100, 1) : 0,
                'embankment' => $typeBreakdown->get('Embankment', collect())->count(),
                'structure' => $typeBreakdown->get('Structure', collect())->count(),
                'pavement' => $typeBreakdown->get('Pavement', collect())->count(),
                'resubmissions' => $items->where('resubmission_count', '>', 0)->count(),
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
