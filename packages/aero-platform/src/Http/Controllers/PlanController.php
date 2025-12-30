<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Http\Requests\StorePlanRequest;
use Aero\Platform\Http\Requests\UpdatePlanRequest;
use Aero\Platform\Models\Plan;
use Aero\Platform\Models\Subscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    /**
     * Get all plans with their modules (admin).
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Plan::class);

        $perPageParam = $request->input('per_page');
        $shouldPaginate = $perPageParam !== null && $perPageParam !== 'all';
        $perPage = $shouldPaginate ? max((int) $perPageParam, 1) : null;

        $query = Plan::with(['modules' => function ($query) {
            $query->select('modules.id', 'modules.code', 'modules.name', 'modules.is_core');
        }]);

        $search = $request->input('search');
        if (is_string($search) && $search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $tier = $request->input('tier');
        if (is_string($tier) && $tier !== '' && $tier !== 'all') {
            $query->where('tier', $tier);
        }

        $status = $request->input('status');
        if (is_string($status) && $status !== '') {
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'archived') {
                $query->where('is_active', false);
            }
        }

        $plansQuery = $query->orderBy('sort_order');

        // Use a separate collection to compute stats on the full filtered set
        $statsCollection = $plansQuery->get();

        $paginator = $shouldPaginate ? $plansQuery->paginate($perPage) : null;
        $plansCollection = $shouldPaginate ? $paginator->getCollection() : $statsCollection;

        $plans = $plansCollection->map(function ($plan) {
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
        })->values();

        return response()->json([
            'success' => true,
            'plans' => $plans,
            'stats' => $this->buildStats($statsCollection),
            'meta' => $paginator ? [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ] : null,
        ]);
    }

    private function buildStats($plansCollection): array
    {
        $planIds = $plansCollection->pluck('id');

        // Use aggregate queries instead of loading all subscriptions
        $subscriptionStats = Subscription::query()
            ->whereIn('plan_id', $planIds)
            ->active()
            ->selectRaw('
                COUNT(*) as total_count,
                SUM(CASE WHEN billing_cycle = \'yearly\' THEN amount / 12 ELSE amount END) as total_mrr
            ')
            ->first();

        $avgPrice = $plansCollection->avg(function ($plan) {
            return (float) ($plan->monthly_price ?? 0);
        });

        return [
            'total_plans' => $plansCollection->count(),
            'active_subscriptions' => (int) ($subscriptionStats->total_count ?? 0),
            'total_mrr' => round((float) ($subscriptionStats->total_mrr ?? 0), 2),
            'avg_price' => round($avgPrice ?? 0, 2),
        ];
    }

    /**
     * Get public plans for registration page.
     */
    public function publicIndex(): JsonResponse
    {
        $plans = Plan::where('is_active', true)
            ->where('visibility', 'public')
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

        $plan = Plan::create($validated);

        // Sync modules if provided
        if (isset($validated['module_codes']) && is_array($validated['module_codes'])) {
            $modules = \Aero\Platform\Models\Module::whereIn('code', $validated['module_codes'])->pluck('id');
            $plan->modules()->sync($modules);
        }

        // Audit log
        activity('plan')
            ->performedOn($plan)
            ->causedBy(auth('landlord')->user())
            ->withProperties([
                'plan_name' => $plan->name,
                'tier' => $plan->tier,
                'monthly_price' => $plan->monthly_price,
                'module_codes' => $validated['module_codes'] ?? [],
            ])
            ->log('Plan created');

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
        $oldValues = $plan->only(['name', 'tier', 'monthly_price', 'yearly_price', 'is_active']);

        $plan->update($validated);

        // Sync modules if provided
        if (isset($validated['module_codes']) && is_array($validated['module_codes'])) {
            $modules = \Aero\Platform\Models\Module::whereIn('code', $validated['module_codes'])->pluck('id');
            $plan->modules()->sync($modules);
        }

        // Audit log
        activity('plan')
            ->performedOn($plan)
            ->causedBy(auth('landlord')->user())
            ->withProperties([
                'old' => $oldValues,
                'new' => $plan->only(['name', 'tier', 'monthly_price', 'yearly_price', 'is_active']),
                'module_codes' => $validated['module_codes'] ?? [],
            ])
            ->log('Plan updated');

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
        // Check if any active or trialing subscriptions exist
        $activeSubscriptions = $plan->subscriptions()
            ->whereIn('status', ['active', 'trialing'])
            ->count();

        if ($activeSubscriptions > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete plan. {$activeSubscriptions} active subscription(s) exist. Archive the plan instead.",
            ], 422);
        }

        // Also check tenant count as fallback
        $tenantsCount = $plan->tenants()->count();
        if ($tenantsCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot delete plan. {$tenantsCount} tenant(s) are associated with this plan.",
            ], 422);
        }

        $planData = ['id' => $plan->id, 'name' => $plan->name, 'tier' => $plan->tier];
        $plan->delete();

        // Audit log
        activity('plan')
            ->causedBy(auth('landlord')->user())
            ->withProperties($planData)
            ->log('Plan deleted');

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

        // Audit log
        activity('plan')
            ->performedOn($plan)
            ->causedBy(auth('landlord')->user())
            ->withProperties([
                'plan_name' => $plan->name,
                'action' => $status,
                'is_active' => $plan->is_active,
            ])
            ->log("Plan {$status}");

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
