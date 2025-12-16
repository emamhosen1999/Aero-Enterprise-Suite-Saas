<?php

namespace Aero\Platform\Http\Controllers;

use Aero\Platform\Models\Module;
use Aero\Platform\Models\Plan;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class PlanModuleController extends Controller
{
    /**
     * Get all modules with their hierarchy for plan configuration.
     */
    public function getModules()
    {
        $modules = Module::getCompleteHierarchy();

        return response()->json([
            'success' => true,
            'modules' => $modules,
        ]);
    }

    /**
     * Get modules assigned to a specific plan.
     */
    public function getPlanModules(Plan $plan)
    {
        $modules = $plan->modules()
            ->with(['subModules.components.actions'])
            ->get()
            ->map(function ($module) {
                $pivot = $module->pivot;

                return [
                    'id' => $module->id,
                    'code' => $module->code,
                    'name' => $module->name,
                    'is_enabled' => $pivot->is_enabled ?? true,
                    'limits' => $pivot->limits ? json_decode($pivot->limits, true) : null,
                ];
            });

        return response()->json([
            'success' => true,
            'modules' => $modules,
        ]);
    }

    /**
     * Attach modules to a plan.
     */
    public function attachModules(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'module_ids' => 'required|array',
            'module_ids.*' => 'exists:modules,id',
        ]);

        DB::beginTransaction();
        try {
            foreach ($validated['module_ids'] as $moduleId) {
                $plan->modules()->syncWithoutDetaching([
                    $moduleId => [
                        'is_enabled' => true,
                        'limits' => null,
                    ],
                ]);
            }

            // Clear caches
            Module::clearCache();
            Cache::tags(['plans'])->flush();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Modules attached to plan successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to attach modules: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Detach modules from a plan.
     */
    public function detachModules(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'module_ids' => 'required|array',
            'module_ids.*' => 'exists:modules,id',
        ]);

        DB::beginTransaction();
        try {
            $plan->modules()->detach($validated['module_ids']);

            // Clear caches
            Module::clearCache();
            Cache::tags(['plans'])->flush();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Modules detached from plan successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to detach modules: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update module configuration for a plan.
     */
    public function updateModuleConfig(Request $request, Plan $plan, Module $module)
    {
        $validated = $request->validate([
            'is_enabled' => 'boolean',
            'limits' => 'nullable|array',
        ]);

        try {
            $plan->modules()->updateExistingPivot($module->id, [
                'is_enabled' => $validated['is_enabled'] ?? true,
                'limits' => isset($validated['limits']) ? json_encode($validated['limits']) : null,
            ]);

            // Clear caches
            Module::clearCache();
            Cache::tags(['plans'])->flush();

            return response()->json([
                'success' => true,
                'message' => 'Module configuration updated successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update module configuration: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Sync modules for a plan (replace all).
     */
    public function syncModules(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'modules' => 'required|array',
            'modules.*.id' => 'required|exists:modules,id',
            'modules.*.is_enabled' => 'boolean',
            'modules.*.limits' => 'nullable|array',
        ]);

        DB::beginTransaction();
        try {
            $syncData = [];
            foreach ($validated['modules'] as $moduleData) {
                $syncData[$moduleData['id']] = [
                    'is_enabled' => $moduleData['is_enabled'] ?? true,
                    'limits' => isset($moduleData['limits']) ? json_encode($moduleData['limits']) : null,
                ];
            }

            $plan->modules()->sync($syncData);

            // Clear caches
            Module::clearCache();
            Cache::tags(['plans'])->flush();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Plan modules synced successfully.',
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to sync modules: '.$e->getMessage(),
            ], 500);
        }
    }
}
