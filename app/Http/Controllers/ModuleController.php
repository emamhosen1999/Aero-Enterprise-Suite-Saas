<?php

namespace App\Http\Controllers;

use App\Models\Module;
use App\Models\ModuleComponent;
use App\Models\ModulePermission;
use App\Models\SubModule;
use App\Services\Module\ModulePermissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

        $modules = Module::with([
            'subModules' => fn ($q) => $q->ordered(),
            'subModules.components.permissionRequirements.permission',
            'subModules.permissionRequirements.permission',
            'components.permissionRequirements.permission',
            'permissionRequirements.permission',
        ])->ordered()->get();

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
     * Create a new module
     */
    public function storeModule(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:modules,code|regex:/^[a-z][a-z0-9-]*$/',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:100',
            'route_prefix' => 'nullable|string|max:100',
            'category' => 'required|string|max:50',
            'priority' => 'nullable|integer|min:1|max:999',
            'is_active' => 'nullable|boolean',
            'is_core' => 'nullable|boolean',
            'settings' => 'nullable|array',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            if (! Auth::user()->can('modules.create')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $module = $this->modulePermissionService->createOrUpdateModule($request->all());

            // Assign permissions if provided
            if ($request->has('permissions') && is_array($request->permissions)) {
                $this->modulePermissionService->syncModulePermissions($module->id, $request->permissions);
            }

            DB::commit();

            Log::info('Module created', [
                'module_id' => $module->id,
                'module_code' => $module->code,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Module created successfully',
                'module' => $module->fresh(['subModules', 'components', 'permissionRequirements.permission']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create module: '.$e->getMessage());

            return response()->json(['error' => 'Failed to create module', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update a module
     */
    public function updateModule(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|unique:modules,code,'.$id.'|regex:/^[a-z][a-z0-9-]*$/',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:100',
            'route_prefix' => 'nullable|string|max:100',
            'category' => 'required|string|max:50',
            'priority' => 'nullable|integer|min:1|max:999',
            'is_active' => 'nullable|boolean',
            'is_core' => 'nullable|boolean',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            if (! Auth::user()->can('modules.update')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $module = Module::findOrFail($id);

            // Prevent modifying core modules' core status
            if ($module->is_core && $request->has('is_core') && ! $request->is_core) {
                return response()->json(['error' => 'Cannot remove core status from a core module'], 403);
            }

            $module->update($request->only([
                'code',
                'name',
                'description',
                'icon',
                'route_prefix',
                'category',
                'priority',
                'is_active',
                'is_core',
                'settings',
            ]));

            $this->modulePermissionService->clearCache();

            Log::info('Module updated', [
                'module_id' => $module->id,
                'module_code' => $module->code,
                'updated_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Module updated successfully',
                'module' => $module->fresh(['subModules', 'components', 'permissionRequirements.permission']),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update module: '.$e->getMessage());

            return response()->json(['error' => 'Failed to update module', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a module
     */
    public function destroyModule($id)
    {
        try {
            if (! Auth::user()->can('modules.delete')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $module = Module::findOrFail($id);

            if ($module->is_core) {
                return response()->json(['error' => 'Cannot delete a core module'], 403);
            }

            $moduleName = $module->name;
            $module->delete();

            $this->modulePermissionService->clearCache();

            Log::warning('Module deleted', [
                'module_name' => $moduleName,
                'deleted_by' => Auth::id(),
            ]);

            return response()->json(['message' => 'Module deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to delete module: '.$e->getMessage());

            return response()->json(['error' => 'Failed to delete module', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a new sub-module
     */
    public function storeSubModule(Request $request, $moduleId)
    {
        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|regex:/^[a-z][a-z0-9-]*$/',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:100',
            'route' => 'nullable|string|max:200',
            'priority' => 'nullable|integer|min:1|max:999',
            'is_active' => 'nullable|boolean',
            'settings' => 'nullable|array',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            if (! Auth::user()->can('modules.create')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $module = Module::findOrFail($moduleId);

            // Check for duplicate code within module
            if ($module->subModules()->where('code', $request->code)->exists()) {
                return response()->json(['errors' => ['code' => ['Sub-module code already exists in this module']]], 422);
            }

            $subModule = $this->modulePermissionService->createOrUpdateSubModule($moduleId, $request->all());

            // Assign permissions if provided
            if ($request->has('permissions') && is_array($request->permissions)) {
                $this->modulePermissionService->syncSubModulePermissions($subModule->id, $request->permissions);
            }

            DB::commit();

            Log::info('Sub-module created', [
                'sub_module_id' => $subModule->id,
                'sub_module_code' => $subModule->code,
                'module_id' => $moduleId,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Sub-module created successfully',
                'subModule' => $subModule->fresh(['components', 'permissionRequirements.permission']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create sub-module: '.$e->getMessage());

            return response()->json(['error' => 'Failed to create sub-module', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update a sub-module
     */
    public function updateSubModule(Request $request, $id)
    {
        $subModule = SubModule::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|regex:/^[a-z][a-z0-9-]*$/',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:100',
            'route' => 'nullable|string|max:200',
            'priority' => 'nullable|integer|min:1|max:999',
            'is_active' => 'nullable|boolean',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            if (! Auth::user()->can('modules.update')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Check for duplicate code within module (excluding current)
            if ($subModule->module->subModules()
                ->where('code', $request->code)
                ->where('id', '!=', $id)
                ->exists()) {
                return response()->json(['errors' => ['code' => ['Sub-module code already exists in this module']]], 422);
            }

            $subModule->update($request->only([
                'code',
                'name',
                'description',
                'icon',
                'route',
                'priority',
                'is_active',
                'settings',
            ]));

            $this->modulePermissionService->clearCache();

            Log::info('Sub-module updated', [
                'sub_module_id' => $subModule->id,
                'updated_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Sub-module updated successfully',
                'subModule' => $subModule->fresh(['components', 'permissionRequirements.permission']),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update sub-module: '.$e->getMessage());

            return response()->json(['error' => 'Failed to update sub-module', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a sub-module
     */
    public function destroySubModule($id)
    {
        try {
            if (! Auth::user()->can('modules.delete')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $subModule = SubModule::findOrFail($id);
            $subModuleName = $subModule->name;
            $subModule->delete();

            $this->modulePermissionService->clearCache();

            Log::warning('Sub-module deleted', [
                'sub_module_name' => $subModuleName,
                'deleted_by' => Auth::id(),
            ]);

            return response()->json(['message' => 'Sub-module deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to delete sub-module: '.$e->getMessage());

            return response()->json(['error' => 'Failed to delete sub-module', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Create a new component
     */
    public function storeComponent(Request $request, $moduleId)
    {
        $validator = Validator::make($request->all(), [
            'sub_module_id' => 'nullable|exists:sub_modules,id',
            'code' => 'required|string|max:50|regex:/^[a-z][a-z0-9-]*$/',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'type' => 'required|in:page,section,widget,action,api',
            'route' => 'nullable|string|max:200',
            'is_active' => 'nullable|boolean',
            'settings' => 'nullable|array',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        DB::beginTransaction();

        try {
            if (! Auth::user()->can('modules.create')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            Module::findOrFail($moduleId);

            $component = $this->modulePermissionService->createOrUpdateComponent(
                $moduleId,
                $request->sub_module_id,
                $request->all()
            );

            // Assign permissions if provided
            if ($request->has('permissions') && is_array($request->permissions)) {
                $this->modulePermissionService->syncComponentPermissions($component->id, $request->permissions);
            }

            DB::commit();

            Log::info('Component created', [
                'component_id' => $component->id,
                'component_code' => $component->code,
                'module_id' => $moduleId,
                'created_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Component created successfully',
                'component' => $component->fresh(['permissionRequirements.permission']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create component: '.$e->getMessage());

            return response()->json(['error' => 'Failed to create component', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Update a component
     */
    public function updateComponent(Request $request, $id)
    {
        $component = ModuleComponent::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'code' => 'required|string|max:50|regex:/^[a-z][a-z0-9-]*$/',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'type' => 'required|in:page,section,widget,action,api',
            'route' => 'nullable|string|max:200',
            'is_active' => 'nullable|boolean',
            'settings' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            if (! Auth::user()->can('modules.update')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $component->update($request->only([
                'code',
                'name',
                'description',
                'type',
                'route',
                'is_active',
                'settings',
            ]));

            $this->modulePermissionService->clearCache();

            Log::info('Component updated', [
                'component_id' => $component->id,
                'updated_by' => Auth::id(),
            ]);

            return response()->json([
                'message' => 'Component updated successfully',
                'component' => $component->fresh(['permissionRequirements.permission']),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update component: '.$e->getMessage());

            return response()->json(['error' => 'Failed to update component', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a component
     */
    public function destroyComponent($id)
    {
        try {
            if (! Auth::user()->can('modules.delete')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $component = ModuleComponent::findOrFail($id);
            $componentName = $component->name;
            $component->delete();

            $this->modulePermissionService->clearCache();

            Log::warning('Component deleted', [
                'component_name' => $componentName,
                'deleted_by' => Auth::id(),
            ]);

            return response()->json(['message' => 'Component deleted successfully']);
        } catch (\Exception $e) {
            Log::error('Failed to delete component: '.$e->getMessage());

            return response()->json(['error' => 'Failed to delete component', 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Sync permissions for a module
     */
    public function syncModulePermissions(Request $request, $moduleId)
    {
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
