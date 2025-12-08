<?php

namespace Aero\HRM\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Holiday extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'from_date',
        'to_date',
        'type',
        'is_recurring',
        'recurrence_pattern',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $dates = [
        'from_date',
        'to_date',
    ];

    protected $casts = [
        'from_date' => 'date',
        'to_date' => 'date',
        'is_recurring' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected $appends = [
        'duration',
    ];

    // Holiday types
    public const TYPES = [
        'public' => 'Public Holiday',
        'religious' => 'Religious Holiday',
        'national' => 'National Holiday',
        'company' => 'Company Holiday',
        'optional' => 'Optional Holiday',
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('from_date', '>', Carbon::now());
    }

    public function scopeCurrentYear($query)
    {
        return $query->whereYear('from_date', Carbon::now()->year);
    }

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    // Accessors
    public function getTypeNameAttribute()
    {
        return self::TYPES[$this->type] ?? 'Holiday';
    }

    public function getDurationAttribute()
    {
        if (! $this->from_date || ! $this->to_date) {
            return 1;
        }

        $fromDate = Carbon::parse($this->from_date);
        $toDate = Carbon::parse($this->to_date);

        // Calculate the absolute difference and add 1 for inclusive counting
        return abs($toDate->diffInDays($fromDate)) + 1;
    }

    public function getIsUpcomingAttribute()
    {
        return Carbon::parse($this->from_date)->isFuture();
    }

    public function getIsOngoingAttribute()
    {
        $now = Carbon::now();

        return Carbon::parse($this->from_date)->lte($now) && Carbon::parse($this->to_date)->gte($now);
    }

    public function getIsPastAttribute()
    {
        return Carbon::parse($this->to_date)->isPast();
    }

    public function getStatusAttribute()
    {
        if ($this->is_ongoing) {
            return 'ongoing';
        } elseif ($this->is_upcoming) {
            return 'upcoming';
        } else {
            return 'past';
        }
    }

    // Relationships
    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(\App\Models\User::class, 'updated_by');
    }

    // Static methods
    public static function getUpcomingHolidays($limit = 5)
    {
        return self::active()
            ->upcoming()
            ->orderBy('from_date', 'asc')
            ->limit($limit)
            ->get();
    }

    public static function getHolidaysInRange(Carbon $startDate, Carbon $endDate)
    {
        return self::active()
            ->where(function ($query) use ($startDate, $endDate) {
                $query->whereBetween('from_date', [$startDate, $endDate])
                    ->orWhereBetween('to_date', [$startDate, $endDate])
                    ->orWhere(function ($q) use ($startDate, $endDate) {
                        $q->where('from_date', '<=', $startDate)
                            ->where('to_date', '>=', $endDate);
                    });
            })
            ->orderBy('from_date', 'asc')
            ->get();
    }

    public static function getTotalWorkingDays($year = null)
    {
        $year = $year ?? Carbon::now()->year;
        $totalDays = Carbon::create($year)->isLeapYear() ? 366 : 365;

        // Calculate holiday days using the duration accessor
        $holidays = self::whereYear('from_date', $year)
            ->active()
            ->get();

        $holidayDays = $holidays->sum(function ($holiday) {
            return $holiday->duration;
        });

        // Subtract weekends (assuming 52 weeks * 2 days = 104 weekend days)
        $weekendDays = 104;

        return $totalDays - $holidayDays - $weekendDays;
    }
}
