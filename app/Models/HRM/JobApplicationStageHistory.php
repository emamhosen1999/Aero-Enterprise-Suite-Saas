<?php

namespace App\Models\HRM;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JobApplicationStageHistory extends Model
{
    use HasFactory;

    protected $table = 'job_application_stage_history';

    protected $fillable = [
        'application_id',
        'stage_id',
        'moved_by',
        'moved_at',
        'notes',
    ];

    protected $casts = [
        'moved_at' => 'datetime',
    ];

    /**
     * Get the job application that was moved.
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(JobApplication::class, 'application_id');
    }

    /**
     * Get the stage the application was moved to.
     */
    public function stage(): BelongsTo
    {
        return $this->belongsTo(JobHiringStage::class, 'stage_id');
    }

    /**
     * Get the user who moved the application.
     */
    public function movedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'moved_by');
    }
}
