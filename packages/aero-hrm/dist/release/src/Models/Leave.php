<?php

namespace Aero\HRM\Models;

use Aero\Core\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'leave_type',
        'from_date',
        'to_date',
        'no_of_days',
        'approved_by',
        'reason',
        'status',
        'approval_chain',
        'current_approval_level',
        'approved_at',
        'rejection_reason',
        'rejected_by',
        'submitted_at',
    ];

    protected $casts = [
        'id' => 'integer',
        'leave_type' => 'string',
        'from_date' => 'date', // Simplified casting
        'to_date' => 'date',   // Simplified casting
        'no_of_days' => 'integer',
        'reason' => 'string',
        'status' => 'string',
        'approved_by' => 'integer',
        'approval_chain' => 'array',
        'current_approval_level' => 'integer',
        'approved_at' => 'datetime',
        'rejected_by' => 'integer',
        'submitted_at' => 'datetime',
    ];

    // Relationships
    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Simplified date serialization to ensure consistent date format
     *
     * @return array
     */
    public function toArray()
    {
        $array = parent::toArray();

        // Ensure dates are in consistent Y-m-d format
        if (isset($array['from_date'])) {
            $array['from_date'] = Carbon::parse($array['from_date'])->format('Y-m-d');
        }

        if (isset($array['to_date'])) {
            $array['to_date'] = Carbon::parse($array['to_date'])->format('Y-m-d');
        }

        return $array;
    }

    public function employee(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function leaveSetting(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(LeaveSetting::class, 'leave_type');
    }

    public function approver(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    // Accessors
    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'New' => 'primary',
            'Pending' => 'warning',
            'Approved' => 'success',
            'Declined' => 'danger',
            default => 'default'
        };
    }

    /**
     * Get the from_date attribute in consistent Y-m-d format.
     *
     * @param  string  $value
     * @return string
     */
    public function getFromDateAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('Y-m-d') : $value;
    }

    /**
     * Get the to_date attribute in consistent Y-m-d format.
     *
     * @param  string  $value
     * @return string
     */
    public function getToDateAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('Y-m-d') : $value;
    }
}
