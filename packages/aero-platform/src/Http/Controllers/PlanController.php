<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Models\Plan;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
                    'features' => $plan->features ? json_decode($plan->features, true) : [],
                    'limits' => $plan->limits ? json_decode($plan->limits, true) : [],
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
                    'features' => $plan->features ? json_decode($plan->features, true) : [],
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
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', Rule::unique('plans', 'slug')],
            'description' => ['nullable', 'string'],
            'monthly_price' => ['required', 'numeric', 'min:0'],
            'yearly_price' => ['nullable', 'numeric', 'min:0'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:90'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'features' => ['nullable', 'array'],
            'limits' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer'],
            'stripe_monthly_price_id' => ['nullable', 'string'],
            'stripe_yearly_price_id' => ['nullable', 'string'],
        ]);

        $plan = Plan::create([
            ...$validated,
            'features' => isset($validated['features']) ? json_encode($validated['features']) : null,
            'limits' => isset($validated['limits']) ? json_encode($validated['limits']) : null,
        ]);

        return response()->json([
            'success' => true,
            'plan' => $plan,
            'message' => 'Plan created successfully.',
        ], 201);
    }

    /**
     * Update a plan.
     */
    public function update(Request $request, Plan $plan): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('plans', 'slug')->ignore($plan->id)],
            'description' => ['nullable', 'string'],
            'monthly_price' => ['sometimes', 'numeric', 'min:0'],
            'yearly_price' => ['nullable', 'numeric', 'min:0'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:90'],
            'is_active' => ['boolean'],
            'is_featured' => ['boolean'],
            'features' => ['nullable', 'array'],
            'limits' => ['nullable', 'array'],
            'sort_order' => ['nullable', 'integer'],
            'stripe_monthly_price_id' => ['nullable', 'string'],
            'stripe_yearly_price_id' => ['nullable', 'string'],
        ]);

        if (isset($validated['features'])) {
            $validated['features'] = json_encode($validated['features']);
        }
        if (isset($validated['limits'])) {
            $validated['limits'] = json_encode($validated['limits']);
        }

        $plan->update($validated);

        return response()->json([
            'success' => true,
            'plan' => $plan->fresh(),
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
}
