<?php

namespace Aero\Rfi\Services;

use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\WeatherLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

/**
 * WeatherValidationService - Environmental Work Constraint Validator (PATENTABLE)
 * 
 * Prevents approval of quality-sensitive work when weather conditions were unsuitable.
 * Critical for defending claims and ensuring work quality compliance.
 * 
 * Rules Engine:
 * - Concrete: Cannot be poured if temp < 5°C or > 35°C, or during rain
 * - Asphalt: Cannot be laid if temp < 10°C or during rain
 * - Painting: Cannot be done if humidity > 85% or during rain
 * - Earthwork: Can tolerate rain but not if ground is saturated
 */
class WeatherValidationService
{
    /**
     * Work type weather requirements
     */
    private const WEATHER_CONSTRAINTS = [
        'concrete_pour' => [
            'min_temp' => 5,
            'max_temp' => 35,
            'max_wind_speed' => 50, // km/h
            'max_precipitation' => 0, // mm (no rain allowed)
            'max_humidity' => 100,
            'reason' => 'Concrete quality compromised in extreme temperatures or rain'
        ],
        'asphalt_laying' => [
            'min_temp' => 10,
            'max_temp' => 50,
            'max_wind_speed' => 40,
            'max_precipitation' => 0,
            'max_humidity' => 100,
            'reason' => 'Asphalt requires dry, warm conditions for proper compaction'
        ],
        'painting' => [
            'min_temp' => 10,
            'max_temp' => 40,
            'max_wind_speed' => 30,
            'max_precipitation' => 0,
            'max_humidity' => 85,
            'reason' => 'Paint curing requires low humidity and no precipitation'
        ],
        'welding' => [
            'min_temp' => -5,
            'max_temp' => 50,
            'max_wind_speed' => 35,
            'max_precipitation' => 0,
            'max_humidity' => 100,
            'reason' => 'Welding quality affected by wind and moisture'
        ],
        'earthwork' => [
            'min_temp' => -10,
            'max_temp' => 50,
            'max_wind_speed' => 60,
            'max_precipitation' => 50, // Can work in light rain
            'max_humidity' => 100,
            'reason' => 'Earthwork affected by saturation, not light rain'
        ],
        'steel_erection' => [
            'min_temp' => -20,
            'max_temp' => 50,
            'max_wind_speed' => 40,
            'max_precipitation' => 5,
            'max_humidity' => 100,
            'reason' => 'Wind speed critical for crane operations'
        ],
    ];

    /**
     * Validate if weather conditions were suitable for the work performed
     *
     * @param string $workType Type of work (e.g., 'concrete_pour', 'asphalt_laying')
     * @param Carbon $workDate Date when work was performed
     * @param int $projectId Project context
     * @param float|null $startChainage Optional: validate weather at specific location
     * @param float|null $endChainage
     * @return array ['suitable' => bool, 'violations' => array, 'weather_data' => array]
     */
    public function validateWorkConditions(
        string $workType,
        Carbon $workDate,
        int $projectId,
        ?float $startChainage = null,
        ?float $endChainage = null
    ): array {
        // Get weather constraints for this work type
        $constraints = self::WEATHER_CONSTRAINTS[$workType] ?? null;

        if (!$constraints) {
            return [
                'suitable' => true,
                'violations' => [],
                'message' => 'No weather constraints defined for this work type',
                'weather_data' => null,
                'constraint_level' => 'none'
            ];
        }

        // Fetch weather data for the work date
        $weatherData = $this->getWeatherData($workDate, $projectId, $startChainage, $endChainage);

        if (!$weatherData) {
            return [
                'suitable' => null, // Unknown
                'violations' => [],
                'message' => 'No weather data available for validation (RISK: Cannot verify compliance)',
                'weather_data' => null,
                'constraint_level' => 'high',
                'warning' => 'Missing weather log creates liability exposure'
            ];
        }

        // Check each constraint
        $violations = [];

        if ($weatherData->temperature < $constraints['min_temp']) {
            $violations[] = [
                'type' => 'temperature_too_low',
                'actual' => $weatherData->temperature,
                'limit' => $constraints['min_temp'],
                'message' => "Temperature {$weatherData->temperature}°C below minimum {$constraints['min_temp']}°C"
            ];
        }

        if ($weatherData->temperature > $constraints['max_temp']) {
            $violations[] = [
                'type' => 'temperature_too_high',
                'actual' => $weatherData->temperature,
                'limit' => $constraints['max_temp'],
                'message' => "Temperature {$weatherData->temperature}°C exceeds maximum {$constraints['max_temp']}°C"
            ];
        }

        if ($weatherData->wind_speed > $constraints['max_wind_speed']) {
            $violations[] = [
                'type' => 'wind_too_high',
                'actual' => $weatherData->wind_speed,
                'limit' => $constraints['max_wind_speed'],
                'message' => "Wind speed {$weatherData->wind_speed} km/h exceeds maximum {$constraints['max_wind_speed']} km/h"
            ];
        }

        if ($weatherData->precipitation > $constraints['max_precipitation']) {
            $violations[] = [
                'type' => 'precipitation_exceeded',
                'actual' => $weatherData->precipitation,
                'limit' => $constraints['max_precipitation'],
                'message' => "Precipitation {$weatherData->precipitation}mm exceeds maximum {$constraints['max_precipitation']}mm"
            ];
        }

        if (isset($constraints['max_humidity']) && $weatherData->humidity > $constraints['max_humidity']) {
            $violations[] = [
                'type' => 'humidity_too_high',
                'actual' => $weatherData->humidity,
                'limit' => $constraints['max_humidity'],
                'message' => "Humidity {$weatherData->humidity}% exceeds maximum {$constraints['max_humidity']}%"
            ];
        }

        $suitable = empty($violations);

        // Log validation for audit trail
        Log::channel('quality')->info('Weather validation', [
            'work_type' => $workType,
            'work_date' => $workDate->toDateString(),
            'project_id' => $projectId,
            'suitable' => $suitable,
            'violations_count' => count($violations),
            'weather_conditions' => [
                'temperature' => $weatherData->temperature,
                'wind_speed' => $weatherData->wind_speed,
                'precipitation' => $weatherData->precipitation,
                'humidity' => $weatherData->humidity
            ]
        ]);

        return [
            'suitable' => $suitable,
            'violations' => $violations,
            'message' => $suitable 
                ? 'Weather conditions were suitable for ' . str_replace('_', ' ', $workType)
                : 'Weather violations detected: ' . $constraints['reason'],
            'weather_data' => [
                'temperature' => $weatherData->temperature,
                'wind_speed' => $weatherData->wind_speed,
                'precipitation' => $weatherData->precipitation,
                'humidity' => $weatherData->humidity,
                'condition' => $weatherData->weather_condition
            ],
            'constraints' => $constraints,
            'constraint_level' => 'high'
        ];
    }

    /**
     * Get weather data for a specific date and location
     */
    private function getWeatherData(
        Carbon $date,
        int $projectId,
        ?float $startChainage = null,
        ?float $endChainage = null
    ) {
        $query = WeatherLog::where('project_id', $projectId)
            ->whereDate('log_date', $date->toDateString());

        // If chainage range specified, find closest weather station
        if ($startChainage !== null && $endChainage !== null) {
            $midChainage = ($startChainage + $endChainage) / 2;
            $query->whereBetween('chainage', [$midChainage - 500, $midChainage + 500]);
        }

        return $query->first();
    }

    /**
     * Validate work duration against weather data (multi-day projects)
     *
     * @param string $workType
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @param int $projectId
     * @return array
     */
    public function validateWorkPeriod(
        string $workType,
        Carbon $startDate,
        Carbon $endDate,
        int $projectId
    ): array {
        $results = [];
        $currentDate = $startDate->copy();
        $unsuitableDays = 0;

        while ($currentDate->lte($endDate)) {
            $dailyValidation = $this->validateWorkConditions(
                $workType,
                $currentDate,
                $projectId
            );

            if (!$dailyValidation['suitable']) {
                $unsuitableDays++;
            }

            $results[$currentDate->toDateString()] = $dailyValidation;
            $currentDate->addDay();
        }

        $totalDays = $startDate->diffInDays($endDate) + 1;

        return [
            'total_days' => $totalDays,
            'unsuitable_days' => $unsuitableDays,
            'compliance_rate' => round((($totalDays - $unsuitableDays) / $totalDays) * 100, 2),
            'daily_results' => $results,
            'overall_suitable' => $unsuitableDays === 0,
            'message' => $unsuitableDays === 0 
                ? 'All work days had suitable weather conditions'
                : "$unsuitableDays out of $totalDays days had unsuitable weather"
        ];
    }

    /**
     * Get recommended work window based on weather forecast
     * (Future feature: integrate with weather API)
     *
     * @param string $workType
     * @param int $projectId
     * @param int $daysAhead
     * @return array
     */
    public function getRecommendedWorkWindow(
        string $workType,
        int $projectId,
        int $daysAhead = 7
    ): array {
        // This would integrate with external weather API
        // For now, return structure
        return [
            'work_type' => $workType,
            'suitable_dates' => [],
            'unsuitable_dates' => [],
            'confidence' => 'medium',
            'recommendation' => 'Feature requires weather API integration'
        ];
    }

    /**
     * Calculate weather-related delay justification for claims
     *
     * @param Carbon $periodStart
     * @param Carbon $periodEnd
     * @param int $projectId
     * @return array Claim defense data
     */
    public function generateDelayJustification(
        Carbon $periodStart,
        Carbon $periodEnd,
        int $projectId
    ): array {
        $weatherLogs = WeatherLog::where('project_id', $projectId)
            ->whereBetween('log_date', [$periodStart, $periodEnd])
            ->get();

        $workStoppedDays = $weatherLogs->where('work_impact', 'work_stopped')->count();
        $majorDelayDays = $weatherLogs->where('work_impact', 'major_delay')->count();
        $minorDelayDays = $weatherLogs->where('work_impact', 'minor_delay')->count();

        return [
            'period' => [
                'start' => $periodStart->toDateString(),
                'end' => $periodEnd->toDateString(),
                'total_days' => $periodStart->diffInDays($periodEnd) + 1
            ],
            'impact_summary' => [
                'work_stopped' => $workStoppedDays,
                'major_delay' => $majorDelayDays,
                'minor_delay' => $minorDelayDays,
                'no_impact' => $weatherLogs->where('work_impact', 'no_impact')->count()
            ],
            'total_impacted_days' => $workStoppedDays + $majorDelayDays,
            'claim_defensible' => $workStoppedDays + $majorDelayDays > 0,
            'evidence_strength' => $weatherLogs->count() > 0 ? 'strong' : 'weak',
            'recommendation' => $workStoppedDays > 0 
                ? 'Force Majeure claim supported by weather logs'
                : 'Minor delays documented but may not qualify for time extension'
        ];
    }
}
