<?php

namespace Aero\Platform\Http\Controllers\SystemMonitoring;

use Aero\Platform\Services\Monitoring\Tenant\AuditExportService;
use Aero\Platform\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditLogController extends Controller
{
    public function __construct(
        protected AuditExportService $exportService
    ) {}

    /**
     * Display audit log listing
     */
    public function index(Request $request): JsonResponse|InertiaResponse
    {
        $query = Activity::with('causer:id,name,email')
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('log_name')) {
            $query->inLog($request->log_name);
        }

        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->subject_type);
        }

        if ($request->filled('causer_id')) {
            $query->where('causer_id', $request->causer_id);
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', Carbon::parse($request->start_date)->startOfDay());
        }

        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', Carbon::parse($request->end_date)->endOfDay());
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhereHas('causer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $activities = $query->paginate($request->input('per_page', 20));

        // Get available log names for filter dropdown
        $logNames = Activity::distinct('log_name')->pluck('log_name');

        if ($request->wantsJson()) {
            return response()->json([
                'activities' => $activities,
                'log_names' => $logNames,
            ]);
        }

        return Inertia::render('Platform/Admin/AuditLogs/Index', [
            'activities' => $activities,
            'logNames' => $logNames,
            'filters' => $request->only(['log_name', 'subject_type', 'causer_id', 'start_date', 'end_date', 'search']),
        ]);
    }

    /**
     * Show a single activity detail
     */
    public function show(Activity $activity): JsonResponse|InertiaResponse
    {
        $activity->load(['causer', 'subject']);

        if (request()->wantsJson()) {
            return response()->json($activity);
        }

        return Inertia::render('Platform/Admin/AuditLogs/Show', [
            'activity' => $activity,
        ]);
    }

    /**
     * Get activity timeline for a specific subject
     */
    public function timeline(Request $request): JsonResponse
    {
        $request->validate([
            'subject_type' => 'required|string',
            'subject_id' => 'required|integer',
        ]);

        $activities = Activity::forSubject($request->subject_type, $request->subject_id)
            ->with('causer:id,name,email')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'timeline' => $activities->map(fn ($activity) => [
                'id' => $activity->id,
                'description' => $activity->description,
                'log_name' => $activity->log_name,
                'causer' => $activity->causer?->name ?? 'System',
                'changes' => $this->formatChanges($activity),
                'created_at' => $activity->created_at->toIso8601String(),
                'created_at_human' => $activity->created_at->diffForHumans(),
            ]),
        ]);
    }

    /**
     * Get audit log statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $startDate = $request->filled('start_date')
            ? Carbon::parse($request->start_date)
            : null;

        $endDate = $request->filled('end_date')
            ? Carbon::parse($request->end_date)
            : null;

        $stats = $this->exportService->getStatistics(
            $request->log_name,
            $startDate,
            $endDate
        );

        return response()->json($stats);
    }

    /**
     * Export audit logs to CSV
     */
    public function exportCsv(Request $request): StreamedResponse
    {
        return $this->exportService->exportToCsv(
            $request->log_name,
            $request->subject_type,
            $request->causer_id,
            $request->filled('start_date') ? Carbon::parse($request->start_date) : null,
            $request->filled('end_date') ? Carbon::parse($request->end_date) : null,
        );
    }

    /**
     * Export audit logs (unified endpoint for CSV/JSON)
     */
    public function export(Request $request): StreamedResponse
    {
        $format = $request->input('format', 'csv');

        if ($format === 'json') {
            return $this->exportService->exportToJson(
                $request->log_name,
                $request->subject_type,
                $request->causer_id,
                $request->filled('start_date') ? Carbon::parse($request->start_date) : null,
                $request->filled('end_date') ? Carbon::parse($request->end_date) : null,
            );
        }

        return $this->exportService->exportToCsv(
            $request->log_name,
            $request->subject_type,
            $request->causer_id,
            $request->filled('start_date') ? Carbon::parse($request->start_date) : null,
            $request->filled('end_date') ? Carbon::parse($request->end_date) : null,
        );
    }

    /**
     * Export audit logs to JSON
     */
    public function exportJson(Request $request): StreamedResponse
    {
        return $this->exportService->exportToJson(
            $request->log_name,
            $request->subject_type,
            $request->causer_id,
            $request->filled('start_date') ? Carbon::parse($request->start_date) : null,
            $request->filled('end_date') ? Carbon::parse($request->end_date) : null,
        );
    }

    /**
     * Format activity changes for display
     */
    protected function formatChanges(Activity $activity): array
    {
        $changes = [];

        if ($activity->properties->has('old') && $activity->properties->has('attributes')) {
            $old = $activity->properties['old'];
            $new = $activity->properties['attributes'];

            foreach ($new as $key => $value) {
                if (isset($old[$key]) && $old[$key] !== $value) {
                    $changes[] = [
                        'field' => $key,
                        'old' => $old[$key],
                        'new' => $value,
                    ];
                }
            }
        } elseif ($activity->properties->has('attributes')) {
            foreach ($activity->properties['attributes'] as $key => $value) {
                $changes[] = [
                    'field' => $key,
                    'old' => null,
                    'new' => $value,
                ];
            }
        }

        return $changes;
    }
}
