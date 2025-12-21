<?php

namespace Aero\Rfi\Models;

use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * DailyWorkSummary Model
 *
 * Virtual/calculated model for daily work summary statistics.
 * Used for aggregated reporting by date and user.
 */
class DailyWorkSummary extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     * Note: This is typically used as a virtual/calculated model,
     * data is aggregated from daily_works table.
     */
    protected $table = 'daily_works';

    /**
     * Indicates if the model should be timestamped.
     */
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'date',
        'incharge_user_id',
        'totalDailyWorks',
        'resubmissions',
        'embankment',
        'structure',
        'pavement',
    ];

    /**
     * The attributes that should be cast.
     */
    protected function casts(): array
    {
        return [
            'id' => 'integer',
            'date' => 'date',
            'incharge_user_id' => 'integer',
            'totalDailyWorks' => 'integer',
            'resubmissions' => 'integer',
            'embankment' => 'integer',
            'structure' => 'integer',
            'pavement' => 'integer',
        ];
    }

    /**
     * Get the user in charge for this summary.
     */
    public function inchargeUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'incharge_user_id');
    }

    /**
     * Get all daily works for this summary's date and incharge.
     */
    public function dailyWorks(): HasMany
    {
        return $this->hasMany(DailyWork::class, 'incharge_user_id', 'incharge_user_id')
            ->whereDate('date', $this->date);
    }

    /**
     * Scope to get summary data grouped by date and incharge.
     */
    public function scopeGroupedSummary($query, ?string $fromDate = null, ?string $toDate = null)
    {
        return $query
            ->selectRaw('
                date,
                incharge_user_id,
                COUNT(*) as totalDailyWorks,
                SUM(CASE WHEN resubmission_count > 0 THEN 1 ELSE 0 END) as resubmissions,
                SUM(CASE WHEN type = "Embankment" THEN 1 ELSE 0 END) as embankment,
                SUM(CASE WHEN type = "Structure" THEN 1 ELSE 0 END) as structure,
                SUM(CASE WHEN type = "Pavement" THEN 1 ELSE 0 END) as pavement
            ')
            ->when($fromDate, fn ($q) => $q->where('date', '>=', $fromDate))
            ->when($toDate, fn ($q) => $q->where('date', '<=', $toDate))
            ->groupBy('date', 'incharge_user_id')
            ->orderBy('date', 'desc');
    }
}
