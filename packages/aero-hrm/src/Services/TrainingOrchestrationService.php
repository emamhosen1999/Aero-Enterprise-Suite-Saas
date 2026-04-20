<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Training;
use Aero\HRM\Models\TrainingEnrollment;
use Aero\HRM\Models\TrainingSession;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TrainingOrchestrationService
{
    /**
     * Create a training program with sessions.
     */
    public function createTrainingProgram(array $data, array $sessions = []): Training
    {
        return DB::transaction(function () use ($data, $sessions) {
            $training = Training::create($data);

            foreach ($sessions as $sessionData) {
                $training->sessions()->create(array_merge($sessionData, [
                    'status' => 'scheduled',
                ]));
            }

            Log::info('Training program created', [
                'training_id' => $training->id,
                'sessions_count' => count($sessions),
            ]);

            return $training->load('sessions');
        });
    }

    /**
     * Enroll employees in a training program.
     *
     * @param  array<int>  $employeeIds
     */
    public function enrollEmployees(Training $training, array $employeeIds, ?int $enrolledBy = null): Collection
    {
        return DB::transaction(function () use ($training, $employeeIds, $enrolledBy) {
            $enrollments = collect();

            foreach ($employeeIds as $employeeId) {
                $existing = TrainingEnrollment::where('training_id', $training->id)
                    ->where('employee_id', $employeeId)
                    ->first();

                if ($existing) {
                    continue;
                }

                $enrollment = TrainingEnrollment::create([
                    'training_id' => $training->id,
                    'employee_id' => $employeeId,
                    'enrolled_by' => $enrolledBy ?? auth()->id(),
                    'enrolled_at' => now(),
                    'status' => 'enrolled',
                ]);

                $enrollments->push($enrollment);
            }

            Log::info('Employees enrolled in training', [
                'training_id' => $training->id,
                'enrolled_count' => $enrollments->count(),
                'skipped_existing' => count($employeeIds) - $enrollments->count(),
            ]);

            return $enrollments;
        });
    }

    /**
     * Record training completion for an employee.
     */
    public function recordCompletion(TrainingEnrollment $enrollment, array $completionData = []): TrainingEnrollment
    {
        return DB::transaction(function () use ($enrollment, $completionData) {
            $enrollment->update([
                'status' => 'completed',
                'completed_at' => now(),
                'score' => $completionData['score'] ?? null,
                'certificate_number' => $completionData['certificate_number'] ?? $this->generateCertificateNumber(),
                'certificate_issued_at' => now(),
                'feedback' => $completionData['feedback'] ?? null,
            ]);

            Log::info('Training completion recorded', [
                'enrollment_id' => $enrollment->id,
                'employee_id' => $enrollment->employee_id,
                'training_id' => $enrollment->training_id,
            ]);

            return $enrollment->fresh();
        });
    }

    /**
     * Mark employee attendance for a training session.
     */
    public function markSessionAttendance(TrainingSession $session, int $employeeId, string $status = 'present'): void
    {
        $session->attendances()->updateOrCreate(
            ['employee_id' => $employeeId],
            [
                'status' => $status,
                'marked_at' => now(),
            ]
        );
    }

    /**
     * Get training needs analysis for a department.
     */
    public function getTrainingNeedsAnalysis(int $departmentId): array
    {
        $employees = Employee::where('department_id', $departmentId)
            ->with(['skills', 'trainingEnrollments.training'])
            ->get();

        $completedTrainings = TrainingEnrollment::whereIn('employee_id', $employees->pluck('id'))
            ->where('status', 'completed')
            ->with('training')
            ->get();

        $mandatoryTrainings = Training::where('is_mandatory', true)
            ->where('status', 'active')
            ->get();

        $complianceGaps = [];
        foreach ($employees as $employee) {
            $employeeCompletedIds = $completedTrainings
                ->where('employee_id', $employee->id)
                ->pluck('training_id')
                ->toArray();

            $missing = $mandatoryTrainings->whereNotIn('id', $employeeCompletedIds);

            if ($missing->isNotEmpty()) {
                $complianceGaps[] = [
                    'employee_id' => $employee->id,
                    'employee_name' => $employee->full_name,
                    'missing_trainings' => $missing->pluck('title', 'id')->toArray(),
                ];
            }
        }

        return [
            'department_id' => $departmentId,
            'total_employees' => $employees->count(),
            'total_completions' => $completedTrainings->count(),
            'avg_completions_per_employee' => $employees->count() > 0
                ? round($completedTrainings->count() / $employees->count(), 1)
                : 0,
            'compliance_gaps' => $complianceGaps,
            'mandatory_training_compliance_rate' => $employees->count() > 0
                ? round((($employees->count() - count($complianceGaps)) / $employees->count()) * 100, 1)
                : 100,
        ];
    }

    /**
     * Get upcoming sessions that need attention (low enrollment, approaching date).
     */
    public function getUpcomingSessions(int $daysAhead = 14): Collection
    {
        return TrainingSession::where('scheduled_date', '>=', now())
            ->where('scheduled_date', '<=', now()->addDays($daysAhead))
            ->where('status', 'scheduled')
            ->with(['training', 'enrollments'])
            ->withCount('enrollments')
            ->orderBy('scheduled_date')
            ->get();
    }

    /**
     * Cancel a training and notify enrolled employees.
     */
    public function cancelTraining(Training $training, string $reason): Training
    {
        return DB::transaction(function () use ($training, $reason) {
            $training->update([
                'status' => 'cancelled',
                'cancellation_reason' => $reason,
                'cancelled_at' => now(),
            ]);

            $training->enrollments()
                ->where('status', 'enrolled')
                ->update(['status' => 'cancelled']);

            $training->sessions()
                ->where('status', 'scheduled')
                ->update(['status' => 'cancelled']);

            Log::info('Training cancelled', [
                'training_id' => $training->id,
                'reason' => $reason,
            ]);

            return $training->fresh();
        });
    }

    private function generateCertificateNumber(): string
    {
        return 'CERT-'.strtoupper(uniqid()).'-'.now()->format('Y');
    }
}
