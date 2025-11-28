<?php

namespace App\Http\Controllers\SCM;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\SCM\ProductionPlan;
use App\Models\SCM\ProductionPlanMaterial;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ProductionPlanController extends Controller
{
    public function index()
    {
        return Inertia::render('SCM/ProductionPlan/Index', [
            'plans' => ProductionPlan::with(['product', 'assignedUser', 'materials.inventoryItem'])
                ->latest()
                ->paginate(15),
            'stats' => [
                'total_plans' => ProductionPlan::count(),
                'active_plans' => ProductionPlan::whereIn('status', ['scheduled', 'in_progress'])->count(),
                'completed_plans' => ProductionPlan::where('status', 'completed')->count(),
                'overdue_plans' => ProductionPlan::where('planned_end_date', '<', now())->whereNotIn('status', ['completed', 'cancelled'])->count(),
            ],
            'status' => session('status'),
        ]);
    }

    public function create()
    {
        return Inertia::render('SCM/ProductionPlan/Create', [
            'products' => InventoryItem::select('id', 'name', 'sku')->get(),
            'materials' => InventoryItem::select('id', 'name', 'sku', 'unit_price')->get(),
            'users' => User::select('id', 'name')->get(),
            'nextPlanNumber' => $this->generatePlanNumber(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'plan_number' => 'required|string|unique:production_plans,plan_number',
            'plan_name' => 'required|string|max:255',
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'planned_quantity' => 'required|numeric|min:1',
            'planned_start_date' => 'required|date',
            'planned_end_date' => 'required|date|after_or_equal:planned_start_date',
            'assigned_to' => 'nullable|exists:users,id',
            'estimated_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'materials' => 'nullable|array',
            'materials.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'materials.*.required_quantity' => 'required|numeric|min:1',
        ]);

        DB::transaction(function () use ($validated) {
            $productionPlan = ProductionPlan::create([
                'plan_number' => $validated['plan_number'],
                'plan_name' => $validated['plan_name'],
                'inventory_item_id' => $validated['inventory_item_id'],
                'planned_quantity' => $validated['planned_quantity'],
                'planned_start_date' => $validated['planned_start_date'],
                'planned_end_date' => $validated['planned_end_date'],
                'assigned_to' => $validated['assigned_to'],
                'estimated_cost' => $validated['estimated_cost'],
                'notes' => $validated['notes'],
                'status' => 'planning',
            ]);

            if (isset($validated['materials'])) {
                foreach ($validated['materials'] as $material) {
                    ProductionPlanMaterial::create([
                        'production_plan_id' => $productionPlan->id,
                        'inventory_item_id' => $material['inventory_item_id'],
                        'required_quantity' => $material['required_quantity'],
                    ]);
                }
            }
        });

        return Redirect::route('scm.production-plan.index')->with('status', 'Production plan created successfully.');
    }

    public function show(ProductionPlan $productionPlan)
    {
        $productionPlan->load(['product', 'assignedUser', 'materials.inventoryItem']);

        return Inertia::render('SCM/ProductionPlan/Show', [
            'plan' => $productionPlan,
            'progressData' => [
                'completion_percentage' => $productionPlan->completion_percentage,
                'is_overdue' => $productionPlan->isOverdue(),
                'total_material_cost' => $productionPlan->total_material_cost,
            ],
        ]);
    }

    public function edit(ProductionPlan $productionPlan)
    {
        $productionPlan->load(['materials']);

        return Inertia::render('SCM/ProductionPlan/Edit', [
            'plan' => $productionPlan,
            'products' => InventoryItem::select('id', 'name', 'sku')->get(),
            'materials' => InventoryItem::select('id', 'name', 'sku', 'unit_price')->get(),
            'users' => User::select('id', 'name')->get(),
        ]);
    }

    public function update(Request $request, ProductionPlan $productionPlan)
    {
        $validated = $request->validate([
            'plan_name' => 'required|string|max:255',
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'planned_quantity' => 'required|numeric|min:1',
            'planned_start_date' => 'required|date',
            'planned_end_date' => 'required|date|after_or_equal:planned_start_date',
            'actual_start_date' => 'nullable|date',
            'actual_end_date' => 'nullable|date|after_or_equal:actual_start_date',
            'actual_quantity' => 'nullable|numeric|min:0',
            'assigned_to' => 'nullable|exists:users,id',
            'estimated_cost' => 'nullable|numeric|min:0',
            'actual_cost' => 'nullable|numeric|min:0',
            'status' => 'required|string|in:planning,scheduled,in_progress,completed,cancelled,on_hold',
            'notes' => 'nullable|string',
            'materials' => 'nullable|array',
            'materials.*.id' => 'nullable|exists:production_plan_materials,id',
            'materials.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'materials.*.required_quantity' => 'required|numeric|min:1',
            'materials.*.allocated_quantity' => 'nullable|numeric|min:0',
            'materials.*.consumed_quantity' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $productionPlan) {
            $productionPlan->update([
                'plan_name' => $validated['plan_name'],
                'inventory_item_id' => $validated['inventory_item_id'],
                'planned_quantity' => $validated['planned_quantity'],
                'planned_start_date' => $validated['planned_start_date'],
                'planned_end_date' => $validated['planned_end_date'],
                'actual_start_date' => $validated['actual_start_date'],
                'actual_end_date' => $validated['actual_end_date'],
                'actual_quantity' => $validated['actual_quantity'] ?? 0,
                'assigned_to' => $validated['assigned_to'],
                'estimated_cost' => $validated['estimated_cost'],
                'actual_cost' => $validated['actual_cost'],
                'status' => $validated['status'],
                'notes' => $validated['notes'],
            ]);

            if (isset($validated['materials'])) {
                // Delete existing materials that are not in the update
                $existingIds = collect($validated['materials'])->pluck('id')->filter();
                $productionPlan->materials()->whereNotIn('id', $existingIds)->delete();

                foreach ($validated['materials'] as $material) {
                    if (isset($material['id'])) {
                        // Update existing material
                        ProductionPlanMaterial::where('id', $material['id'])->update([
                            'inventory_item_id' => $material['inventory_item_id'],
                            'required_quantity' => $material['required_quantity'],
                            'allocated_quantity' => $material['allocated_quantity'] ?? 0,
                            'consumed_quantity' => $material['consumed_quantity'] ?? 0,
                        ]);
                    } else {
                        // Create new material
                        ProductionPlanMaterial::create([
                            'production_plan_id' => $productionPlan->id,
                            'inventory_item_id' => $material['inventory_item_id'],
                            'required_quantity' => $material['required_quantity'],
                            'allocated_quantity' => $material['allocated_quantity'] ?? 0,
                            'consumed_quantity' => $material['consumed_quantity'] ?? 0,
                        ]);
                    }
                }
            }
        });

        return Redirect::route('scm.production-plan.index')->with('status', 'Production plan updated successfully.');
    }

    public function destroy(ProductionPlan $productionPlan)
    {
        if (in_array($productionPlan->status, ['in_progress', 'completed'])) {
            return Redirect::route('scm.production-plan.index')->with('error', 'Cannot delete plans that are in progress or completed.');
        }

        $productionPlan->delete();

        return Redirect::route('scm.production-plan.index')->with('status', 'Production plan deleted successfully.');
    }

    public function start(ProductionPlan $productionPlan)
    {
        if ($productionPlan->status !== 'scheduled') {
            return Redirect::back()->with('error', 'Only scheduled plans can be started.');
        }

        $productionPlan->update([
            'status' => 'in_progress',
            'actual_start_date' => now()->toDateString(),
        ]);

        return Redirect::back()->with('status', 'Production plan started successfully.');
    }

    public function complete(Request $request, ProductionPlan $productionPlan)
    {
        if ($productionPlan->status !== 'in_progress') {
            return Redirect::back()->with('error', 'Only in-progress plans can be completed.');
        }

        $validated = $request->validate([
            'actual_quantity' => 'required|numeric|min:0',
            'actual_cost' => 'nullable|numeric|min:0',
        ]);

        $productionPlan->update([
            'status' => 'completed',
            'actual_end_date' => now()->toDateString(),
            'actual_quantity' => $validated['actual_quantity'],
            'actual_cost' => $validated['actual_cost'],
        ]);

        return Redirect::back()->with('status', 'Production plan completed successfully.');
    }

    public function schedule(ProductionPlan $productionPlan)
    {
        if ($productionPlan->status !== 'planning') {
            return Redirect::back()->with('error', 'Only planning status plans can be scheduled.');
        }

        $productionPlan->update(['status' => 'scheduled']);

        return Redirect::back()->with('status', 'Production plan scheduled successfully.');
    }

    public function hold(ProductionPlan $productionPlan)
    {
        if (! in_array($productionPlan->status, ['scheduled', 'in_progress'])) {
            return Redirect::back()->with('error', 'Only scheduled or in-progress plans can be put on hold.');
        }

        $productionPlan->update(['status' => 'on_hold']);

        return Redirect::back()->with('status', 'Production plan put on hold.');
    }

    public function resume(ProductionPlan $productionPlan)
    {
        if ($productionPlan->status !== 'on_hold') {
            return Redirect::back()->with('error', 'Only plans on hold can be resumed.');
        }

        $previousStatus = $productionPlan->actual_start_date ? 'in_progress' : 'scheduled';
        $productionPlan->update(['status' => $previousStatus]);

        return Redirect::back()->with('status', 'Production plan resumed.');
    }

    private function generatePlanNumber()
    {
        $lastPlan = ProductionPlan::latest('id')->first();
        $nextNumber = $lastPlan ? (int) substr($lastPlan->plan_number, 3) + 1 : 1;

        return 'PP-'.str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }
}
