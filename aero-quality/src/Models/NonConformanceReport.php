<?php

namespace Aero\Quality\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class NonConformanceReport extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'ncr_number',
        'title',
        'description',
        'severity',
        'product_id',
        'batch_number',
        'detected_by',
        'detected_date',
        'root_cause',
        'corrective_action',
        'preventive_action',
        'status',
        'closed_date',
        'closed_by',
    ];

    protected $casts = [
        'detected_date' => 'datetime',
        'closed_date' => 'datetime',
    ];
}
