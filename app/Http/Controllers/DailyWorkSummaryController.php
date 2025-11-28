<?php

namespace App\Http\Controllers;

use App\Models\DailyWork;
use App\Models\Jurisdiction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DailyWorkSummaryController extends Controller
{
    public function index()
    {
        $user = User::with('designation')->find(Auth::id());
        $userDesignationTitle = $user->designation?->title;

        // Get daily works based on user role
        $query = DailyWork::with(['inchargeUser', 'assignedUser']);

        if ($userDesignationTitle === 'Supervision Engineer') {
            $query->where('incharge', $user->id);
        }

        $dailyWorks = $query->get();
        $summaries = $this->generateSummariesFromDailyWorks($dailyWorks);

        $inCharges = User::whereHas('designation', function ($q) {
            $q->where('title', 'Supervision Engineer');
        })->get();

        return Inertia::render('Project/DailyWorkSummary', [
            'summary' => $summaries,
            'jurisdictions' => Jurisdiction::all(),
            'inCharges' => $inCharges,
            'title' => 'Daily Work Summary',
        ]);
    }

    public function filterSummary(Request $request)
    {
        $user = User::with('designation')->find(Auth::id());
        $userDesignationTitle = $user->designation?->title;

        try {
            $query = DailyWork::with(['inchargeUser', 'assignedUser']);

            // Apply user role filter
            if ($userDesignationTitle === 'Supervision Engineer') {
                $query->where('incharge', $user->id);
            }

            // Apply date range filter
            if ($request->has('startDate') && $request->has('endDate')) {
                $query->whereBetween('date', [$request->startDate, $request->endDate]);
            } elseif ($request->has('month')) {
                $startDate = date('Y-m-01', strtotime($request->month));
                $endDate = date('Y-m-t', strtotime($request->month));
                $query->whereBetween('date', [$startDate, $endDate]);
            }

            // Apply incharge filter
            if ($request->has('incharge') && $request->incharge !== 'all') {
                $query->where('incharge', $request->incharge);
            }

            $filteredWorks = $query->get();
            $summaries = $this->generateSummariesFromDailyWorks($filteredWorks);

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

    public function exportDailySummary(Request $request)
    {
        $user = User::with('designation')->find(Auth::id());
        $userDesignationTitle = $user->designation?->title;

        try {
            $query = DailyWork::with(['inchargeUser', 'assignedUser']);

            // Apply user role filter
            if ($userDesignationTitle === 'Supervision Engineer') {
                $query->where('incharge', $user->id);
            }

            // Apply filters from request
            if ($request->has('startDate') && $request->has('endDate')) {
                $query->whereBetween('date', [$request->startDate, $request->endDate]);
            }

            if ($request->has('incharge') && $request->incharge !== 'all') {
                $query->where('incharge', $request->incharge);
            }

            $dailyWorks = $query->get();
            $summaries = $this->generateSummariesFromDailyWorks($dailyWorks);

            // Export logic here - could be Excel, PDF, CSV
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
     * Generate summaries from daily works collection
     */
    private function generateSummariesFromDailyWorks($dailyWorks)
    {
        // Group by date
        $groupedByDate = $dailyWorks->groupBy('date');

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
     * Get comprehensive statistics for current user's daily works
     */
    public function getStatistics(Request $request)
    {
        $user = User::with(['designation', 'roles'])->find(Auth::id());
        $userDesignationTitle = $user->designation?->title;
        $userRoles = $user->roles->pluck('name')->toArray();

        $query = DailyWork::query();

        // Check if user is Super Administrator or Administrator
        $isAdmin = in_array('Super Administrator', $userRoles) || in_array('Administrator', $userRoles);

        // Filter based on user role
        if ($isAdmin) {
            // Super Administrator and Administrator get all data - no filtering
            // Query remains unfiltered to get all daily works
        } elseif ($userDesignationTitle === 'Supervision Engineer') {
            // Get works where user is incharge
            $query->where('incharge', $user->id);
        } else {
            // Get works where user is assigned or incharge
            $query->where(function ($q) use ($user) {
                $q->where('assigned', $user->id)
                    ->orWhere('incharge', $user->id);
            });
        }

        // Apply date range if provided
        if ($request->has('startDate') && $request->has('endDate')) {
            $query->whereBetween('date', [$request->startDate, $request->endDate]);
        }

        $dailyWorks = $query->get();

        // Calculate comprehensive statistics
        $stats = [
            'overview' => [
                'totalWorks' => $dailyWorks->count(),
                'completedWorks' => $dailyWorks->where('status', 'completed')->count(),
                'pendingWorks' => $dailyWorks->whereNotIn('status', ['completed'])->count(),
                'inProgressWorks' => $dailyWorks->where('status', 'in_progress')->count(),
                'newWorks' => $dailyWorks->where('status', 'new')->count(),
            ],
            'statusBreakdown' => [
                'new' => $dailyWorks->where('status', 'new')->count(),
                'in_progress' => $dailyWorks->where('status', 'in_progress')->count(),
                'completed' => $dailyWorks->where('status', 'completed')->count(),
                'under_review' => $dailyWorks->where('status', 'under_review')->count(),
                'approved' => $dailyWorks->where('status', 'approved')->count(),
            ],
            'typeBreakdown' => [
                'embankment' => $dailyWorks->filter(function ($work) {
                    return stripos($work->type, 'embankment') !== false;
                })->count(),
                'structure' => $dailyWorks->filter(function ($work) {
                    return stripos($work->type, 'structure') !== false;
                })->count(),
                'pavement' => $dailyWorks->filter(function ($work) {
                    return stripos($work->type, 'pavement') !== false;
                })->count(),
            ],
            'qualityMetrics' => [
                'rfiSubmissions' => $dailyWorks->whereNotNull('rfi_submission_date')->count(),
                'resubmissions' => $dailyWorks->where('resubmission_count', '>', 0)->count(),
                'totalResubmissions' => $dailyWorks->sum('resubmission_count'),
                'passedInspections' => $dailyWorks->where('inspection_result', 'passed')->count(),
                'failedInspections' => $dailyWorks->where('inspection_result', 'failed')->count(),
            ],
            'timeMetrics' => [
                'worksWithCompletionTime' => $dailyWorks->whereNotNull('completion_time')->count(),
                'worksWithSubmissionTime' => $dailyWorks->whereNotNull('submission_time')->count(),
                'averageResubmissions' => $dailyWorks->where('resubmission_count', '>', 0)->avg('resubmission_count') ?? 0,
            ],
            'recentActivity' => [
                'todayWorks' => $dailyWorks->where('date', now()->toDateString())->count(),
                'thisWeekWorks' => $dailyWorks->whereBetween('date', [
                    now()->startOfWeek()->toDateString(),
                    now()->endOfWeek()->toDateString(),
                ])->count(),
                'thisMonthWorks' => $dailyWorks->whereBetween('date', [
                    now()->startOfMonth()->toDateString(),
                    now()->endOfMonth()->toDateString(),
                ])->count(),
            ],
            'userRole' => [
                'designation' => $userDesignationTitle,
                'isIncharge' => $userDesignationTitle === 'Supervision Engineer',
                'totalAsIncharge' => $dailyWorks->where('incharge', $user->id)->count(),
                'totalAsAssigned' => $dailyWorks->where('assigned', $user->id)->count(),
            ],
            'performanceIndicators' => [
                'completionRate' => $dailyWorks->count() > 0 ? round(($dailyWorks->where('status', 'completed')->count() / $dailyWorks->count()) * 100, 2) : 0,
                'qualityRate' => $dailyWorks->whereNotNull('inspection_result')->count() > 0 ?
                    round(($dailyWorks->where('inspection_result', 'passed')->count() / $dailyWorks->whereNotNull('inspection_result')->count()) * 100, 2) : 0,
                'rfiRate' => $dailyWorks->count() > 0 ? round(($dailyWorks->whereNotNull('rfi_submission_date')->count() / $dailyWorks->count()) * 100, 2) : 0,
            ],
        ];

        return response()->json($stats);
    }

    /**
     * Refresh is not needed anymore since we calculate on-the-fly
     */
    public function refresh(Request $request)
    {
        return response()->json([
            'message' => 'Summary is automatically calculated from current data - no refresh needed',
        ]);
    }

    public function dailySummary()
    {
        // Legacy method - can be removed or updated
        return $this->index();
    }
}
