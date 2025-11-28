<?php

namespace App\Models;

use App\Models\HRM\Department;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Project extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $fillable = [
        'project_name',
        'client_id',
        'start_date',
        'end_date',
        'rate',
        'rate_type',
        'priority',
        'project_leader_id',
        'team_leader_id',
        'description',
        'files',
        'status',
        'budget',
        'department_id',
        'progress',
        'color',
        'notes',
    ];

    protected $dates = [
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'files' => 'array',
        'budget' => 'decimal:2',
        'progress' => 'integer',
    ];

    // Relationships
    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function projectLeader()
    {
        return $this->belongsTo(User::class, 'project_leader_id');
    }

    public function teamLeader()
    {
        return $this->belongsTo(User::class, 'team_leader_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function milestones()
    {
        return $this->hasMany(ProjectMilestone::class);
    }

    public function tasks()
    {
        return $this->hasMany(ProjectTask::class);
    }

    public function issues()
    {
        return $this->hasMany(ProjectIssue::class);
    }

    public function resources()
    {
        return $this->belongsToMany(User::class, 'project_resources')
            ->withPivot('role', 'allocation_percentage', 'start_date', 'end_date')
            ->withTimestamps();
    }

    public function dailyWorks()
    {
        return $this->hasMany(DailyWork::class);
    }

    public function timeEntries()
    {
        return $this->hasMany(ProjectTimeEntry::class);
    }

    public function budgets()
    {
        return $this->hasMany(ProjectBudget::class);
    }

    public function budgetExpenses()
    {
        return $this->hasMany(ProjectBudgetExpense::class);
    }

    public function projectResources()
    {
        return $this->hasMany(ProjectResource::class);
    }

    /**
     * Calculate project progress based on completed tasks.
     */
    public function calculateProgress(): int
    {
        $tasks = $this->tasks;

        if ($tasks->isEmpty()) {
            return 0;
        }

        $completedTasks = $tasks->where('status', 'completed')->count();
        $totalTasks = $tasks->count();

        return intval(($completedTasks / $totalTasks) * 100);
    }

    /**
     * Get project status text.
     */
    public function getStatusTextAttribute(): string
    {
        $statusMap = [
            'not_started' => 'Not Started',
            'in_progress' => 'In Progress',
            'on_hold' => 'On Hold',
            'completed' => 'Completed',
            'cancelled' => 'Cancelled',
        ];

        return $statusMap[$this->status] ?? $this->status;
    }
}
