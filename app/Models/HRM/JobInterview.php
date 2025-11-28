<?php

namespace App\Models\HRM;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class JobInterview extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'application_id',
        'title',
        'description',
        'scheduled_at',
        'duration_minutes',
        'location',
        'meeting_link',
        'type',
        'status',
        'interviewers',
        'scheduled_by',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'duration_minutes' => 'integer',
        'interviewers' => 'array',
    ];

    /**
     * Get the job application this interview is for.
     */
    public function jobApplication()
    {
        return $this->belongsTo(JobApplication::class, 'application_id');
    }

    /**
     * Get the user who scheduled the interview.
     */
    public function scheduler()
    {
        return $this->belongsTo(User::class, 'scheduled_by');
    }

    /**
     * Get the interviewers for this interview.
     */
    public function interviewers()
    {
        return User::whereIn('id', $this->interviewer_ids ?? [])->get();
    }

    /**
     * Get the interview feedback entries for this interview.
     */
    public function feedbackEntries()
    {
        return $this->hasMany(JobInterviewFeedback::class, 'interview_id');
    }

    /**
     * Get the average overall rating from all feedback.
     */
    public function getAverageRatingAttribute(): float
    {
        return $this->feedbackEntries()
            ->whereNotNull('overall_rating')
            ->avg('overall_rating') ?? 0;
    }

    /**
     * Check if all assigned interviewers have provided feedback.
     */
    public function hasCompleteFeedback(): bool
    {
        $interviewerIds = $this->interviewers ?? [];
        $feedbackCount = $this->feedbackEntries()->count();

        return count($interviewerIds) > 0 && $feedbackCount >= count($interviewerIds);
    }

    /**
     * Check if the interview is upcoming.
     */
    public function isUpcoming()
    {
        return now()->lt($this->scheduled_at);
    }

    /**
     * Check if the interview is in progress.
     */
    public function isInProgress()
    {
        $now = now();
        $endTime = $this->scheduled_at->copy()->addMinutes($this->duration_minutes);

        return $now->gte($this->scheduled_at) && $now->lte($endTime);
    }

    /**
     * Check if the interview has ended.
     */
    public function hasEnded()
    {
        $endTime = $this->scheduled_at->copy()->addMinutes($this->duration_minutes);

        return now()->gt($endTime);
    }

    /**
     * Get the time until the interview (for upcoming interviews).
     */
    public function timeUntil()
    {
        if (! $this->isUpcoming()) {
            return null;
        }

        return now()->diffForHumans($this->scheduled_at, ['syntax' => \Carbon\CarbonInterface::DIFF_ABSOLUTE]);
    }
}
