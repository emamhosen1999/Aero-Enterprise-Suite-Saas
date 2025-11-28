<?php

namespace App\Http\Controllers\SCM;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\SCM\DemandForecast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class DemandForecastController extends Controller
{
    public function index()
    {
        return Inertia::render('SCM/DemandForecast/Index', [
            'forecasts' => DemandForecast::with(['inventoryItem', 'creator'])
                ->latest()
                ->paginate(15),
            'stats' => [
                'total_forecasts' => DemandForecast::count(),
                'active_forecasts' => DemandForecast::where('status', 'active')->count(),
                'completed_forecasts' => DemandForecast::where('status', 'completed')->count(),
                'average_accuracy' => DemandForecast::whereNotNull('accuracy_percentage')->avg('accuracy_percentage'),
            ],
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('SCM/DemandForecast/Create', [
            'inventoryItems' => InventoryItem::select('id', 'name', 'sku')->get(),
            'forecastMethods' => [
                'historical' => 'Historical Data Analysis',
                'linear_regression' => 'Linear Regression',
                'moving_average' => 'Moving Average',
                'exponential_smoothing' => 'Exponential Smoothing',
                'manual' => 'Manual Entry',
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'forecast_name' => 'required|string|max:255',
            'inventory_item_id' => 'nullable|exists:inventory_items,id',
            'forecast_type' => 'required|string|in:product,category,total',
            'forecast_period_start' => 'required|date',
            'forecast_period_end' => 'required|date|after:forecast_period_start',
            'forecast_method' => 'required|string|in:historical,linear_regression,moving_average,exponential_smoothing,manual',
            'forecast_parameters' => 'nullable|array',
            'forecasted_demand' => 'required|numeric|min:0',
            'confidence_level' => 'nullable|numeric|min:0|max:100',
            'notes' => 'nullable|string',
        ]);

        DemandForecast::create(array_merge($validated, [
            'created_by' => Auth::id(),
            'status' => 'draft',
            'confidence_level' => $validated['confidence_level'] ?? 80,
        ]));

        return Redirect::route('scm.demand-forecast.index')->with('status', 'Demand forecast created successfully.');
    }

    public function show(DemandForecast $demandForecast)
    {
        $demandForecast->load(['inventoryItem', 'creator']);

        return Inertia::render('SCM/DemandForecast/Show', [
            'forecast' => $demandForecast,
            'historicalData' => $this->getHistoricalData($demandForecast),
        ]);
    }

    public function edit(DemandForecast $demandForecast)
    {
        return Inertia::render('SCM/DemandForecast/Edit', [
            'forecast' => $demandForecast,
            'inventoryItems' => InventoryItem::select('id', 'name', 'sku')->get(),
            'forecastMethods' => [
                'historical' => 'Historical Data Analysis',
                'linear_regression' => 'Linear Regression',
                'moving_average' => 'Moving Average',
                'exponential_smoothing' => 'Exponential Smoothing',
                'manual' => 'Manual Entry',
            ],
        ]);
    }

    public function update(Request $request, DemandForecast $demandForecast)
    {
        $validated = $request->validate([
            'forecast_name' => 'required|string|max:255',
            'inventory_item_id' => 'nullable|exists:inventory_items,id',
            'forecast_type' => 'required|string|in:product,category,total',
            'forecast_period_start' => 'required|date',
            'forecast_period_end' => 'required|date|after:forecast_period_start',
            'forecast_method' => 'required|string|in:historical,linear_regression,moving_average,exponential_smoothing,manual',
            'forecast_parameters' => 'nullable|array',
            'forecasted_demand' => 'required|numeric|min:0',
            'confidence_level' => 'nullable|numeric|min:0|max:100',
            'actual_demand' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:draft,active,completed,archived',
            'notes' => 'nullable|string',
        ]);

        $demandForecast->update($validated);

        // Calculate accuracy if actual demand is provided
        if ($validated['actual_demand'] !== null) {
            $demandForecast->calculateAccuracy();
        }

        return Redirect::route('scm.demand-forecast.index')->with('status', 'Demand forecast updated successfully.');
    }

    public function destroy(DemandForecast $demandForecast)
    {
        $demandForecast->delete();

        return Redirect::route('scm.demand-forecast.index')->with('status', 'Demand forecast deleted successfully.');
    }

    public function activate(DemandForecast $demandForecast)
    {
        if ($demandForecast->status !== 'draft') {
            return Redirect::back()->with('error', 'Only draft forecasts can be activated.');
        }

        $demandForecast->update(['status' => 'active']);

        return Redirect::back()->with('status', 'Demand forecast activated successfully.');
    }

    public function complete(Request $request, DemandForecast $demandForecast)
    {
        if ($demandForecast->status !== 'active') {
            return Redirect::back()->with('error', 'Only active forecasts can be completed.');
        }

        $validated = $request->validate([
            'actual_demand' => 'required|numeric|min:0',
        ]);

        $demandForecast->update([
            'actual_demand' => $validated['actual_demand'],
            'status' => 'completed',
        ]);

        $demandForecast->calculateAccuracy();

        return Redirect::back()->with('status', 'Demand forecast completed with actual data.');
    }

    public function generateForecast(Request $request)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'nullable|exists:inventory_items,id',
            'forecast_method' => 'required|string|in:historical,linear_regression,moving_average,exponential_smoothing',
            'forecast_period_start' => 'required|date',
            'forecast_period_end' => 'required|date|after:forecast_period_start',
            'parameters' => 'nullable|array',
        ]);

        // This would typically integrate with a forecasting algorithm
        // For now, we'll return a simple calculation based on historical data
        $forecast = $this->calculateForecast($validated);

        return response()->json([
            'forecasted_demand' => $forecast['demand'],
            'confidence_level' => $forecast['confidence'],
            'parameters_used' => $forecast['parameters'],
        ]);
    }

    private function getHistoricalData(DemandForecast $forecast)
    {
        // This would typically query sales/usage data for the item
        // Return mock data for now
        return [
            'sales_data' => [],
            'usage_data' => [],
            'seasonal_patterns' => [],
        ];
    }

    private function calculateForecast(array $parameters)
    {
        // This would implement actual forecasting algorithms
        // For now, return a mock forecast
        return [
            'demand' => rand(100, 1000),
            'confidence' => rand(70, 95),
            'parameters' => $parameters['parameters'] ?? [],
        ];
    }
}
