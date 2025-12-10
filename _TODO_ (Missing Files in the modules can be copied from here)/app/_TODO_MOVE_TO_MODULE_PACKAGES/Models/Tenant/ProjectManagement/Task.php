<?php

namespace App\Models\Tenant\ProjectManagement;

use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    protected $fillable = [
        'project_id',
        'title',
        'description',
        'due_date',
        'is_complete',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}
