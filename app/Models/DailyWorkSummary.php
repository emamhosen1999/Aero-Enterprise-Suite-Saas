<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailyWorkSummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'incharge',
        'totalDailyWorks',
        'resubmissions',
        'embankment',
        'structure',
        'pavement',
    ];

    protected $casts = [
        'id' => 'integer',
        'date' => 'date',
        'incharge' => 'integer',
        'totalDailyWorks' => 'integer',
        'resubmissions' => 'integer',
        'embankment' => 'integer',
        'structure' => 'integer',
        'pavement' => 'integer',
    ];

    // Relationships
    public function inchargeUser()
    {
        return $this->belongsTo(User::class, 'incharge');
    }

    public function dailyWorks()
    {
        return $this->hasMany(DailyWork::class, 'incharge', 'incharge')
            ->whereDate('date', $this->date);
    }
}
