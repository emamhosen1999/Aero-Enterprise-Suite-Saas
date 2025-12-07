<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Platform\ErrorLog;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ErrorLogController extends Controller
{
    /**
     * Get current user ID from either landlord or web guard
     */
    private function getCurrentUserId(): ?int
    {
        $landlordUser = Auth::guard('landlord')->user();
        if ($landlordUser) {
            return $landlordUser->id;
        }

        $webUser = Auth::guard('web')->user();
        if ($webUser) {
            return $webUser->id;
        }

        return null;
    }

    /**
     * Display error log listing
     */
    public function index(Request $request): JsonResponse|InertiaResponse
    {
        $query = ErrorLog::query()
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->filled('error_type')) {
            $query->where('error_type', $request->error_type);
        }

        if ($request->filled('http_code')) {
            $query->where('http_code', $request->http_code);
        }

        if ($request->filled('origin')) {
            $query->where('origin', $request->origin);
        }

        if ($request->filled('resolved')) {
            if ($request->resolved === 'resolved') {
                $query->whereNotNull('resolved_at');
            } elseif ($request->resolved === 'unresolved') {
                $query->whereNull('resolved_at');
            }
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
                $q->where('trace_id', 'like', "%{$search}%")
                    ->orWhere('error_message', 'like', "%{$search}%")
                    ->orWhere('request_url', 'like', "%{$search}%")
                    ->orWhere('error_type', 'like', "%{$search}%");
            });
        }

        $errorLogs = $query->paginate($request->input('per_page', 20));

        // Get available error types for filter dropdown
        $errorTypes = ErrorLog::distinct('error_type')->pluck('error_type')->filter()->values();

        // Get available HTTP codes for filter dropdown
        $httpCodes = ErrorLog::distinct('http_code')->pluck('http_code')->filter()->sort()->values();

        // Get statistics
        $stats = [
            'total' => ErrorLog::count(),
            'unresolved' => ErrorLog::whereNull('resolved_at')->count(),
            'resolved' => ErrorLog::whereNotNull('resolved_at')->count(),
            'today' => ErrorLog::whereDate('created_at', today())->count(),
            'frontend' => ErrorLog::where('origin', 'frontend')->count(),
            'backend' => ErrorLog::where('origin', 'backend')->count(),
        ];

        if ($request->wantsJson()) {
            return response()->json([
                'error_logs' => $errorLogs,
                'error_types' => $errorTypes,
                'http_codes' => $httpCodes,
                'stats' => $stats,
            ]);
        }

        return Inertia::render('Admin/ErrorLogs/Index', [
            'errorLogs' => $errorLogs,
            'errorTypes' => $errorTypes,
            'httpCodes' => $httpCodes,
            'stats' => $stats,
            'filters' => $request->only(['error_type', 'http_code', 'origin', 'resolved', 'start_date', 'end_date', 'search']),
        ]);
    }

    /**
     * Show a single error log detail
     */
    public function show(Request $request, ErrorLog $errorLog): JsonResponse|InertiaResponse
    {
        if ($request->wantsJson()) {
            return response()->json([
                'error_log' => $errorLog,
            ]);
        }

        return Inertia::render('Admin/ErrorLogs/Show', [
            'errorLog' => $errorLog,
        ]);
    }

    /**
     * Mark an error as resolved
     *
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
     */
    public function resolve(Request $request, ErrorLog $errorLog)
    {
        $errorLog->update([
            'resolved_at' => now(),
            'resolved_by' => $this->getCurrentUserId(),
        ]);

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Error marked as resolved',
                'error_log' => $errorLog->fresh(),
            ]);
        }

        return back()->with('success', 'Error marked as resolved');
    }

    /**
     * Mark multiple errors as resolved
     */
    public function bulkResolve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:error_logs,id',
        ]);

        ErrorLog::whereIn('id', $validated['ids'])
            ->whereNull('resolved_at')
            ->update([
                'resolved_at' => now(),
                'resolved_by' => $this->getCurrentUserId(),
            ]);

        return response()->json([
            'success' => true,
            'message' => count($validated['ids']).' errors marked as resolved',
        ]);
    }

    /**
     * Delete an error log (soft delete)
     *
     * @return \Illuminate\Http\JsonResponse|\Illuminate\Http\RedirectResponse
     */
    public function destroy(Request $request, ErrorLog $errorLog)
    {
        $errorLog->delete();

        if ($request->wantsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Error log deleted',
            ]);
        }

        return back()->with('success', 'Error log deleted');
    }

    /**
     * Bulk delete error logs
     */
    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:error_logs,id',
        ]);

        ErrorLog::whereIn('id', $validated['ids'])->delete();

        return response()->json([
            'success' => true,
            'message' => count($validated['ids']).' error logs deleted',
        ]);
    }

    /**
     * Get error statistics for dashboard
     */
    public function statistics(Request $request): JsonResponse
    {
        $days = $request->input('days', 7);

        // Errors by day
        $errorsByDay = ErrorLog::selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date' => $row->date,
                'count' => $row->count,
            ]);

        // Top error types
        $topErrorTypes = ErrorLog::selectRaw('error_type, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('error_type')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($row) => [
                'type' => $row->error_type,
                'count' => $row->count,
            ]);

        // Errors by HTTP code
        $errorsByCode = ErrorLog::selectRaw('http_code, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays($days))
            ->whereNotNull('http_code')
            ->groupBy('http_code')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'code' => $row->http_code,
                'count' => $row->count,
            ]);

        // Errors by origin
        $errorsByOrigin = ErrorLog::selectRaw('origin, COUNT(*) as count')
            ->where('created_at', '>=', now()->subDays($days))
            ->groupBy('origin')
            ->get()
            ->pluck('count', 'origin');

        return response()->json([
            'errors_by_day' => $errorsByDay,
            'top_error_types' => $topErrorTypes,
            'errors_by_code' => $errorsByCode,
            'errors_by_origin' => $errorsByOrigin,
            'summary' => [
                'total' => ErrorLog::where('created_at', '>=', now()->subDays($days))->count(),
                'unresolved' => ErrorLog::where('created_at', '>=', now()->subDays($days))->whereNull('resolved_at')->count(),
                'resolved' => ErrorLog::where('created_at', '>=', now()->subDays($days))->whereNotNull('resolved_at')->count(),
            ],
        ]);
    }
}
