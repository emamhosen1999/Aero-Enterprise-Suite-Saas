<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\DisciplinaryCase;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Warning;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DisciplinaryWorkflowService
{
    /**
     * Disciplinary case lifecycle statuses.
     */
    public const STATUS_REPORTED = 'reported';

    public const STATUS_UNDER_INVESTIGATION = 'under_investigation';

    public const STATUS_HEARING_SCHEDULED = 'hearing_scheduled';

    public const STATUS_ACTION_TAKEN = 'action_taken';

    public const STATUS_APPEAL = 'appeal';

    public const STATUS_CLOSED = 'closed';

    /**
     * Open a new disciplinary case.
     */
    public function openCase(array $data): DisciplinaryCase
    {
        return DB::transaction(function () use ($data) {
            $case = DisciplinaryCase::create([
                'employee_id' => $data['employee_id'],
                'reported_by' => $data['reported_by'] ?? auth()->id(),
                'incident_date' => $data['incident_date'],
                'incident_description' => $data['incident_description'],
                'category' => $data['category'] ?? null,
                'severity' => $data['severity'] ?? 'medium',
                'status' => self::STATUS_REPORTED,
                'reported_at' => now(),
                'witnesses' => $data['witnesses'] ?? null,
                'evidence' => $data['evidence'] ?? null,
            ]);

            Log::info('Disciplinary case opened', [
                'case_id' => $case->id,
                'employee_id' => $data['employee_id'],
                'severity' => $data['severity'] ?? 'medium',
            ]);

            return $case;
        });
    }

    /**
     * Start investigation on a case.
     */
    public function startInvestigation(DisciplinaryCase $case, int $investigatorId, ?string $notes = null): DisciplinaryCase
    {
        return DB::transaction(function () use ($case, $investigatorId, $notes) {
            $case->update([
                'status' => self::STATUS_UNDER_INVESTIGATION,
                'investigator_id' => $investigatorId,
                'investigation_started_at' => now(),
                'investigation_notes' => $notes,
            ]);

            Log::info('Investigation started', [
                'case_id' => $case->id,
                'investigator_id' => $investigatorId,
            ]);

            return $case->fresh();
        });
    }

    /**
     * Schedule a disciplinary hearing.
     */
    public function scheduleHearing(DisciplinaryCase $case, array $hearingData): DisciplinaryCase
    {
        return DB::transaction(function () use ($case, $hearingData) {
            $case->update([
                'status' => self::STATUS_HEARING_SCHEDULED,
                'hearing_date' => $hearingData['hearing_date'],
                'hearing_location' => $hearingData['location'] ?? null,
                'hearing_panel' => $hearingData['panel_members'] ?? null,
                'hearing_notes' => $hearingData['notes'] ?? null,
            ]);

            Log::info('Hearing scheduled', [
                'case_id' => $case->id,
                'hearing_date' => $hearingData['hearing_date'],
            ]);

            return $case->fresh();
        });
    }

    /**
     * Record disciplinary action taken.
     */
    public function takeAction(DisciplinaryCase $case, array $actionData): DisciplinaryCase
    {
        return DB::transaction(function () use ($case, $actionData) {
            $case->update([
                'status' => self::STATUS_ACTION_TAKEN,
                'action_type_id' => $actionData['action_type_id'] ?? null,
                'action_description' => $actionData['description'],
                'action_taken_at' => now(),
                'action_taken_by' => auth()->id(),
                'action_effective_date' => $actionData['effective_date'] ?? now(),
            ]);

            if (in_array($actionData['action_type'] ?? '', ['verbal_warning', 'written_warning', 'final_warning'])) {
                $this->issueWarning($case, $actionData);
            }

            Log::info('Disciplinary action taken', [
                'case_id' => $case->id,
                'action' => $actionData['description'],
            ]);

            return $case->fresh();
        });
    }

    /**
     * Record an appeal on the disciplinary action.
     */
    public function fileAppeal(DisciplinaryCase $case, array $appealData): DisciplinaryCase
    {
        return DB::transaction(function () use ($case, $appealData) {
            $case->update([
                'status' => self::STATUS_APPEAL,
                'appeal_reason' => $appealData['reason'],
                'appeal_filed_at' => now(),
                'appeal_status' => 'pending',
            ]);

            Log::info('Appeal filed', [
                'case_id' => $case->id,
                'reason' => $appealData['reason'],
            ]);

            return $case->fresh();
        });
    }

    /**
     * Close a disciplinary case.
     */
    public function closeCase(DisciplinaryCase $case, string $resolution, ?string $closingNotes = null): DisciplinaryCase
    {
        return DB::transaction(function () use ($case, $resolution, $closingNotes) {
            $case->update([
                'status' => self::STATUS_CLOSED,
                'resolution' => $resolution,
                'closing_notes' => $closingNotes,
                'closed_at' => now(),
                'closed_by' => auth()->id(),
            ]);

            Log::info('Disciplinary case closed', [
                'case_id' => $case->id,
                'resolution' => $resolution,
            ]);

            return $case->fresh();
        });
    }

    /**
     * Get active cases count for an employee.
     */
    public function getEmployeeCaseHistory(Employee $employee): array
    {
        $cases = DisciplinaryCase::where('employee_id', $employee->id)
            ->orderByDesc('reported_at')
            ->get();

        return [
            'total_cases' => $cases->count(),
            'active_cases' => $cases->whereNotIn('status', [self::STATUS_CLOSED])->count(),
            'warnings_count' => Warning::where('employee_id', $employee->id)->count(),
            'cases' => $cases,
        ];
    }

    private function issueWarning(DisciplinaryCase $case, array $actionData): Warning
    {
        return Warning::create([
            'employee_id' => $case->employee_id,
            'disciplinary_case_id' => $case->id,
            'type' => $actionData['action_type'],
            'description' => $actionData['description'],
            'issued_by' => auth()->id(),
            'issued_date' => now(),
            'expiry_date' => $actionData['warning_expiry_date'] ?? now()->addYear(),
        ]);
    }
}
