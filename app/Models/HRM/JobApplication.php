<?php

namespace App\Models\HRM;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class JobApplication extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia, SoftDeletes;

    protected $fillable = [
        'job_id',
        'applicant_id',
        'applicant_name',
        'email',
        'phone',
        'address',
        'cover_letter',
        'resume_path',
        'status',
        'rating',
        'source',
        'current_stage_id',
        'application_date',
        'last_status_change',
        'notes',
        'expected_salary',
        'salary_currency',
        'notice_period',
        'experience_years',
        'application_ip',
        'referral_source',
        'referrer_id',
        'skills',
        'custom_fields',
    ];

    protected $casts = [
        'application_date' => 'date',
        'last_status_change' => 'date',
        'rating' => 'float',
        'expected_salary' => 'float',
        'notice_period' => 'integer',
        'experience_years' => 'float',
        'skills' => 'array',
        'custom_fields' => 'array',
    ];

    /**
     * Get the job that was applied for.
     */
    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    /**
     * Get the user who applied (if registered).
     */
    public function applicant()
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }

    /**
     * Get the current hiring stage.
     */
    public function currentStage()
    {
        return $this->belongsTo(JobHiringStage::class, 'current_stage_id');
    }

    /**
     * Get the interviews for this application.
     */
    public function interviews()
    {
        return $this->hasMany(JobInterview::class, 'application_id');
    }

    /**
     * Get the user who referred this applicant.
     */
    public function referrer()
    {
        return $this->belongsTo(User::class, 'referrer_id');
    }

    /**
     * Get the education records for this applicant.
     */
    public function educationRecords()
    {
        return $this->hasMany(JobApplicantEducation::class);
    }

    /**
     * Get the work experience records for this applicant.
     */
    public function experienceRecords()
    {
        return $this->hasMany(JobApplicantExperience::class);
    }

    /**
     * Get the stage history for this application.
     */
    public function stageHistory()
    {
        return $this->hasMany(JobApplicationStageHistory::class, 'application_id')->orderBy('moved_at', 'desc');
    }

    /**
     * Get the timeline of this application.
     */
    public function timeline()
    {
        return $this->stageHistory;
    }

    /**
     * Get the offers for this application.
     */
    public function offers()
    {
        return $this->hasMany(JobOffer::class, 'application_id');
    }

    /**
     * Get the active offer for this application.
     */
    public function activeOffer()
    {
        return $this->hasOne(JobOffer::class, 'application_id')
            ->whereIn('status', ['draft', 'sent', 'negotiating']);
    }

    /**
     * Calculate the age of the application in days.
     */
    public function ageInDays()
    {
        return $this->application_date->diffInDays(now());
    }

    /**
     * Determine if the application is active.
     */
    public function isActive()
    {
        return ! in_array($this->status, ['rejected', 'withdrawn', 'hired', 'declined_offer']);
    }
}
