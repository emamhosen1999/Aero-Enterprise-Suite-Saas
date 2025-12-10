<?php

namespace Aero\Quality\Models;

use Illuminate\Database\Eloquent\Model;

class InspectionChecklist extends Model
{
    protected $fillable = [
        'inspection_id',
        'checkpoint_name',
        'checkpoint_description',
        'expected_value',
        'actual_value',
        'result',
        'notes',
    ];
}
