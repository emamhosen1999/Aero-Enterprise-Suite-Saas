<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Report extends Model implements HasMedia
{
    use HasFactory;
    use InteractsWithMedia;

    protected $fillable = [
        'ref_no',
        'report_type',
        'issue_date',
        'details',
        'status',
        'remarks',
    ];

    public function daily_works()
    {
        return $this->belongsToMany(DailyWork::class, 'daily_work_has_report', 'report_id', 'daily_work_id');
    }
}
