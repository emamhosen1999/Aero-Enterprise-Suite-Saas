<?php

namespace App\Models;

use App\Models\HRM\Department;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class QualityInspection extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'inspection_number',
        'title',
        'description',
        'type',
        'status',
        'scheduled_date',
        'actual_date',
        'inspector_id',
        'department_id',
        'product_batch',
        'sample_size',
        'inspection_criteria',
        'results',
        'result_status',
    ];

    protected $casts = [
        'scheduled_date' => 'date',
        'actual_date' => 'date',
        'sample_size' => 'integer',
    ];

    /**
     * Get the inspector for the inspection.
     */
    public function inspector()
    {
        return $this->belongsTo(User::class, 'inspector_id');
    }

    /**
     * Get the department associated with the inspection.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the checkpoints for this inspection.
     */
    public function checkpoints()
    {
        return $this->hasMany(QualityCheckpoint::class, 'inspection_id');
    }

    /**
     * Get the percentage of passing checkpoints.
     */
    public function passRate()
    {
        $total = $this->checkpoints()->count();
        if ($total === 0) {
            return 0;
        }

        $passed = $this->checkpoints()->where('result', 'pass')->count();

        return ($passed / $total) * 100;
    }

    /**
     * Get all NCRs related to this inspection.
     */
    public function ncrs()
    {
        return $this->hasMany(QualityNCR::class, 'inspection_id');
    }
}
