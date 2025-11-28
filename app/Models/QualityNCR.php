<?php

namespace App\Models;

use App\Models\HRM\Department;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class QualityNCR extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'quality_ncrs';

    protected $fillable = [
        'ncr_number',
        'title',
        'description',
        'severity',
        'status',
        'reported_by',
        'department_id',
        'assigned_to',
        'detected_date',
        'root_cause_analysis',
        'immediate_action',
        'corrective_action',
        'preventive_action',
        'closed_by',
        'closure_date',
        'lessons_learned',
        'requires_verification',
        'verification_date',
        'verified_by',
        'inspection_id',
    ];

    protected $casts = [
        'detected_date' => 'date',
        'closure_date' => 'date',
        'verification_date' => 'date',
        'requires_verification' => 'boolean',
    ];

    /**
     * Get the reporter of the NCR.
     */
    public function reporter()
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    /**
     * Get the user assigned to the NCR.
     */
    public function assignee()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who closed the NCR.
     */
    public function closedBy()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    /**
     * Get the user who verified the NCR.
     */
    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Get the department associated with the NCR.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the inspection that resulted in this NCR.
     */
    public function inspection()
    {
        return $this->belongsTo(QualityInspection::class, 'inspection_id');
    }

    /**
     * Calculate the age of the NCR in days.
     */
    public function ageInDays()
    {
        return $this->detected_date->diffInDays(now());
    }
}
