<?php

namespace Aero\Core\Http\Controllers\Admin;

use Aero\Core\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * Display the audit logs listing.
     */
    public function index(): Response
    {
        return Inertia::render('Pages/Core/AuditLogs/Index', [
            'title' => 'Audit & Activity Logs',
        ]);
    }

    /**
     * Get paginated activity logs.
     */
    public function activityLogs(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search', '');
        $userId = $request->get('user_id');
        $action = $request->get('action');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        // Check if activity_log table exists
        if (!$this->tableExists('activity_log')) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $perPage,
                    'total' => 0,
                ],
                'message' => 'Activity logging not configured',
            ]);
        }

        $query = DB::table('activity_log')
            ->leftJoin('users', 'activity_log.causer_id', '=', 'users.id')
            ->select([
                'activity_log.id',
                'activity_log.log_name',
                'activity_log.description',
                'activity_log.subject_type',
                'activity_log.subject_id',
                'activity_log.causer_type',
                'activity_log.causer_id',
                'activity_log.properties',
                'activity_log.created_at',
                'users.name as causer_name',
                'users.email as causer_email',
            ]);

        // Apply filters
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('activity_log.description', 'like', "%{$search}%")
                    ->orWhere('activity_log.log_name', 'like', "%{$search}%")
                    ->orWhere('users.name', 'like', "%{$search}%");
            });
        }

        if ($userId) {
            $query->where('activity_log.causer_id', $userId);
        }

        if ($action) {
            $query->where('activity_log.log_name', $action);
        }

        if ($dateFrom) {
            $query->whereDate('activity_log.created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('activity_log.created_at', '<=', $dateTo);
        }

        $logs = $query->orderBy('activity_log.created_at', 'desc')
            ->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Get paginated security logs.
     */
    public function securityLogs(Request $request)
    {
        $perPage = $request->get('per_page', 15);
        $search = $request->get('search', '');
        $eventType = $request->get('event_type');
        $dateFrom = $request->get('date_from');
        $dateTo = $request->get('date_to');

        // Check if security_logs table exists
        if (!$this->tableExists('security_logs')) {
            return response()->json([
                'data' => [],
                'meta' => [
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $perPage,
                    'total' => 0,
                ],
                'message' => 'Security logging not configured',
            ]);
        }

        $query = DB::table('security_logs')
            ->leftJoin('users', 'security_logs.user_id', '=', 'users.id')
            ->select([
                'security_logs.id',
                'security_logs.event_type',
                'security_logs.description',
                'security_logs.ip_address',
                'security_logs.user_agent',
                'security_logs.metadata',
                'security_logs.created_at',
                'users.name as user_name',
                'users.email as user_email',
            ]);

        // Apply filters
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('security_logs.description', 'like', "%{$search}%")
                    ->orWhere('security_logs.ip_address', 'like', "%{$search}%")
                    ->orWhere('users.name', 'like', "%{$search}%");
            });
        }

        if ($eventType) {
            $query->where('security_logs.event_type', $eventType);
        }

        if ($dateFrom) {
            $query->whereDate('security_logs.created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('security_logs.created_at', '<=', $dateTo);
        }

        $logs = $query->orderBy('security_logs.created_at', 'desc')
            ->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Export activity logs.
     */
    public function exportActivityLogs(Request $request)
    {
        // TODO: Implement export functionality
        return response()->json([
            'message' => 'Export functionality coming soon',
        ]);
    }

    /**
     * Export security logs.
     */
    public function exportSecurityLogs(Request $request)
    {
        // TODO: Implement export functionality
        return response()->json([
            'message' => 'Export functionality coming soon',
        ]);
    }

    /**
     * Get audit log statistics.
     */
    public function stats()
    {
        $stats = [
            'total_activities' => 0,
            'today_activities' => 0,
            'security_events' => 0,
            'active_users_today' => 0,
        ];

        if ($this->tableExists('activity_log')) {
            $stats['total_activities'] = DB::table('activity_log')->count();
            $stats['today_activities'] = DB::table('activity_log')
                ->whereDate('created_at', today())
                ->count();
        }

        if ($this->tableExists('security_logs')) {
            $stats['security_events'] = DB::table('security_logs')
                ->whereDate('created_at', today())
                ->count();
        }

        // Active users today from sessions or activity
        if ($this->tableExists('sessions')) {
            $stats['active_users_today'] = DB::table('sessions')
                ->whereNotNull('user_id')
                ->distinct('user_id')
                ->count('user_id');
        }

        return response()->json($stats);
    }

    /**
     * Check if a table exists in the database.
     */
    protected function tableExists(string $table): bool
    {
        return DB::getSchemaBuilder()->hasTable($table);
    }
}
