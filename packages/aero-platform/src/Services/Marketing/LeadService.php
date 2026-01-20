<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Marketing;

use Aero\Platform\Models\ProspectLead;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Lead Service
 *
 * Manages prospect leads for platform sales.
 */
class LeadService
{
    /**
     * Get paginated leads with filters.
     */
    public function getPaginatedLeads(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = ProspectLead::query()->with('assignee');

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            if (is_array($filters['status'])) {
                $query->whereIn('status', $filters['status']);
            } else {
                $query->where('status', $filters['status']);
            }
        }

        if (! empty($filters['source'])) {
            $query->where('source', $filters['source']);
        }

        if (! empty($filters['assigned_to'])) {
            $query->where('assigned_to', $filters['assigned_to']);
        }

        if (! empty($filters['unassigned'])) {
            $query->whereNull('assigned_to');
        }

        if (! empty($filters['min_score'])) {
            $query->where('score', '>=', $filters['min_score']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', $filters['date_to']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    /**
     * Create a new lead.
     */
    public function createLead(array $data): ProspectLead
    {
        $lead = ProspectLead::create($data);
        $lead->calculateScore();

        return $lead;
    }

    /**
     * Update a lead.
     */
    public function updateLead(ProspectLead $lead, array $data): ProspectLead
    {
        $lead->update($data);

        if (array_intersect(array_keys($data), ['source', 'interest_level', 'name', 'company_name', 'phone'])) {
            $lead->calculateScore();
        }

        return $lead->refresh();
    }

    /**
     * Assign lead to a user.
     */
    public function assignLead(ProspectLead $lead, int $userId): bool
    {
        return $lead->update([
            'assigned_to' => $userId,
            'last_activity_at' => now(),
        ]);
    }

    /**
     * Bulk assign leads.
     */
    public function bulkAssignLeads(array $leadIds, int $userId): int
    {
        return ProspectLead::whereIn('id', $leadIds)
            ->update([
                'assigned_to' => $userId,
                'last_activity_at' => now(),
            ]);
    }

    /**
     * Convert lead to tenant.
     */
    public function convertLead(ProspectLead $lead, int $tenantId): bool
    {
        return $lead->markAsConverted($tenantId);
    }

    /**
     * Get lead statistics.
     */
    public function getLeadStats(?string $period = 'month'): array
    {
        $startDate = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'quarter' => now()->startOfQuarter(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $total = ProspectLead::where('created_at', '>=', $startDate)->count();
        $byStatus = ProspectLead::where('created_at', '>=', $startDate)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $bySource = ProspectLead::where('created_at', '>=', $startDate)
            ->select('source', DB::raw('count(*) as count'))
            ->groupBy('source')
            ->pluck('count', 'source')
            ->toArray();

        $avgScore = ProspectLead::where('created_at', '>=', $startDate)
            ->avg('score') ?? 0;

        $conversionRate = $total > 0
            ? round(($byStatus[ProspectLead::STATUS_CONVERTED] ?? 0) / $total * 100, 2)
            : 0;

        return [
            'total' => $total,
            'by_status' => $byStatus,
            'by_source' => $bySource,
            'avg_score' => round($avgScore, 1),
            'conversion_rate' => $conversionRate,
            'new' => $byStatus[ProspectLead::STATUS_NEW] ?? 0,
            'qualified' => $byStatus[ProspectLead::STATUS_QUALIFIED] ?? 0,
            'converted' => $byStatus[ProspectLead::STATUS_CONVERTED] ?? 0,
        ];
    }

    /**
     * Get lead funnel data.
     */
    public function getLeadFunnel(?string $period = 'month'): array
    {
        $startDate = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'quarter' => now()->startOfQuarter(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $stages = [
            ProspectLead::STATUS_NEW => 0,
            ProspectLead::STATUS_CONTACTED => 0,
            ProspectLead::STATUS_QUALIFIED => 0,
            ProspectLead::STATUS_CONVERTED => 0,
        ];

        $counts = ProspectLead::where('created_at', '>=', $startDate)
            ->whereIn('status', array_keys($stages))
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        foreach ($counts as $status => $count) {
            $stages[$status] = $count;
        }

        return array_map(fn ($status, $count) => [
            'status' => $status,
            'label' => ProspectLead::getStatusOptions()[$status] ?? $status,
            'count' => $count,
        ], array_keys($stages), array_values($stages));
    }

    /**
     * Get recent leads.
     */
    public function getRecentLeads(int $limit = 10): Collection
    {
        return ProspectLead::with('assignee')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Get high-value leads.
     */
    public function getHighValueLeads(int $minScore = 70, int $limit = 10): Collection
    {
        return ProspectLead::with('assignee')
            ->where('score', '>=', $minScore)
            ->whereIn('status', [ProspectLead::STATUS_NEW, ProspectLead::STATUS_CONTACTED, ProspectLead::STATUS_QUALIFIED])
            ->orderByDesc('score')
            ->limit($limit)
            ->get();
    }

    /**
     * Create lead from form submission.
     */
    public function createFromFormSubmission(array $formData, array $utmData = []): ProspectLead
    {
        $data = [
            'email' => $formData['email'],
            'name' => $formData['name'] ?? null,
            'company_name' => $formData['company'] ?? $formData['company_name'] ?? null,
            'phone' => $formData['phone'] ?? null,
            'country' => $formData['country'] ?? null,
            'source' => $formData['source'] ?? ProspectLead::SOURCE_WEBSITE,
            'source_detail' => $formData['source_detail'] ?? request()->headers->get('referer'),
            'interest_level' => $formData['interest_level'] ?? null,
            'interests' => $formData['interests'] ?? [],
            'notes' => $formData['message'] ?? $formData['notes'] ?? null,
            'utm_data' => $utmData,
            'metadata' => [
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'form_name' => $formData['form_name'] ?? 'contact',
            ],
        ];

        return $this->createLead($data);
    }
}
