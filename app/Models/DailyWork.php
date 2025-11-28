<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class DailyWork extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'date',
        'number',
        'status',
        'inspection_result',
        'type',
        'description',
        'location',
        'side',
        'qty_layer',
        'planned_time',
        'incharge',
        'assigned',
        'completion_time',
        'inspection_details',
        'resubmission_count',
        'resubmission_date',
        'rfi_submission_date',
    ];

    protected $casts = [
        'date' => 'date',
        'completion_time' => 'datetime',
        'rfi_submission_date' => 'date',
        'resubmission_count' => 'integer',
    ];

    // Relationships
    public function reports()
    {
        return $this->belongsToMany(Report::class, 'daily_work_has_report', 'daily_work_id', 'report_id');
    }

    public function inchargeUser()
    {
        return $this->belongsTo(User::class, 'incharge');
    }

    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned');
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', '!=', 'completed');
    }

    public function scopeWithRFI($query)
    {
        return $query->whereNotNull('rfi_submission_date');
    }

    public function scopeResubmissions($query)
    {
        return $query->where('resubmission_count', '>', 0);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByIncharge($query, $inchargeId)
    {
        return $query->where('incharge', $inchargeId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    // Accessors
    public function getIsCompletedAttribute()
    {
        return $this->status === 'completed';
    }

    public function getHasRfiSubmissionAttribute()
    {
        return ! is_null($this->rfi_submission_date);
    }

    public function getIsResubmissionAttribute()
    {
        return $this->resubmission_count > 0;
    }
}