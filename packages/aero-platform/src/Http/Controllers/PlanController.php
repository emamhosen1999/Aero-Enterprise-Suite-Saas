<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Http\Requests\StorePlanRequest;
use Aero\Platform\Http\Requests\UpdatePlanRequest;
use Aero\Platform\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    /**
     * Get all plans with their modules (admin).
     */
    public function index(): JsonResponse
    {
        $plans = Plan::with(['modules' => function ($query) {
            $query->select('modules.id', 'modules.code', 'modules.name', 'modules.is_core');
        }])
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'monthly_price' => $plan->monthly_price,
                    'yearly_price' => $plan->yearly_price,
                    'trial_days' => $plan->trial_days,
                    'is_active' => $plan->is_active,
                    'is_featured' => $plan->is_featured,
                    'features' => $plan->features ?? [],
                    'limits' => $plan->limits ?? [],
                    'modules' => $plan->modules->map(fn ($m) => [
                        'id' => $m->id,
                        'code' => $m->code,
                        'name' => $m->name,
                        'is_core' => $m->is_core,
                    ]),
                ];
            });

        return response()->json([
            'success' => true,
            'plans' => $plans,
        ]);
    }

    /**
     * Get public plans for registration page.
     */
    public function publicIndex(): JsonResponse
    {
        $plans = Plan::where('is_active', true)
            ->with(['modules' => function ($query) {
                $query->where('is_public', true)
                    ->select('modules.id', 'modules.code', 'modules.name', 'modules.description');
            }])
            ->orderBy('sort_order')
            ->get()
            ->map(function ($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'description' => $plan->description,
                    'monthly_price' => $plan->monthly_price,
                    'yearly_price' => $plan->yearly_price,
                    'trial_days' => $plan->trial_days,
                    'is_featured' => $plan->is_featured,
                    'features' => $plan->features ?? [],
                    'modules' => $plan->modules->map(fn ($m) => [
                        'code' => $m->code,
                        'name' => $m->name,
                        'description' => $m->description,
                    ]),
                ];
            });

        return response()->json([
            'success' => true,
            'plans' => $plans,
        ]);
    }

    /**
     * Get a single plan.
     */
    public function show(Plan $plan): JsonResponse
    {
        $plan->load(['modules']);

        return response()->json([
            'success' => true,
            'plan' => $plan,
        ]);
    }

    /**
     * Store a new plan.
     */
    public function store(StorePlanRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $plan = Plan::create([
            ...$validated,
            'features' => isset($validated['features']) ? json_encode($validated['features']) : null,
            'limits' => isset($validated['limits']) ? json_encode($validated['limits']) : null,
        ]);

        // Sync modules if provided
        if (isset($validated['module_codes']) && is_array($validated['module_codes'])) {
            $modules = \Aero\Platform\Models\Module::whereIn('code', $validated['module_codes'])->pluck('id');
            $plan->modules()->sync($modules);
        }

        return response()->json([
            'success' => true,
            'plan' => $plan->load('modules'),
            'message' => 'Plan created successfully.',
        ], 201);
    }

    /**
     * Update a plan.
     */
    public function update(UpdatePlanRequest $request, Plan $plan): JsonResponse
    {
        $validated = $request->validated();

        if (isset($validated['features'])) {
            $validated['features'] = json_encode($validated['features']);
        }
        if (isset($validated['limits'])) {
            $validated['limits'] = json_encode($validated['limits']);
        }

        $plan->update($validated);

        // Sync modules if provided
        if (isset($validated['module_codes']) && is_array($validated['module_codes'])) {
            $modules = \Aero\Platform\Models\Module::whereIn('code', $validated['module_codes'])->pluck('id');
            $plan->modules()->sync($modules);
        }

        return response()->json([
            'success' => true,
            'plan' => $plan->fresh(['modules']),
            'message' => 'Plan updated successfully.',
        ]);
    }

    /**
     * Delete a plan.
     */
    public function destroy(Plan $plan): JsonResponse
    {
        // Check if any tenants are using this plan
        $tenantsCount = $plan->tenants()->count();

        if ($tenantsCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete plan. {$tenantsCount} tenant(s) are currently using this plan.",
            ], 422);
        }

        $plan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Plan deleted successfully.',
        ]);
    }

    /**
     * Archive/Unarchive a plan.
     * 
     * Archived plans are hidden from public pricing pages but still available
     * for existing subscribers. Uses is_active field to toggle visibility.
     */
    public function archive(Request $request, Plan $plan): JsonResponse
    {
        $validated = $request->validate([
            'archived' => ['required', 'boolean'],
        ]);

        // Toggle is_active (archived = !is_active)
        $plan->update([
            'is_active' => !$validated['archived'],
        ]);

        $status = $validated['archived'] ? 'archived' : 'activated';

        return response()->json([
            'success' => true,
            'plan' => $plan->fresh(),
            'message' => "Plan {$status} successfully.",
        ]);
    }

    /**
     * Get plan statistics.
     */
    public function stats(Plan $plan): JsonResponse
    {
        $activeSubscriptions = $plan->subscriptions()
            ->where('status', 'active')
            ->get();

        return response()->json([
            'success' => true,
            'stats' => [
                'subscribers_count' => $activeSubscriptions->count(),
                'mrr' => $activeSubscriptions->sum('amount'),
                'trial_count' => $plan->subscriptions()->where('status', 'trialing')->count(),
                'cancelled_count' => $plan->subscriptions()->where('status', 'cancelled')->count(),
                'features_count' => is_array($plan->features) ? count($plan->features) : 0,
                'modules_count' => $plan->modules()->count(),
            ],
        ]);
    }
}
