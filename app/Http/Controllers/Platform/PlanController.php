<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Plan;

class PlanController extends Controller
{
    /**
     * Get all plans with their modules.
     */
    public function index()
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
}
