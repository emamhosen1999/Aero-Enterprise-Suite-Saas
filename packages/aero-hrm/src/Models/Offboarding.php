<?php

namespace Aero\HRM\Models;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class Offboarding extends Model
{
    use HasFactory, SoftDeletes;

    // Status constants
    public const STATUS_PENDING = 'pending';

    public const STATUS_IN_PROGRESS = 'in_progress'; // changed from in-progress

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_CANCELLED = 'cancelled';

    // Reason constants
    public const REASON_RESIGNATION = 'resignation';

    public const REASON_TERMINATION = 'termination';

    public const REASON_RETIREMENT = 'retirement';

    public const REASON_END_CONTRACT = 'end-of-contract';

    public const REASON_OTHER = 'other';

    protected $fillable = [
        'employee_id',
        'initiation_date',
        'last_working_date',
        'exit_interview_date',
        'reason',
        'status',
        'notes',
        // created_by / updated_by handled via hooks
    ];

    protected $casts = [
        'initiation_date' => 'date',
        'last_working_date' => 'date',
        'exit_interview_date' => 'date',
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function (self $model) {
            if (empty($model->status)) {
                $model->status = self::STATUS_PENDING;
            }
            if (Auth::id()) {
                $model->created_by = Auth::id();
            }
        });
        static::updating(function (self $model) {
            if (Auth::id()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    // Relationships
    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'employee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(OffboardingTask::class);
    }

    // Accessors / Helpers
    public function getProgressAttribute(): float
    {
        $total = $this->tasks->count();
        if ($total === 0) {
            return 0.0;
        }
        $completed = $this->tasks->where('status', 'completed')->count();

        return round(($completed / $total) * 100, 2);
    }

    public function isCompletable(): bool
    {
        return $this->tasks()->whereNotIn('status', ['completed', 'not-applicable'])->count() === 0;
    }

    public function getStatusAttribute($value)
    {
        return $value === 'in-progress' ? self::STATUS_IN_PROGRESS : $value;
    }

    public function setStatusAttribute($value)
    {
        $this->attributes['status'] = $value === 'in-progress' ? self::STATUS_IN_PROGRESS : $value;
    }
}
