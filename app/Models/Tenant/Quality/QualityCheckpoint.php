<?php

namespace App\Models\Tenant\Quality;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class QualityCheckpoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'inspection_id',
        'name',
        'description',
        'specification',
        'unit_of_measure',
        'min_value',
        'max_value',
        'target_value',
        'result',
        'comments',
    ];

    protected $casts = [
        'min_value' => 'decimal:4',
        'max_value' => 'decimal:4',
    ];

    /**
     * Get the inspection that owns the checkpoint.
     */
    public function inspection()
    {
        return $this->belongsTo(QualityInspection::class, 'inspection_id');
    }

    /**
     * Check if the checkpoint is within specification.
     */
    public function isWithinSpec()
    {
        if ($this->result === 'pass' || $this->result === 'conditionally_passed') {
            return true;
        }

        if ($this->result === 'fail') {
            return false;
        }

        return null; // Not applicable or not tested
    }
}
