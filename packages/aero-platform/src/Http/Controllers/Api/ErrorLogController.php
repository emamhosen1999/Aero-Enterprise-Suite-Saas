<?php

namespace Aero\Platform\Http\Controllers\Api;

use Aero\Platform\Models\ErrorLog;
use Aero\Platform\Services\Monitoring\Tenant\ErrorLogService;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * ErrorLogController
 *
 * Handles error logging from frontend and provides error log management API.
 */
class ErrorLogController extends Controller
{
    public function __construct(
        private ErrorLogService $errorLogService
    ) {}

    /**
     * Log an error from the frontend
     *
     * POST /api/error-log
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'trace_id' => 'nullable|string|max:100',
            'error_type' => 'nullable|string|max:100',
            'http_code' => 'nullable|integer',
            'error_message' => 'nullable|string|max:5000',
            'message' => 'nullable|string|max:5000',
            'stack_trace' => 'nullable|string|max:50000',
            'stack' => 'nullable|string|max:50000',
            'component' => 'nullable|string|max:255',
            'component_stack' => 'nullable|string|max:50000',
            'url' => 'nullable|string|max:2000',
            'module' => 'nullable|string|max:100',
            'viewport' => 'nullable|array',
            'referrer' => 'nullable|string|max:2000',
            'payload' => 'nullable|array',
            'request_method' => 'nullable|string|max:10',
            'user_agent' => 'nullable|string|max:500',
            'timestamp' => 'nullable|string',
            'context' => 'nullable|array',
        ]);

        // Normalize field names (frontend may send different field names)
        $normalizedData = [
            'trace_id' => $validated['trace_id'] ?? null,
            'error_type' => $validated['error_type'] ?? 'FrontendError',
            'http_code' => $validated['http_code'] ?? 0,
            'message' => $validated['error_message'] ?? $validated['message'] ?? 'Unknown error',
            'stack' => $validated['stack_trace'] ?? $validated['stack'] ?? null,
            'component' => $validated['component'] ?? null,
            'component_stack' => $validated['component_stack'] ?? null,
            'url' => $validated['url'] ?? null,
            'module' => $validated['module'] ?? null,
            'user_agent' => $validated['user_agent'] ?? $request->userAgent(),
            'context' => $validated['context'] ?? $validated['viewport'] ?? null,
        ];

        $errorLog = $this->errorLogService->logFrontendError($normalizedData);

        return response()->json([
            'success' => true,
            'message' => 'Error logged successfully',
            'trace_id' => $errorLog->trace_id,
        ]);
    }

    /**
     * List error logs (for admin dashboard)
     *
     * GET /api/error-logs
     */
    public function index(Request $request): JsonResponse
    {
        $query = ErrorLog::query()->latest();

        // Filter by tenant for tenant admins
        if ($request->has('tenant_id')) {
            $query->forTenant($request->tenant_id);
        }

        // Filter by origin
        if ($request->has('origin')) {
            $query->where('origin', $request->origin);
        }

        // Filter by error type
        if ($request->has('error_type')) {
            $query->where('error_type', $request->error_type);
        }

        // Filter by HTTP code
        if ($request->has('http_code')) {
            $query->where('http_code', $request->http_code);
        }

        // Filter by resolved status
        if ($request->has('is_resolved')) {
            $query->where('is_resolved', $request->boolean('is_resolved'));
        }

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('error_message', 'like', "%{$search}%")
                    ->orWhere('trace_id', 'like', "%{$search}%")
                    ->orWhere('request_url', 'like', "%{$search}%");
            });
        }

        $perPage = $request->input('per_page', 25);
        $errors = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $errors->items(),
            'meta' => [
                'current_page' => $errors->currentPage(),
                'last_page' => $errors->lastPage(),
                'per_page' => $errors->perPage(),
                'total' => $errors->total(),
            ],
        ]);
    }

    /**
     * Get a specific error log
     *
     * GET /api/error-logs/{id}
     */
    public function show(ErrorLog $errorLog): JsonResponse
    {
        // Include stack trace for detail view (normally hidden)
        $errorLog->makeVisible(['stack_trace', 'request_payload']);

        return response()->json([
            'success' => true,
            'data' => $errorLog,
        ]);
    }

    /**
     * Get error log by trace ID
     *
     * GET /api/error-logs/trace/{traceId}
     */
    public function showByTraceId(string $traceId): JsonResponse
    {
        $errorLog = ErrorLog::where('trace_id', $traceId)->firstOrFail();
        $errorLog->makeVisible(['stack_trace', 'request_payload']);

        return response()->json([
            'success' => true,
            'data' => $errorLog,
        ]);
    }

    /**
     * Mark an error as resolved
     *
     * PATCH /api/error-logs/{id}/resolve
     */
    public function resolve(Request $request, ErrorLog $errorLog): JsonResponse
    {
        $validated = $request->validate([
            'notes' => 'nullable|string|max:5000',
        ]);

        $userId = Auth::guard('landlord')->id() ?? Auth::guard('web')->id();

        if (! $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required to resolve errors',
            ], 401);
        }

        $errorLog->markResolved($userId, $validated['notes'] ?? null);

        return response()->json([
            'success' => true,
            'message' => 'Error marked as resolved',
            'data' => $errorLog->fresh(),
        ]);
    }

    /**
     * Bulk resolve errors
     *
     * POST /api/error-logs/bulk-resolve
     */
    public function bulkResolve(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'integer|exists:error_logs,id',
            'notes' => 'nullable|string|max:5000',
        ]);

        $userId = Auth::guard('landlord')->id() ?? Auth::guard('web')->id();

        if (! $userId) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        $count = ErrorLog::whereIn('id', $validated['ids'])
            ->where('is_resolved', false)
            ->update([
                'is_resolved' => true,
                'resolved_by' => $userId,
                'resolved_at' => now(),
                'resolution_notes' => $validated['notes'] ?? null,
            ]);

        return response()->json([
            'success' => true,
            'message' => "{$count} errors marked as resolved",
        ]);
    }

    /**
     * Get error statistics
     *
     * GET /api/error-logs/statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $tenantId = $request->input('tenant_id');
        $days = $request->input('days', 7);

        $stats = $this->errorLogService->getStatistics($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Delete old error logs (cleanup)
     *
     * DELETE /api/error-logs/cleanup
     */
    public function cleanup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'days' => 'required|integer|min:7|max:365',
            'resolved_only' => 'boolean',
        ]);

        $query = ErrorLog::where('created_at', '<', now()->subDays($validated['days']));

        if ($request->boolean('resolved_only', true)) {
            $query->where('is_resolved', true);
        }

        $count = $query->delete();

        return response()->json([
            'success' => true,
            'message' => "{$count} error logs deleted",
        ]);
    }
}
