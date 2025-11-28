<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProjectMilestone extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'project_id',
        'name',
        'description',
        'due_date',
        'status',
        'weight',
        'order',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'due_date' => 'date',
        'weight' => 'integer',
        'order' => 'integer',
    ];

    /**
     * Get the project that owns the milestone.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the tasks for the milestone.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(ProjectTask::class, 'milestone_id');
    }

    /**
     * Get milestone status text.
     */
    public function getStatusTextAttribute(): string
    {
        $statusMap = [
            'not_started' => 'Not Started',
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            'delayed' => 'Delayed',
        ];

        return $statusMap[$this->status] ?? $this->status;
    }
}
