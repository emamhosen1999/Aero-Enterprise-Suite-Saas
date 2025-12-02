<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\ModuleComponent;
use App\Models\ModulePermission;
use App\Models\SubModule;
use App\Services\Module\ModulePermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

/**
 * Module Controller
 *
 * Handles CRUD operations for the module permission registry system.
 * Manages modules, sub-modules, components, and their permission requirements.
 */
class ModuleController extends Controller
{
    private ModulePermissionService $modulePermissionService;

    public function __construct(ModulePermissionService $modulePermissionService)
    {
        $this->modulePermissionService = $modulePermissionService;
        $this->middleware('auth');
    }

    /**
     * Display the module management interface
     */
    public function index()
    {
        $user = Auth::user();

        if (! $user->can('modules.view')) {
            abort(403, 'Unauthorized access to module management');
        }

        // Get tenant's subscribed modules only
        $tenant = tenant();
        $subscribedModuleIds = collect();

        if ($tenant && $tenant->plan) {
            $subscribedModuleIds = $tenant->plan->modules->pluck('id');
        }

        // Build eager loading relationships - only load permission requirements in tenant context
        $with = [
            'subModules' => fn ($q) => $q->ordered(),
        ];

        // Only load permission relationships when in tenant context
        if (tenancy()->initialized) {
            $with = array_merge($with, [
                'subModules.components.permissionRequirements.permission',
                'subModules.permissionRequirements.permission',
                'components.permissionRequirements.permission',
                'permissionRequirements.permission',
            ]);
        }

        $modules = Module::with($with)
            ->when($subscribedModuleIds->isNotEmpty(), function ($query) use ($subscribedModuleIds) {
                $query->whereIn('id', $subscribedModuleIds);
            })
            ->ordered()
            ->get();

        $permissions = Permission::orderBy('name')->get();
        $statistics = $this->modulePermissionService->getStatistics();

        return Inertia::render('Administration/ModuleManagement', [
            'title' => 'Module Permission Management',
            'modules' => $modules,
            'permissions' => $permissions,
            'statistics' => $statistics,
            'categories' => Module::categories(),
            'componentTypes' => ModuleComponent::types(),
            'requirementTypes' => [
                ModulePermission::TYPE_REQUIRED => 'Required (must have)',
                ModulePermission::TYPE_ANY => 'Any (need one of group)',
                ModulePermission::TYPE_ALL => 'All (need all in group)',
            ],
            'readonly' => true, // Modules are read-only from landlord, only permissions can be assigned
        ]);
    }

    /**
     * Get all modules via API
     */
    public function apiIndex()
    {
        try {
            $modules = $this->modulePermissionService->getModulesWithStructure();

            return response()->json([
                'modules' => $modules,
                'statistics' => $this->modulePermissionService->getStatistics(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get modules: '.$e->getMessage());

            return response()->json(['error' => 'Failed to retrieve modules'], 500);
        }
    }

    /**
     * Get modules accessible by the current user
     */
    public function getAccessibleModules()
    {
        try {
            $navigation = $this->modulePermissionService->getNavigationForUser();

            return response()->json([
                'modules' => $navigation,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get accessible modules: '.$e->getMessage());

            return response()->json(['error' => 'Failed to retrieve accessible modules'], 500);
        }
    }

    /**
     * Sync permissions for a module
     */
    public function syncModulePermissions(Request $request, $moduleId)
    {
        // Module permissions can only be managed in tenant context
        if (! tenancy()->initialized) {
            return response()->json([
                'error' => 'Module permissions can only be managed from tenant context. This is a tenant-level configuration.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'permissions' => 'present|array',
            'permissions.*.permission' => 'required_with:permissions.*|string|exists:permissions,name',
            'permissions.*.type' => 'required_with:permissions.*|in:required,any,all',
            'permissions.*.group' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            if (! Auth::user()->can('modules.update')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            Module::findOrFail($moduleId);

            $this->modulePermissionService->syncModulePermissions($moduleId, $request->permissions);

            Log::info('Module permissions synced', [
                'module_id' => $moduleId,
                'permissions_count' => count($request->permissions),
                'synced_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Module permissions synced successfully',
                'requirements' => ModulePermission::forModule($moduleId)
                    ->with('permission')
                    ->get(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to sync module permissions: '.$e->getMessage());

            return response()->json(['error' => 'Failed to sync permissions', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Sync permissions for a sub-module
     */
    public function syncSubModulePermissions(Request $request, $subModuleId)
    {
        // Module permissions can only be managed in tenant context
        if (! tenancy()->initialized) {
            return response()->json([
                'error' => 'Module permissions can only be managed from tenant context. This is a tenant-level configuration.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'permissions' => 'present|array',
            'permissions.*.permission' => 'required_with:permissions.*|string|exists:permissions,name',
            'permissions.*.type' => 'required_with:permissions.*|in:required,any,all',
            'permissions.*.group' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            if (! Auth::user()->can('modules.update')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            SubModule::findOrFail($subModuleId);

            $this->modulePermissionService->syncSubModulePermissions($subModuleId, $request->permissions);

            Log::info('Sub-module permissions synced', [
                'sub_module_id' => $subModuleId,
                'permissions_count' => count($request->permissions),
                'synced_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Sub-module permissions synced successfully',
                'requirements' => ModulePermission::forSubModule($subModuleId)
                    ->with('permission')
                    ->get(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to sync sub-module permissions: '.$e->getMessage());

            return response()->json(['error' => 'Failed to sync permissions', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Sync permissions for a component
     */
    public function syncComponentPermissions(Request $request, $componentId)
    {
        // Module permissions can only be managed in tenant context
        if (! tenancy()->initialized) {
            return response()->json([
                'error' => 'Module permissions can only be managed from tenant context. This is a tenant-level configuration.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'permissions' => 'present|array',
            'permissions.*.permission' => 'required_with:permissions.*|string|exists:permissions,name',
            'permissions.*.type' => 'required_with:permissions.*|in:required,any,all',
            'permissions.*.group' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            if (! Auth::user()->can('modules.update')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            ModuleComponent::findOrFail($componentId);

            $this->modulePermissionService->syncComponentPermissions($componentId, $request->permissions);

            Log::info('Component permissions synced', [
                'component_id' => $componentId,
                'permissions_count' => count($request->permissions),
                'synced_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Component permissions synced successfully',
                'requirements' => ModulePermission::forComponent($componentId)
                    ->with('permission')
                    ->get(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to sync component permissions: '.$e->getMessage());

            return response()->json(['error' => 'Failed to sync permissions', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get the permission requirements for a specific module
     */
    public function getModuleRequirements($moduleCode)
    {
        try {
            $requirements = $this->modulePermissionService->getModulePermissionRequirements($moduleCode);

            if (empty($requirements)) {
                return response()->json(['error' => 'Module not found'], 404);
            }

            return response()->json($requirements);
        } catch (\Exception $e) {
            Log::error('Failed to get module requirements: '.$e->getMessage());

            return response()->json(['error' => 'Failed to retrieve requirements'], 500);
        }
    }

    /**
     * Check if current user can access a specific module/sub-module/component
     */
    public function checkAccess(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'module' => 'required|string',
            'sub_module' => 'nullable|string',
            'component' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $canAccess = false;

            if ($request->component) {
                $canAccess = $this->modulePermissionService->userCanAccessComponent(
                    $request->module,
                    $request->sub_module,
                    $request->component
                );
            } elseif ($request->sub_module) {
                $canAccess = $this->modulePermissionService->userCanAccessSubModule(
                    $request->module,
                    $request->sub_module
                );
            } else {
                $canAccess = $this->modulePermissionService->userCanAccessModule($request->module);
            }

            return response()->json([
                'can_access' => $canAccess,
                'module' => $request->module,
                'sub_module' => $request->sub_module,
                'component' => $request->component,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to check access: '.$e->getMessage());

            return response()->json(['error' => 'Failed to check access'], 500);
        }
    }
}
