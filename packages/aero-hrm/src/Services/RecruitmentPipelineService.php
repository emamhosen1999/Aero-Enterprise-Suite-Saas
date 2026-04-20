<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Job;
use Aero\HRM\Models\JobApplication;
use Aero\HRM\Models\JobApplicationStageHistory;
use Aero\HRM\Models\JobHiringStage;
use Aero\HRM\Models\JobInterview;
use Aero\HRM\Models\JobOffer;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class RecruitmentPipelineService
{
    /**
     * Move a candidate to the next stage in the hiring pipeline.
     */
    public function advanceCandidate(JobApplication $application, string $toStageCode, ?string $notes = null): JobApplication
    {
        return DB::transaction(function () use ($application, $toStageCode, $notes) {
            $previousStage = $application->current_stage;

            $stage = JobHiringStage::where('job_id', $application->job_id)
                ->where('code', $toStageCode)
                ->firstOrFail();

            $application->update([
                'current_stage' => $stage->code,
                'stage_entered_at' => now(),
            ]);

            JobApplicationStageHistory::create([
                'job_application_id' => $application->id,
                'from_stage' => $previousStage,
                'to_stage' => $stage->code,
                'moved_by' => auth()->id(),
                'notes' => $notes,
                'moved_at' => now(),
            ]);

            Log::info('Candidate advanced in pipeline', [
                'application_id' => $application->id,
                'from' => $previousStage,
                'to' => $toStageCode,
            ]);

            return $application->fresh();
        });
    }

    /**
     * Reject a candidate with reason.
     */
    public function rejectCandidate(JobApplication $application, string $reason, ?string $notes = null): JobApplication
    {
        return DB::transaction(function () use ($application, $reason, $notes) {
            $application->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'rejected_at' => now(),
                'rejected_by' => auth()->id(),
            ]);

            JobApplicationStageHistory::create([
                'job_application_id' => $application->id,
                'from_stage' => $application->current_stage,
                'to_stage' => 'rejected',
                'moved_by' => auth()->id(),
                'notes' => $notes ?? $reason,
                'moved_at' => now(),
            ]);

            Log::info('Candidate rejected', [
                'application_id' => $application->id,
                'reason' => $reason,
            ]);

            return $application->fresh();
        });
    }

    /**
     * Schedule an interview for a candidate.
     */
    public function scheduleInterview(JobApplication $application, array $data): JobInterview
    {
        return DB::transaction(function () use ($application, $data) {
            $interview = JobInterview::create([
                'job_application_id' => $application->id,
                'job_id' => $application->job_id,
                'interviewer_id' => $data['interviewer_id'],
                'scheduled_at' => $data['scheduled_at'],
                'duration_minutes' => $data['duration_minutes'] ?? 60,
                'interview_type' => $data['interview_type'] ?? 'in-person',
                'location' => $data['location'] ?? null,
                'meeting_link' => $data['meeting_link'] ?? null,
                'notes' => $data['notes'] ?? null,
                'status' => 'scheduled',
            ]);

            Log::info('Interview scheduled', [
                'interview_id' => $interview->id,
                'application_id' => $application->id,
                'scheduled_at' => $data['scheduled_at'],
            ]);

            return $interview;
        });
    }

    /**
     * Generate a job offer for a candidate.
     */
    public function generateOffer(JobApplication $application, array $offerData): JobOffer
    {
        return DB::transaction(function () use ($application, $offerData) {
            $offer = JobOffer::create([
                'job_application_id' => $application->id,
                'job_id' => $application->job_id,
                'offered_salary' => $offerData['offered_salary'],
                'offered_designation_id' => $offerData['designation_id'] ?? null,
                'offered_department_id' => $offerData['department_id'] ?? null,
                'joining_date' => $offerData['joining_date'],
                'offer_expiry_date' => $offerData['offer_expiry_date'] ?? now()->addDays(7),
                'benefits_package' => $offerData['benefits_package'] ?? null,
                'additional_terms' => $offerData['additional_terms'] ?? null,
                'status' => 'pending',
                'generated_by' => auth()->id(),
            ]);

            $application->update(['current_stage' => 'offer']);

            Log::info('Job offer generated', [
                'offer_id' => $offer->id,
                'application_id' => $application->id,
            ]);

            return $offer;
        });
    }

    /**
     * Get pipeline analytics for a job posting.
     */
    public function getPipelineAnalytics(Job $job): array
    {
        $applications = $job->applications()->get();

        $stageDistribution = $applications->groupBy('current_stage')
            ->map(fn (Collection $group) => $group->count());

        $avgTimePerStage = JobApplicationStageHistory::whereHas('application', function ($q) use ($job) {
            $q->where('job_id', $job->id);
        })
            ->selectRaw('to_stage, AVG(TIMESTAMPDIFF(HOUR, created_at, moved_at)) as avg_hours')
            ->groupBy('to_stage')
            ->pluck('avg_hours', 'to_stage');

        return [
            'total_applicants' => $applications->count(),
            'active_applicants' => $applications->where('status', 'active')->count(),
            'rejected' => $applications->where('status', 'rejected')->count(),
            'hired' => $applications->where('status', 'hired')->count(),
            'stage_distribution' => $stageDistribution->toArray(),
            'avg_time_per_stage_hours' => $avgTimePerStage->toArray(),
            'conversion_rate' => $applications->count() > 0
                ? round(($applications->where('status', 'hired')->count() / $applications->count()) * 100, 2)
                : 0,
        ];
    }

    /**
     * Score candidates based on job requirements match.
     *
     * @return array<int, array{application_id: int, score: float, breakdown: array}>
     */
    public function scoreCandidates(Job $job): array
    {
        $applications = $job->applications()
            ->with(['applicantEducation', 'applicantExperience'])
            ->where('status', 'active')
            ->get();

        $scores = [];

        foreach ($applications as $application) {
            $score = $this->calculateCandidateScore($application, $job);
            $scores[] = [
                'application_id' => $application->id,
                'score' => $score['total'],
                'breakdown' => $score['breakdown'],
            ];
        }

        usort($scores, fn ($a, $b) => $b['score'] <=> $a['score']);

        return $scores;
    }

    /**
     * Calculate match score for a single candidate.
     *
     * @return array{total: float, breakdown: array}
     */
    private function calculateCandidateScore(JobApplication $application, Job $job): array
    {
        $breakdown = [];

        $experienceYears = $application->applicantExperience?->sum('years') ?? 0;
        $requiredExperience = $job->min_experience ?? 0;
        $breakdown['experience'] = min(($experienceYears / max($requiredExperience, 1)) * 30, 30);

        $breakdown['education'] = $application->applicantEducation?->count() > 0 ? 20 : 0;

        $breakdown['skills'] = 0;
        if ($job->required_skills && $application->skills) {
            $required = collect(is_array($job->required_skills) ? $job->required_skills : json_decode($job->required_skills, true));
            $candidate = collect(is_array($application->skills) ? $application->skills : json_decode($application->skills, true));
            $matched = $required->intersect($candidate)->count();
            $breakdown['skills'] = $required->count() > 0
                ? round(($matched / $required->count()) * 30, 2)
                : 0;
        }

        $breakdown['completeness'] = $this->assessProfileCompleteness($application) * 20;

        $total = array_sum($breakdown);

        return [
            'total' => round($total, 2),
            'breakdown' => $breakdown,
        ];
    }

    private function assessProfileCompleteness(JobApplication $application): float
    {
        $fields = ['cover_letter', 'resume_path', 'phone', 'email'];
        $filled = 0;

        foreach ($fields as $field) {
            if (! empty($application->{$field})) {
                $filled++;
            }
        }

        return $filled / count($fields);
    }
}
