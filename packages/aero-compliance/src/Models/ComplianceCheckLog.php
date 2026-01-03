<?php

namespace Aero\Compliance\Models;

use Aero\Project\Models\Project;
use Aero\Rfi\Models\DailyWork;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ComplianceCheckLog Model
 * 
 * Logs automated compliance checks performed during RFI submission.
 */
class ComplianceCheckLog extends Model
{
    protected $fillable = [
        'project_id',
        'daily_work_id',
        'regulatory_requirement_id',
        'check_type',
        'result',
        'details',
        'blocks_submission',
        'checked_by_user_id',
        'checked_at',
    ];

    protected $casts = [
        'blocks_submission' => 'boolean',
        'checked_at' => 'datetime',
    ];

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function dailyWork(): BelongsTo
    {
        return $this->belongsTo(DailyWork::class);
    }

    public function regulatoryRequirement(): BelongsTo
    {
        return $this->belongsTo(RegulatoryRequirement::class);
    }
}
