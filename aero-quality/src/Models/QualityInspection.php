<?php

namespace Aero\Quality\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class QualityInspection extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'inspection_number',
        'inspection_type',
        'product_id',
        'batch_number',
        'inspector_id',
        'inspection_date',
        'status',
        'result',
        'notes',
        'checklist_data',
    ];

    protected $casts = [
        'inspection_date' => 'datetime',
        'checklist_data' => 'array',
    ];
}
