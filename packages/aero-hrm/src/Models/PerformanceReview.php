<?php

namespace Aero\HRM\Models;

use App\Models\PerformanceCompetencyScore;
use App\Models\PerformanceGoal;
use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PerformanceReview extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'reviewer_id',
        'review_period_start',
        'review_period_end',
        'review_date',
        'status',
        'overall_rating',
        'goals_achieved',
        'strengths',
        'areas_for_improvement',
        'comments',
        'acknowledgment_date',
        'employee_comments',
        'next_review_date',
        'department_id',
        'template_id',
    ];

    protected $casts = [
        'review_period_start' => 'date',
        'review_period_end' => 'date',
        'review_date' => 'date',
        'acknowledgment_date' => 'date',
        'next_review_date' => 'date',
        'overall_rating' => 'float',
    ];

    /**
     * Get the employee being reviewed.
     */
    public function employee()
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    /**
     * Get the reviewer.
     */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    /**
     * Get the department.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the review template.
     */
    public function template()
    {
        return $this->belongsTo(PerformanceReviewTemplate::class, 'template_id');
    }

    /**
     * Get the competency scores for this review.
     */
    public function competencyScores()
    {
        return $this->hasMany(PerformanceCompetencyScore::class, 'review_id');
    }

    /**
     * Get the goals for this review.
     */
    public function goals()
    {
        return $this->hasMany(PerformanceGoal::class, 'review_id');
    }

    /**
     * Calculate the time since review in days.
     */
    public function daysSinceReview()
    {
        return $this->review_date ? $this->review_date->diffInDays(now()) : null;
    }

    /**
     * Get the status text.
     */
    public function getStatusTextAttribute()
    {
        $statusMap = [
            'draft' => 'Draft',
            'pending_employee' => 'Pending Employee Review',
            'pending_manager' => 'Pending Manager Review',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
        ];

        return $statusMap[$this->status] ?? $this->status;
    }

    /**
     * Get the rating text.
     */
    public function getRatingTextAttribute()
    {
        if ($this->overall_rating >= 4.5) {
            return 'Exceptional';
        }
        if ($this->overall_rating >= 3.5) {
            return 'Exceeds Expectations';
        }
        if ($this->overall_rating >= 2.5) {
            return 'Meets Expectations';
        }
        if ($this->overall_rating >= 1.5) {
            return 'Needs Improvement';
        }

        return 'Unsatisfactory';
    }
}
