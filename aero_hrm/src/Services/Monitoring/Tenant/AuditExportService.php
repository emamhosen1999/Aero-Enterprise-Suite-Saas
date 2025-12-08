<?php

namespace Aero\Platform\Services\Monitoring\Tenant;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Spatie\Activitylog\Models\Activity;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AuditExportService
{
    /**
     * Export audit logs to CSV format.
     */
    public function toCsv(Collection $activities): string
    {
        $headers = [
            'ID',
            'Log Name',
            'Description',
            'Subject Type',
            'Subject ID',
            'Causer Type',
            'Causer ID',
            'Causer Email',
            'Properties',
            'IP Address',
            'User Agent',
            'Created At',
        ];

        $output = fopen('php://temp', 'r+');
        fputcsv($output, $headers);

        foreach ($activities as $activity) {
            $causer = $activity->causer;
            $properties = $activity->properties->toArray();

            fputcsv($output, [
                $activity->id,
                $activity->log_name,
                $activity->description,
                $activity->subject_type,
                $activity->subject_id,
                $activity->causer_type,
                $activity->causer_id,
                $causer?->email ?? 'System',
                json_encode($properties),
                $properties['ip_address'] ?? null,
                $properties['user_agent'] ?? null,
                $activity->created_at->toIso8601String(),
            ]);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }

    /**
     * Export audit logs to JSON format.
     */
    public function toJson(Collection $activities): string
    {
        $data = $activities->map(function (Activity $activity) {
            $causer = $activity->causer;
            $properties = $activity->properties->toArray();

            return [
                'id' => $activity->id,
                'log_name' => $activity->log_name,
                'description' => $activity->description,
                'subject' => [
                    'type' => $activity->subject_type,
                    'id' => $activity->subject_id,
                ],
                'causer' => [
                    'type' => $activity->causer_type,
                    'id' => $activity->causer_id,
                    'email' => $causer?->email,
                    'name' => $causer?->name,
                ],
                'properties' => $properties,
                'metadata' => [
                    'ip_address' => $properties['ip_address'] ?? null,
                    'user_agent' => $properties['user_agent'] ?? null,
                    'device' => $properties['device'] ?? null,
                ],
                'created_at' => $activity->created_at->toIso8601String(),
            ];
        });

        return json_encode([
            'exported_at' => now()->toIso8601String(),
            'total_records' => $data->count(),
            'activities' => $data->toArray(),
        ], JSON_PRETTY_PRINT);
    }

    /**
     * Get activity logs with filters.
     */
    public function getFiltered(array $filters = []): Collection
    {
        $query = Activity::query()
            ->with('causer:id,name,email')
            ->latest();

        if (! empty($filters['log_name'])) {
            $query->where('log_name', $filters['log_name']);
        }

        if (! empty($filters['description'])) {
            $query->where('description', 'like', "%{$filters['description']}%");
        }

        if (! empty($filters['causer_id'])) {
            $query->where('causer_id', $filters['causer_id']);
        }

        if (! empty($filters['subject_type'])) {
            $query->where('subject_type', $filters['subject_type']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $limit = $filters['limit'] ?? 1000;

        return $query->limit($limit)->get();
    }

    /**
     * Export to CSV as a streamed response.
     */
    public function exportToCsv(
        ?string $logName = null,
        ?string $subjectType = null,
        ?int $causerId = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): StreamedResponse {
        $activities = $this->buildQuery($logName, $subjectType, $causerId, $startDate, $endDate)->get();

        return response()->streamDownload(function () use ($activities) {
            echo $this->toCsv($activities);
        }, 'audit_logs_'.now()->format('Y-m-d_His').'.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    /**
     * Export to JSON as a streamed response.
     */
    public function exportToJson(
        ?string $logName = null,
        ?string $subjectType = null,
        ?int $causerId = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): StreamedResponse {
        $activities = $this->buildQuery($logName, $subjectType, $causerId, $startDate, $endDate)->get();

        return response()->streamDownload(function () use ($activities) {
            echo $this->toJson($activities);
        }, 'audit_logs_'.now()->format('Y-m-d_His').'.json', [
            'Content-Type' => 'application/json',
        ]);
    }

    /**
     * Get audit log statistics.
     */
    public function getStatistics(
        ?string $logName = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ): array {
        $query = Activity::query();

        if ($logName) {
            $query->where('log_name', $logName);
        }

        if ($startDate) {
            $query->where('created_at', '>=', $startDate->startOfDay());
        }

        if ($endDate) {
            $query->where('created_at', '<=', $endDate->endOfDay());
        }

        $total = $query->count();

        $byLogName = Activity::query()
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->selectRaw('log_name, count(*) as count')
            ->groupBy('log_name')
            ->pluck('count', 'log_name');

        $byDay = Activity::query()
            ->when($logName, fn ($q) => $q->where('log_name', $logName))
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->selectRaw('DATE(created_at) as date, count(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->limit(30)
            ->pluck('count', 'date');

        $topCausers = Activity::query()
            ->when($logName, fn ($q) => $q->where('log_name', $logName))
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate))
            ->whereNotNull('causer_id')
            ->with('causer:id,name,email')
            ->selectRaw('causer_id, causer_type, count(*) as count')
            ->groupBy('causer_id', 'causer_type')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->map(fn ($item) => [
                'causer' => $item->causer?->name ?? 'Unknown',
                'email' => $item->causer?->email,
                'count' => $item->count,
            ]);

        return [
            'total' => $total,
            'by_log_name' => $byLogName,
            'by_day' => $byDay,
            'top_causers' => $topCausers,
        ];
    }

    /**
     * Build base query with filters.
     */
    protected function buildQuery(
        ?string $logName = null,
        ?string $subjectType = null,
        ?int $causerId = null,
        ?Carbon $startDate = null,
        ?Carbon $endDate = null
    ) {
        return Activity::query()
            ->with('causer:id,name,email')
            ->when($logName, fn ($q) => $q->where('log_name', $logName))
            ->when($subjectType, fn ($q) => $q->where('subject_type', $subjectType))
            ->when($causerId, fn ($q) => $q->where('causer_id', $causerId))
            ->when($startDate, fn ($q) => $q->where('created_at', '>=', $startDate->startOfDay()))
            ->when($endDate, fn ($q) => $q->where('created_at', '<=', $endDate->endOfDay()))
            ->orderBy('created_at', 'desc')
            ->limit(5000);
    }
}
