<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplicantExperience extends Model
{
    use HasFactory;

    protected $table = 'job_applicant_experience';

    protected $fillable = [
        'application_id',
        'company',
        'position',
        'location',
        'start_date',
        'end_date',
        'is_current',
        'description',
        'achievements',
        'reference_name',
        'reference_contact',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
    ];

    /**
     * Get the job application this experience record belongs to.
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class, 'application_id');
    }

    /**
     * Get the duration of this experience in years.
     */
    public function getDurationAttribute(): ?float
    {
        if (! $this->start_date) {
            return null;
        }

        $endDate = $this->is_current ? now() : $this->end_date;

        if (! $endDate) {
            return null;
        }

        return round($this->start_date->diffInYears($endDate, true), 1);
    }

    /**
     * Get formatted duration string.
     */
    public function getFormattedDurationAttribute(): string
    {
        $duration = $this->duration;

        if (! $duration) {
            return 'Unknown duration';
        }

        if ($duration < 1) {
            $months = round($this->start_date->diffInMonths($this->is_current ? now() : $this->end_date));

            return $months.' month'.($months !== 1 ? 's' : '');
        }

        return $duration.' year'.($duration !== 1 ? 's' : '');
    }
}
