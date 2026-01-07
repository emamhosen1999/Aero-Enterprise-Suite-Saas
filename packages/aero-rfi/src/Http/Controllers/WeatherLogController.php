<?php

namespace Aero\Rfi\Http\Controllers;

use Aero\Rfi\Models\Rfi;
use Aero\Rfi\Models\WeatherLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class WeatherLogController extends Controller
{
    /**
     * Display a listing of weather logs.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $query = WeatherLog::query()
            ->with(['rfi'])
            ->orderBy('observation_time', 'desc');

        // Apply filters
        if ($request->filled('date_from')) {
            $query->whereDate('observation_time', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('observation_time', '<=', $request->date_to);
        }

        if ($request->filled('work_impact')) {
            $query->where('work_impact', $request->work_impact);
        }

        // Pagination
        $perPage = $request->get('perPage', 30);
        $logs = $query->paginate($perPage);

        // If JSON request (for API), return JSON
        if ($request->expectsJson()) {
            return response()->json([
                'items' => $logs->items(),
                'total' => $logs->total(),
                'currentPage' => $logs->currentPage(),
                'lastPage' => $logs->lastPage(),
            ]);
        }

        // Otherwise return Inertia page
        return Inertia::render('RFI/WeatherLogs/Index', [
            'logs' => $logs,
            'filters' => $request->only(['date_from', 'date_to', 'work_impact']),
            'stats' => $this->getWeatherStats(),
        ]);
    }

    /**
     * Store a newly created weather log.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'daily_work_id' => 'required|exists:daily_works,id',
            'observation_time' => 'required|date',
            'temperature_celsius' => 'nullable|numeric',
            'humidity_percent' => 'nullable|numeric|min:0|max:100',
            'rainfall_mm' => 'nullable|numeric|min:0',
            'wind_speed_kmh' => 'nullable|numeric|min:0',
            'weather_condition' => 'required|in:clear,partly_cloudy,cloudy,rainy,heavy_rain,stormy,foggy',
            'work_impact' => 'required|in:no_impact,minor_delay,major_delay,work_stopped',
            'hours_lost' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        $log = WeatherLog::create($validated);

        return response()->json([
            'message' => 'Weather log created successfully',
            'data' => $log->load('rfi'),
        ], 201);
    }

    /**
     * Display the specified weather log.
     */
    public function show(WeatherLog $weatherLog): JsonResponse
    {
        return response()->json([
            'data' => $weatherLog->load('rfi'),
        ]);
    }

    /**
     * Update the specified weather log.
     */
    public function update(Request $request, WeatherLog $weatherLog): JsonResponse
    {
        $validated = $request->validate([
            'daily_work_id' => 'sometimes|required|exists:daily_works,id',
            'observation_time' => 'sometimes|required|date',
            'temperature_celsius' => 'nullable|numeric',
            'humidity_percent' => 'nullable|numeric|min:0|max:100',
            'rainfall_mm' => 'nullable|numeric|min:0',
            'wind_speed_kmh' => 'nullable|numeric|min:0',
            'weather_condition' => 'sometimes|required|in:clear,partly_cloudy,cloudy,rainy,heavy_rain,stormy,foggy',
            'work_impact' => 'sometimes|required|in:no_impact,minor_delay,major_delay,work_stopped',
            'hours_lost' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string',
        ]);

        $weatherLog->update($validated);

        return response()->json([
            'message' => 'Weather log updated successfully',
            'data' => $weatherLog->fresh('rfi'),
        ]);
    }

    /**
     * Remove the specified weather log.
     */
    public function destroy(WeatherLog $weatherLog): JsonResponse
    {
        $weatherLog->delete();

        return response()->json([
            'message' => 'Weather log deleted successfully',
        ]);
    }

    /**
     * Get weather statistics.
     */
    public function getWeatherStats(): array
    {
        $logs = WeatherLog::all();

        return [
            'total_logs' => $logs->count(),
            'total_hours_lost' => $logs->sum('hours_lost'),
            'work_stoppages' => $logs->where('work_impact', 'work_stopped')->count(),
            'major_delays' => $logs->where('work_impact', 'major_delay')->count(),
            'avg_temperature' => round($logs->avg('temperature_celsius'), 1),
            'total_rainfall' => round($logs->sum('rainfall_mm'), 1),
        ];
    }

    /**
     * Get weather impact summary.
     */
    public function impactSummary(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = WeatherLog::query();

        if ($request->filled('date_from')) {
            $query->whereDate('observation_time', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('observation_time', '<=', $request->date_to);
        }

        $summary = $query->select(
            'work_impact',
            DB::raw('COUNT(*) as occurrences'),
            DB::raw('SUM(hours_lost) as total_hours_lost'),
            DB::raw('AVG(rainfall_mm) as avg_rainfall'),
            DB::raw('AVG(wind_speed_kmh) as avg_wind_speed')
        )
            ->groupBy('work_impact')
            ->get();

        return response()->json(['data' => $summary]);
    }

    /**
     * Get work-suitable days calculation.
     */
    public function workSuitableDays(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $logs = WeatherLog::query()
            ->whereDate('observation_time', '>=', $request->date_from)
            ->whereDate('observation_time', '<=', $request->date_to)
            ->get();

        $suitableDays = $logs->filter(fn ($log) => $log->suitable_for_work)->count();
        $totalDays = $logs->count();

        return response()->json([
            'data' => [
                'suitable_days' => $suitableDays,
                'unsuitable_days' => $totalDays - $suitableDays,
                'total_days' => $totalDays,
                'suitability_percentage' => $totalDays > 0 ? round(($suitableDays / $totalDays) * 100, 1) : 0,
            ],
        ]);
    }

    /**
     * Get weather history with daily aggregations.
     */
    public function weatherHistory(Request $request): JsonResponse
    {
        $request->validate([
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
        ]);

        $history = WeatherLog::query()
            ->whereBetween('observation_time', [$request->date_from, $request->date_to])
            ->select(
                DB::raw('DATE(observation_time) as date'),
                DB::raw('AVG(temperature_celsius) as avg_temp'),
                DB::raw('MAX(temperature_celsius) as max_temp'),
                DB::raw('MIN(temperature_celsius) as min_temp'),
                DB::raw('SUM(rainfall_mm) as total_rainfall'),
                DB::raw('MAX(wind_speed_kmh) as max_wind_speed'),
                DB::raw('SUM(hours_lost) as hours_lost'),
                DB::raw('GROUP_CONCAT(DISTINCT weather_condition) as conditions')
            )
            ->groupBy(DB::raw('DATE(observation_time)'))
            ->orderBy('date')
            ->get();

        return response()->json(['data' => $history]);
    }
}
