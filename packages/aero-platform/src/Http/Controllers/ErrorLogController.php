<?php

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Models\ErrorLog;
use Aero\Platform\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
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

        if ($request->filled('source_domain')) {
            $query->where('source_domain', $request->source_domain);
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
                    ->orWhere('error_type', 'like', "%{$search}%")
                    ->orWhere('source_domain', 'like', "%{$search}%");
            });
        }

        $errorLogs = $query->paginate($request->input('per_page', 20));

        // Get available error types for filter dropdown
        $errorTypes = ErrorLog::distinct('error_type')->pluck('error_type')->filter()->values();

        // Get available HTTP codes for filter dropdown
        $httpCodes = ErrorLog::distinct('http_code')->pluck('http_code')->filter()->sort()->values();

        // Get available source domains for filter dropdown
        $sourceDomains = ErrorLog::distinct('source_domain')
            ->whereNotNull('source_domain')
            ->pluck('source_domain')
            ->filter()
            ->sort()
            ->values();

        // Get statistics
        $stats = [
            'total' => ErrorLog::count(),
            'unresolved' => ErrorLog::whereNull('resolved_at')->count(),
            'resolved' => ErrorLog::whereNotNull('resolved_at')->count(),
            'today' => ErrorLog::whereDate('created_at', today())->count(),
            'frontend' => ErrorLog::where('origin', 'frontend')->count(),
            'backend' => ErrorLog::where('origin', 'backend')->count(),
            'unique_domains' => ErrorLog::distinct('source_domain')->count(),
        ];

        if ($request->wantsJson()) {
            return response()->json([
                'error_logs' => $errorLogs,
                'error_types' => $errorTypes,
                'http_codes' => $httpCodes,
                'source_domains' => $sourceDomains,
                'stats' => $stats,
            ]);
        }

        return Inertia::render('Platform/Admin/ErrorLogs/Index', [
            'errorLogs' => $errorLogs,
            'errorTypes' => $errorTypes,
            'httpCodes' => $httpCodes,
            'sourceDomains' => $sourceDomains,
            'stats' => $stats,
            'filters' => $request->only(['error_type', 'http_code', 'origin', 'source_domain', 'resolved', 'start_date', 'end_date', 'search']),
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

        return Inertia::render('Platform/Admin/ErrorLogs/Show', [
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

    /**
     * API Endpoint: Receive error reports from remote installations
     *
     * This endpoint is called by standalone installations to report errors
     * to the central platform for monitoring and product improvement.
     *
     * Authentication: X-Aero-License-Key header
     */
    public function receiveRemoteError(Request $request): JsonResponse
    {
        // Validate license key from header
        $licenseKey = $request->header('X-Aero-License-Key');
        $sourceDomain = $request->header('X-Aero-Source-Domain');

        if (empty($licenseKey)) {
            return response()->json([
                'success' => false,
                'error' => 'Missing license key',
            ], 401);
        }

        // TODO: Validate license key against licenses table
        // For now, accept any non-empty license key
        // In production: License::where('key', $licenseKey)->exists()

        // Validate request payload
        $validator = Validator::make($request->all(), [
            'trace_id' => 'required|string|uuid',
            'origin' => 'required|in:backend,frontend',
            'error_type' => 'required|string|max:100',
            'http_code' => 'required|integer|min:0|max:599',
            'error_message' => 'required|string|max:65535',
            'request_url' => 'required|string|max:2048',
            'request_method' => 'nullable|string|max:10',
            'stack_trace' => 'nullable|string',
            'module' => 'nullable|string|max:100',
            'component' => 'nullable|string|max:255',
            'context' => 'nullable|array',
            'user_agent' => 'nullable|string|max:500',
            'ip_address' => 'nullable|string|max:45',
            'user_id' => 'nullable|integer',
            'tenant_id' => 'nullable|string|max:100',
            'environment' => 'nullable|array',
            'timestamp' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            Log::warning('Invalid error report received', [
                'errors' => $validator->errors()->toArray(),
                'license_key' => substr($licenseKey, 0, 10).'...',
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'details' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        try {
            $errorLog = ErrorLog::create([
                'trace_id' => $data['trace_id'],
                'source_domain' => $sourceDomain ?? $request->input('source_domain'),
                'license_key' => $licenseKey,
                'tenant_id' => $data['tenant_id'] ?? null,
                'user_id' => $data['user_id'] ?? null,
                'error_type' => $data['error_type'],
                'http_code' => $data['http_code'],
                'request_method' => $data['request_method'] ?? null,
                'request_url' => $data['request_url'],
                'request_payload' => $request->input('request_payload'),
                'error_message' => $data['error_message'],
                'stack_trace' => $data['stack_trace'] ?? null,
                'origin' => $data['origin'],
                'module' => $data['module'] ?? null,
                'component' => $data['component'] ?? null,
                'context' => array_merge($data['context'] ?? [], [
                    'environment' => $data['environment'] ?? [],
                    'reported_at' => $data['timestamp'] ?? now()->toIso8601String(),
                ]),
                'user_agent' => $data['user_agent'] ?? null,
                'ip_address' => $data['ip_address'] ?? $request->ip(),
            ]);

            Log::info('Remote error logged', [
                'trace_id' => $errorLog->trace_id,
                'source_domain' => $errorLog->source_domain,
                'error_type' => $errorLog->error_type,
            ]);

            return response()->json([
                'success' => true,
                'trace_id' => $errorLog->trace_id,
                'message' => 'Error logged successfully',
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Failed to store remote error', [
                'error' => $e->getMessage(),
                'trace_id' => $data['trace_id'] ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to store error log',
            ], 500);
        }
    }

    /**
     * Get error statistics grouped by source domain
     */
    public function domainStatistics(Request $request): JsonResponse
    {
        $days = $request->input('days', 7);

        $stats = ErrorLog::selectRaw('source_domain, COUNT(*) as total_errors, 
                COUNT(CASE WHEN resolved_at IS NULL THEN 1 END) as unresolved,
                MAX(created_at) as last_error_at')
            ->where('created_at', '>=', now()->subDays($days))
            ->whereNotNull('source_domain')
            ->groupBy('source_domain')
            ->orderByDesc('total_errors')
            ->get()
            ->map(fn ($row) => [
                'domain' => $row->source_domain,
                'total_errors' => $row->total_errors,
                'unresolved' => $row->unresolved,
                'last_error_at' => $row->last_error_at,
            ]);

        return response()->json([
            'domain_statistics' => $stats,
            'total_domains' => $stats->count(),
        ]);
    }
}
