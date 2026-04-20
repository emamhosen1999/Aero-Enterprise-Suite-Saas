<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\SafetyIncident;
use Aero\HRM\Models\SafetyInspection;
use Aero\HRM\Models\SafetyTraining;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SafetyComplianceService
{
    /**
     * Incident severity levels.
     */
    public const SEVERITY_LOW = 'low';

    public const SEVERITY_MEDIUM = 'medium';

    public const SEVERITY_HIGH = 'high';

    public const SEVERITY_CRITICAL = 'critical';

    /**
     * Report a safety incident.
     */
    public function reportIncident(array $data): SafetyIncident
    {
        return DB::transaction(function () use ($data) {
            $incident = SafetyIncident::create([
                'title' => $data['title'],
                'description' => $data['description'],
                'incident_date' => $data['incident_date'],
                'location' => $data['location'] ?? null,
                'severity' => $data['severity'] ?? self::SEVERITY_MEDIUM,
                'type' => $data['type'] ?? 'near_miss',
                'reported_by' => $data['reported_by'] ?? auth()->id(),
                'department_id' => $data['department_id'] ?? null,
                'status' => 'reported',
                'injuries_count' => $data['injuries_count'] ?? 0,
                'immediate_actions' => $data['immediate_actions'] ?? null,
            ]);

            if (! empty($data['participants'])) {
                foreach ($data['participants'] as $participant) {
                    $incident->participants()->create($participant);
                }
            }

            Log::info('Safety incident reported', [
                'incident_id' => $incident->id,
                'severity' => $incident->severity,
                'type' => $incident->type,
            ]);

            return $incident;
        });
    }

    /**
     * Start investigation of a safety incident.
     */
    public function startInvestigation(SafetyIncident $incident, int $investigatorId): SafetyIncident
    {
        $incident->update([
            'status' => 'investigating',
            'investigator_id' => $investigatorId,
            'investigation_started_at' => now(),
        ]);

        Log::info('Safety incident investigation started', [
            'incident_id' => $incident->id,
            'investigator_id' => $investigatorId,
        ]);

        return $incident->fresh();
    }

    /**
     * Close an incident with root cause and corrective actions.
     */
    public function closeIncident(SafetyIncident $incident, array $closingData): SafetyIncident
    {
        $incident->update([
            'status' => 'closed',
            'root_cause' => $closingData['root_cause'] ?? null,
            'corrective_actions' => $closingData['corrective_actions'] ?? null,
            'preventive_actions' => $closingData['preventive_actions'] ?? null,
            'closed_at' => now(),
            'closed_by' => auth()->id(),
        ]);

        Log::info('Safety incident closed', [
            'incident_id' => $incident->id,
            'root_cause' => $closingData['root_cause'] ?? null,
        ]);

        return $incident->fresh();
    }

    /**
     * Schedule a safety inspection.
     */
    public function scheduleInspection(array $data): SafetyInspection
    {
        $inspection = SafetyInspection::create([
            'title' => $data['title'],
            'type' => $data['type'] ?? 'routine',
            'scheduled_date' => $data['scheduled_date'],
            'location' => $data['location'] ?? null,
            'department_id' => $data['department_id'] ?? null,
            'inspector_id' => $data['inspector_id'] ?? null,
            'checklist' => $data['checklist'] ?? null,
            'status' => 'scheduled',
        ]);

        Log::info('Safety inspection scheduled', [
            'inspection_id' => $inspection->id,
            'scheduled_date' => $data['scheduled_date'],
        ]);

        return $inspection;
    }

    /**
     * Complete a safety inspection with findings.
     */
    public function completeInspection(SafetyInspection $inspection, array $results): SafetyInspection
    {
        $inspection->update([
            'status' => 'completed',
            'completed_at' => now(),
            'findings' => $results['findings'] ?? null,
            'score' => $results['score'] ?? null,
            'recommendations' => $results['recommendations'] ?? null,
            'follow_up_required' => $results['follow_up_required'] ?? false,
            'follow_up_date' => $results['follow_up_date'] ?? null,
        ]);

        Log::info('Safety inspection completed', [
            'inspection_id' => $inspection->id,
            'score' => $results['score'] ?? null,
        ]);

        return $inspection->fresh();
    }

    /**
     * Track safety training compliance.
     */
    public function getTrainingCompliance(?int $departmentId = null): array
    {
        $query = Employee::where('status', 'active');
        if ($departmentId) {
            $query->where('department_id', $departmentId);
        }

        $employees = $query->get();

        $mandatoryTrainings = SafetyTraining::where('is_mandatory', true)
            ->where('status', 'active')
            ->get();

        $compliant = 0;
        $nonCompliant = [];

        foreach ($employees as $employee) {
            $completedIds = $employee->safetyTrainingCompletions?->pluck('safety_training_id')->toArray() ?? [];
            $missing = $mandatoryTrainings->whereNotIn('id', $completedIds);

            if ($missing->isEmpty()) {
                $compliant++;
            } else {
                $nonCompliant[] = [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->full_name,
                    'missing_trainings' => $missing->pluck('title', 'id')->toArray(),
                ];
            }
        }

        return [
            'total_employees' => $employees->count(),
            'compliant' => $compliant,
            'non_compliant' => count($nonCompliant),
            'compliance_rate' => $employees->count() > 0
                ? round(($compliant / $employees->count()) * 100, 1)
                : 100,
            'non_compliant_employees' => $nonCompliant,
            'mandatory_trainings' => $mandatoryTrainings->pluck('title', 'id')->toArray(),
        ];
    }

    /**
     * Get safety dashboard metrics.
     */
    public function getDashboardMetrics(?int $year = null): array
    {
        $year = $year ?? now()->year;

        $incidents = SafetyIncident::whereYear('incident_date', $year)->get();
        $inspections = SafetyInspection::whereYear('scheduled_date', $year)->get();

        $monthlyIncidents = $incidents->groupBy(fn ($i) => $i->incident_date->format('Y-m'))
            ->map->count()
            ->toArray();

        return [
            'year' => $year,
            'total_incidents' => $incidents->count(),
            'open_incidents' => $incidents->whereNotIn('status', ['closed'])->count(),
            'critical_incidents' => $incidents->where('severity', self::SEVERITY_CRITICAL)->count(),
            'total_injuries' => $incidents->sum('injuries_count'),
            'incident_rate' => $this->calculateIncidentRate($incidents->count()),
            'inspections_completed' => $inspections->where('status', 'completed')->count(),
            'inspections_scheduled' => $inspections->where('status', 'scheduled')->count(),
            'avg_inspection_score' => round($inspections->where('status', 'completed')->avg('score') ?? 0, 1),
            'monthly_trend' => $monthlyIncidents,
            'by_severity' => $incidents->groupBy('severity')->map->count()->toArray(),
            'by_type' => $incidents->groupBy('type')->map->count()->toArray(),
            'days_since_last_incident' => $this->daysSinceLastIncident(),
        ];
    }

    /**
     * Get upcoming inspections.
     */
    public function getUpcomingInspections(int $days = 30): Collection
    {
        return SafetyInspection::where('status', 'scheduled')
            ->where('scheduled_date', '>=', now())
            ->where('scheduled_date', '<=', now()->addDays($days))
            ->orderBy('scheduled_date')
            ->get();
    }

    /**
     * Get overdue inspections.
     */
    public function getOverdueInspections(): Collection
    {
        return SafetyInspection::where('status', 'scheduled')
            ->where('scheduled_date', '<', now())
            ->orderBy('scheduled_date')
            ->get();
    }

    private function calculateIncidentRate(int $incidentCount): float
    {
        $totalEmployees = Employee::where('status', 'active')->count();

        return $totalEmployees > 0
            ? round(($incidentCount / $totalEmployees) * 100, 2)
            : 0;
    }

    private function daysSinceLastIncident(): int
    {
        $lastIncident = SafetyIncident::orderByDesc('incident_date')->first();

        return $lastIncident
            ? (int) now()->diffInDays($lastIncident->incident_date)
            : 0;
    }
}
