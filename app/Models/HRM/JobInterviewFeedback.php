<?php

namespace App\Models\HRM;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobInterviewFeedback extends Model
{
    use HasFactory;

    protected $table = 'job_interview_feedback';

    protected $fillable = [
        'interview_id',
        'user_id',
        'technical_rating',
        'communication_rating',
        'cultural_fit_rating',
        'overall_rating',
        'strengths',
        'weaknesses',
        'comments',
        'recommendation',
    ];

    protected $casts = [
        'technical_rating' => 'integer',
        'communication_rating' => 'integer',
        'cultural_fit_rating' => 'integer',
        'overall_rating' => 'integer',
    ];

    /**
     * Get the interview this feedback belongs to.
     */
    public function interview(): BelongsTo
    {
        return $this->belongsTo(JobInterview::class, 'interview_id');
    }

    /**
     * Get the user who provided this feedback.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the average rating across all categories.
     */
    public function getAverageRatingAttribute(): float
    {
        $ratings = array_filter([
            $this->technical_rating,
            $this->communication_rating,
            $this->cultural_fit_rating,
            $this->overall_rating,
        ]);

        return count($ratings) > 0 ? round(array_sum($ratings) / count($ratings), 2) : 0;
    }
}
