<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplicantEducation extends Model
{
    use HasFactory;

    protected $table = 'job_applicant_education';

    protected $fillable = [
        'application_id',
        'institution',
        'degree',
        'field_of_study',
        'start_date',
        'end_date',
        'is_current',
        'grade',
        'description',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'is_current' => 'boolean',
        'grade' => 'decimal:2',
    ];

    /**
     * Get the job application this education record belongs to.
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class, 'application_id');
    }

    /**
     * Get the duration of this education in years.
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
     * Get formatted grade string.
     */
    public function getFormattedGradeAttribute(): ?string
    {
        if (! $this->grade) {
            return null;
        }

        return number_format($this->grade, 2);
    }
}
