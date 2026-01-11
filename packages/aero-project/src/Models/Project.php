<?php

namespace Aero\Project\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'project_name',
        'code',
        'description',
        'client_id',
        'department_id',
        'start_date',
        'end_date',
        'project_leader_id',
        'team_leader_id',
        'budget',
        'rate',
        'rate_type',
        'status',
        'priority',
        'progress',
        'color',
        'files',
        'notes',
        // domain-specific
        'type',
        'category',
        'location',
        'start_chainage',
        'end_chainage',
        'total_length',
        'boundary_lat_min',
        'boundary_lat_max',
        'boundary_lng_min',
        'boundary_lng_max',
        'geofence_settings',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'files' => 'array',
        'budget' => 'decimal:2',
        'progress' => 'integer',
        'start_chainage' => 'decimal:3',
        'end_chainage' => 'decimal:3',
        'total_length' => 'decimal:3',
        'boundary_lat_min' => 'decimal:7',
        'boundary_lat_max' => 'decimal:7',
        'boundary_lng_min' => 'decimal:7',
        'boundary_lng_max' => 'decimal:7',
        'geofence_settings' => 'array',
    ];

    // Internal relationships (tenant-scoped)
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

    public function calculateProgress(): int
    {
        $tasks = $this->tasks;

        if ($tasks->isEmpty()) {
            return 0;
        }

        $completedTasks = $tasks->where('status', 'completed')->count();
        $totalTasks = $tasks->count();

        return (int) (($completedTasks / $totalTasks) * 100);
    }

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
