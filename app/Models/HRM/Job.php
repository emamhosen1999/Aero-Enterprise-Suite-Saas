<?php

namespace App\Models\HRM;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Job extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'jobs_recruitment';

    protected $fillable = [
        'title',
        'department_id',
        'type',
        'location',
        'is_remote_allowed',
        'description',
        'responsibilities',
        'requirements',
        'qualifications',
        'salary_min',
        'salary_max',
        'salary_currency',
        'salary_visible',
        'benefits',
        'posting_date',
        'closing_date',
        'status',
        'hiring_manager_id',
        'positions',
        'is_featured',
        'skills_required',
        'custom_fields',
    ];

    protected $casts = [
        'posting_date' => 'date',
        'closing_date' => 'date',
        'is_remote_allowed' => 'boolean',
        'salary_visible' => 'boolean',
        'is_featured' => 'boolean',
        'positions' => 'integer',
        'responsibilities' => 'array',
        'requirements' => 'array',
        'qualifications' => 'array',
        'benefits' => 'array',
        'salary_min' => 'float',
        'salary_max' => 'float',
        'skills_required' => 'array',
        'custom_fields' => 'array',
    ];

    /**
     * Get the department for the job.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the hiring manager for the job.
     */
    public function hiringManager()
    {
        return $this->belongsTo(User::class, 'hiring_manager_id');
    }

    /**
     * Get the applications for the job.
     */
    public function applications()
    {
        return $this->hasMany(JobApplication::class);
    }

    /**
     * Get the stages for this job's hiring process.
     */
    public function hiringStages()
    {
        return $this->hasMany(JobHiringStage::class)->orderBy('sequence');
    }

    /**
     * Check if the job is open.
     */
    public function isOpen()
    {
        $now = now();

        return $this->status === 'open' &&
            ($now->between($this->posting_date, $this->closing_date) ||
                ($now->gte($this->posting_date) && $this->closing_date === null));
    }

    /**
     * Check if the job is closed.
     */
    public function isClosed()
    {
        return $this->status === 'closed' ||
            ($this->closing_date !== null && now()->gt($this->closing_date));
    }

    /**
     * Get days until closing.
     */
    public function daysUntilClosing()
    {
        if ($this->closing_date === null) {
            return null;
        }

        return max(0, now()->diffInDays($this->closing_date, false));
    }

    /**
     * Get the formatted salary range.
     */
    public function getSalaryRangeAttribute()
    {
        if ($this->salary_min === null && $this->salary_max === null) {
            return 'Negotiable';
        }

        if ($this->salary_min !== null && $this->salary_max === null) {
            return 'From '.$this->salary_currency.' '.number_format($this->salary_min);
        }

        if ($this->salary_min === null && $this->salary_max !== null) {
            return 'Up to '.$this->salary_currency.' '.number_format($this->salary_max);
        }

        return $this->salary_currency.' '.number_format($this->salary_min).' - '.number_format($this->salary_max);
    }

    /**
     * Get the job type text.
     */
    public function getJobTypeTextAttribute()
    {
        $typeMap = [
            'full_time' => 'Full Time',
            'part_time' => 'Part Time',
            'contract' => 'Contract',
            'temporary' => 'Temporary',
            'internship' => 'Internship',
            'remote' => 'Remote',
        ];

        return $typeMap[$this->type] ?? $this->type;
    }

    /**
     * Get the status text with proper formatting.
     */
    public function getStatusTextAttribute()
    {
        $statusMap = [
            'draft' => 'Draft',
            'open' => 'Open',
            'closed' => 'Closed',
            'on_hold' => 'On Hold',
            'cancelled' => 'Cancelled',
        ];

        return $statusMap[$this->status] ?? $this->status;
    }

    /**
     * Get applications count by status.
     */
    public function getApplicationsCountByStatus()
    {
        return $this->applications()
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
    }

    /**
     * Get recent applications (last 7 days).
     */
    public function recentApplications()
    {
        return $this->applications()
            ->where('application_date', '>=', now()->subDays(7))
            ->orderBy('application_date', 'desc');
    }

    /**
     * Check if position has multiple openings.
     */
    public function hasMultiplePositions(): bool
    {
        return $this->positions > 1;
    }

    /**
     * Get filled positions count.
     */
    public function getFilledPositionsCount(): int
    {
        return $this->applications()
            ->where('status', 'hired')
            ->count();
    }

    /**
     * Get remaining positions.
     */
    public function getRemainingPositionsAttribute(): int
    {
        return max(0, $this->positions - $this->getFilledPositionsCount());
    }

    /**
     * Check if all positions are filled.
     */
    public function isFullyFilled(): bool
    {
        return $this->getRemainingPositionsAttribute() === 0;
    }
}
