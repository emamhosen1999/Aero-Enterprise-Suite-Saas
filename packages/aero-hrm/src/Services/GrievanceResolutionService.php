<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Grievance;
use Aero\HRM\Models\GrievanceCommunication;
use Aero\HRM\Models\GrievanceNote;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class GrievanceResolutionService
{
    public const STATUS_FILED = 'filed';

    public const STATUS_ACKNOWLEDGED = 'acknowledged';

    public const STATUS_INVESTIGATING = 'investigating';

    public const STATUS_RESOLUTION_PROPOSED = 'resolution_proposed';

    public const STATUS_RESOLVED = 'resolved';

    public const STATUS_ESCALATED = 'escalated';

    public const STATUS_CLOSED = 'closed';

    /**
     * File a new grievance.
     */
    public function fileGrievance(array $data): Grievance
    {
        return DB::transaction(function () use ($data) {
            $grievance = Grievance::create([
                'employee_id' => $data['employee_id'],
                'category_id' => $data['category_id'] ?? null,
                'subject' => $data['subject'],
                'description' => $data['description'],
                'severity' => $data['severity'] ?? 'medium',
                'is_anonymous' => $data['is_anonymous'] ?? false,
                'status' => self::STATUS_FILED,
                'filed_at' => now(),
            ]);

            Log::info('Grievance filed', [
                'grievance_id' => $grievance->id,
                'employee_id' => $data['is_anonymous'] ? 'anonymous' : $data['employee_id'],
                'category_id' => $data['category_id'] ?? null,
            ]);

            return $grievance;
        });
    }

    /**
     * Acknowledge receipt of a grievance.
     */
    public function acknowledge(Grievance $grievance, int $acknowledgedBy): Grievance
    {
        $grievance->update([
            'status' => self::STATUS_ACKNOWLEDGED,
            'acknowledged_by' => $acknowledgedBy,
            'acknowledged_at' => now(),
        ]);

        Log::info('Grievance acknowledged', [
            'grievance_id' => $grievance->id,
            'acknowledged_by' => $acknowledgedBy,
        ]);

        return $grievance->fresh();
    }

    /**
     * Assign an investigator to the grievance.
     */
    public function assignInvestigator(Grievance $grievance, int $investigatorId, ?string $notes = null): Grievance
    {
        return DB::transaction(function () use ($grievance, $investigatorId, $notes) {
            $grievance->update([
                'status' => self::STATUS_INVESTIGATING,
                'assigned_to' => $investigatorId,
                'investigation_started_at' => now(),
            ]);

            if ($notes) {
                $this->addNote($grievance, $investigatorId, $notes, 'investigation');
            }

            Log::info('Investigator assigned to grievance', [
                'grievance_id' => $grievance->id,
                'investigator_id' => $investigatorId,
            ]);

            return $grievance->fresh();
        });
    }

    /**
     * Propose a resolution.
     */
    public function proposeResolution(Grievance $grievance, array $resolutionData): Grievance
    {
        return DB::transaction(function () use ($grievance, $resolutionData) {
            $grievance->update([
                'status' => self::STATUS_RESOLUTION_PROPOSED,
                'proposed_resolution' => $resolutionData['description'],
                'resolution_proposed_at' => now(),
                'resolution_proposed_by' => auth()->id(),
            ]);

            $this->addCommunication($grievance, [
                'type' => 'resolution_proposal',
                'message' => $resolutionData['description'],
                'sent_by' => auth()->id(),
            ]);

            Log::info('Resolution proposed for grievance', [
                'grievance_id' => $grievance->id,
            ]);

            return $grievance->fresh();
        });
    }

    /**
     * Mark grievance as resolved.
     */
    public function resolve(Grievance $grievance, string $resolution, ?int $resolvedBy = null): Grievance
    {
        return DB::transaction(function () use ($grievance, $resolution, $resolvedBy) {
            $grievance->update([
                'status' => self::STATUS_RESOLVED,
                'resolution' => $resolution,
                'resolved_at' => now(),
                'resolved_by' => $resolvedBy ?? auth()->id(),
            ]);

            Log::info('Grievance resolved', [
                'grievance_id' => $grievance->id,
                'resolution' => $resolution,
            ]);

            return $grievance->fresh();
        });
    }

    /**
     * Escalate a grievance.
     */
    public function escalate(Grievance $grievance, int $escalatedTo, string $reason): Grievance
    {
        return DB::transaction(function () use ($grievance, $escalatedTo, $reason) {
            $previousAssignee = $grievance->assigned_to;

            $grievance->update([
                'status' => self::STATUS_ESCALATED,
                'assigned_to' => $escalatedTo,
                'escalated_at' => now(),
                'escalation_reason' => $reason,
                'escalation_level' => ($grievance->escalation_level ?? 0) + 1,
            ]);

            $this->addNote($grievance, auth()->id(), "Escalated from #{$previousAssignee} to #{$escalatedTo}. Reason: {$reason}", 'escalation');

            Log::info('Grievance escalated', [
                'grievance_id' => $grievance->id,
                'escalated_to' => $escalatedTo,
                'reason' => $reason,
            ]);

            return $grievance->fresh();
        });
    }

    /**
     * Close a grievance after resolution acceptance.
     */
    public function close(Grievance $grievance, ?string $feedback = null, ?int $satisfactionRating = null): Grievance
    {
        $grievance->update([
            'status' => self::STATUS_CLOSED,
            'closed_at' => now(),
            'employee_feedback' => $feedback,
            'satisfaction_rating' => $satisfactionRating,
        ]);

        Log::info('Grievance closed', [
            'grievance_id' => $grievance->id,
            'satisfaction_rating' => $satisfactionRating,
        ]);

        return $grievance->fresh();
    }

    /**
     * Add a communication entry to the grievance.
     */
    public function addCommunication(Grievance $grievance, array $data): GrievanceCommunication
    {
        return GrievanceCommunication::create([
            'grievance_id' => $grievance->id,
            'type' => $data['type'] ?? 'message',
            'message' => $data['message'],
            'sent_by' => $data['sent_by'] ?? auth()->id(),
            'sent_at' => now(),
        ]);
    }

    /**
     * Add an internal note to the grievance.
     */
    public function addNote(Grievance $grievance, int $authorId, string $content, string $type = 'general'): GrievanceNote
    {
        return GrievanceNote::create([
            'grievance_id' => $grievance->id,
            'author_id' => $authorId,
            'content' => $content,
            'type' => $type,
        ]);
    }

    /**
     * Get grievances approaching SLA breach.
     */
    public function getSlaBreach(int $slaDays = 7): Collection
    {
        return Grievance::whereNotIn('status', [self::STATUS_RESOLVED, self::STATUS_CLOSED])
            ->where('filed_at', '<=', now()->subDays($slaDays))
            ->with('employee')
            ->orderBy('filed_at')
            ->get();
    }

    /**
     * Get grievance analytics.
     */
    public function getAnalytics(?string $startDate = null, ?string $endDate = null): array
    {
        $startDate = $startDate ?? now()->startOfYear()->toDateString();
        $endDate = $endDate ?? now()->toDateString();

        $grievances = Grievance::whereBetween('filed_at', [$startDate, $endDate])->get();

        $resolved = $grievances->whereIn('status', [self::STATUS_RESOLVED, self::STATUS_CLOSED]);
        $avgResolutionDays = $resolved->avg(function ($g) {
            return $g->filed_at && $g->resolved_at
                ? $g->filed_at->diffInDays($g->resolved_at)
                : null;
        });

        return [
            'total_filed' => $grievances->count(),
            'resolved' => $resolved->count(),
            'pending' => $grievances->whereNotIn('status', [self::STATUS_RESOLVED, self::STATUS_CLOSED])->count(),
            'escalated' => $grievances->where('status', self::STATUS_ESCALATED)->count(),
            'avg_resolution_days' => round($avgResolutionDays ?? 0, 1),
            'by_category' => $grievances->groupBy('category_id')->map->count()->toArray(),
            'by_severity' => $grievances->groupBy('severity')->map->count()->toArray(),
            'satisfaction_avg' => round($resolved->avg('satisfaction_rating') ?? 0, 1),
        ];
    }
}
