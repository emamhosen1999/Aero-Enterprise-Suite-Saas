<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendanceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'office_start_time',
        'office_end_time',
        'break_time_duration',
        'late_mark_after',
        'early_leave_before',
        'overtime_after',
        'weekend_days',
    ];

    protected $casts = [

        'weekend_days' => 'array',
        'office_start_time' => 'date:H:i',
        'office_end_time' => 'date:H:i',
        'late_mark_after' => 'integer',
        'early_leave_before' => 'integer',
        'overtime_after' => 'integer',
        'break_time_duration' => 'integer',

    ];

    // Add this method to handle default values
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (is_null($model->weekend_days)) {
                $model->weekend_days = ['saturday', 'sunday'];
            }
        });
    }
}
