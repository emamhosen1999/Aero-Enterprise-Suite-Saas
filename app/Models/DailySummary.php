<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DailySummary extends Model
{
    use HasFactory;

    protected $fillable = [
        'date',
        'incharge',
        'totalTasks',
        'totalResubmission',
        'embankmentTasks',
        'structureTasks',
        'pavementTasks',
    ];

    protected $casts = [
        'date' => 'date',
        'incharge' => 'integer',
        'totalTasks' => 'integer',
        'totalResubmission' => 'integer',
        'embankmentTasks' => 'integer',
        'structureTasks' => 'integer',
        'pavementTasks' => 'integer',
    ];

    /**
     * Get the user who is in charge
     */
    public function inchargeUser()
    {
        return $this->belongsTo(User::class, 'incharge');
    }

    /**
     * Get daily works for this summary
     */
    public function dailyWorks()
    {
        return $this->hasMany(DailyWork::class, 'incharge', 'incharge')
            ->whereDate('date', $this->date);
    }

    /**
     * Calculate completion percentage
     */
    public function getCompletionPercentageAttribute()
    {
        if ($this->totalTasks == 0) {
            return 0;
        }

        $completed = $this->dailyWorks()->where('status', 'completed')->count();

        return round(($completed / $this->totalTasks) * 100, 2);
    }

    /**
     * Calculate RFI submission percentage
     */
    public function getRfiSubmissionPercentageAttribute()
    {
        $completed = $this->dailyWorks()->where('status', 'completed')->count();
        if ($completed == 0) {
            return 0;
        }

        $rfiSubmissions = $this->dailyWorks()->whereNotNull('rfi_submission_date')->count();

        return round(($rfiSubmissions / $completed) * 100, 2);
    }
}
