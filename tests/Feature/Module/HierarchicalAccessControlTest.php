<?php

namespace Tests\Feature\Module;

use App\Models\Module;
use App\Models\ModuleComponent;
use App\Models\ModuleComponentAction;
use App\Models\ModulePermission;
use App\Models\Plan;
use App\Models\SubModule;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Services\Module\ModuleAccessService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class HierarchicalAccessControlTest extends TestCase
{
    use RefreshDatabase;

    protected ModuleAccessService $accessService;

    protected Tenant $tenant;

    protected User $user;

    protected Module $module;

    protected SubModule $subModule;

    protected ModuleComponent $component;

    protected ModuleComponentAction $action;

    protected Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->accessService = app(ModuleAccessService::class);

        // Create tenant and user
        $this->tenant = Tenant::factory()->create([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
        ]);

        $this->user = User::factory()->create([
            'tenant_id' => $this->tenant->id,
        ]);

        // Create module hierarchy
        $this->module = Module::create([
            'code' => 'test-module',
            'name' => 'Test Module',
            'icon' => 'test-icon',
            'route_prefix' => 'test',
            'is_active' => true,
            'is_core' => false,
            'order' => 1,
        ]);

        $this->subModule = SubModule::create([
            'module_id' => $this->module->id,
            'code' => 'test-submodule',
            'name' => 'Test SubModule',
            'icon' => 'test-icon',
            'route_name' => 'test.submodule',
            'is_active' => true,
            'order' => 1,
        ]);

        $this->component = ModuleComponent::create([
            'module_id' => $this->module->id,
            'sub_module_id' => $this->subModule->id,
            'code' => 'test-component',
            'name' => 'Test Component',
            'route' => 'test.component',
            'description' => 'Test component description',
        ]);

        $this->action = ModuleComponentAction::create([
            'module_component_id' => $this->component->id,
            'code' => 'test-action',
            'name' => 'Test Action',
            'description' => 'Test action description',
        ]);

        // Create plan
        $this->plan = Plan::factory()->create([
            'name' => 'Test Plan',
            'price' => 10.00,
            'billing_cycle' => 'monthly',
        ]);

        // Link module to plan
        $this->plan->modules()->attach($this->module->id, [
            'is_enabled' => true,
        ]);
    }

    public function test_user_cannot_access_module_without_subscription(): void
    {
        $result = $this->accessService->canAccessModule($this->user, 'test-module');

        $this->assertFalse($result['allowed']);
        $this->assertEquals('plan_restriction', $result['reason']);
    }

    public function test_user_cannot_access_module_without_permission(): void
    {
        // Create subscription
        Subscription::factory()->create([
            'tenant_id' => $this->tenant->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
        ]);

        // Create permission requirement
        $permission = Permission::create(['name' => 'test.module.access']);
        ModulePermission::create([
            'module_id' => $this->module->id,
            'permission_id' => $permission->id,
            'is_required' => true,
        ]);

        $result = $this->accessService->canAccessModule($this->user, 'test-module');

        $this->assertFalse($result['allowed']);
        $this->assertEquals('insufficient_permissions', $result['reason']);
    }

    public function test_user_can_access_module_with_both_subscription_and_permission(): void
    {
        // Create subscription
        Subscription::factory()->create([
            'tenant_id' => $this->tenant->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
        ]);

        // Create permission and assign to user
        $permission = Permission::create(['name' => 'test.module.access']);
        ModulePermission::create([
            'module_id' => $this->module->id,
            'permission_id' => $permission->id,
            'is_required' => true,
        ]);

        $role = Role::create(['name' => 'Test Role']);
        $role->givePermissionTo($permission);
        $this->user->assignRole($role);

        $result = $this->accessService->canAccessModule($this->user, 'test-module');

        $this->assertTrue($result['allowed']);
        $this->assertEquals('success', $result['reason']);
    }

    public function test_user_can_access_submodule_with_proper_access(): void
    {
        // Setup subscription and module permission
        Subscription::factory()->create([
            'tenant_id' => $this->tenant->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
        ]);

        $modulePermission = Permission::create(['name' => 'test.module.access']);
        ModulePermission::create([
            'module_id' => $this->module->id,
            'permission_id' => $modulePermission->id,
            'is_required' => true,
        ]);

        $submodulePermission = Permission::create(['name' => 'test.submodule.access']);
        ModulePermission::create([
            'sub_module_id' => $this->subModule->id,
            'module_id' => $this->module->id,
            'permission_id' => $submodulePermission->id,
            'is_required' => true,
        ]);

        $role = Role::create(['name' => 'Test Role']);
        $role->givePermissionTo([$modulePermission, $submodulePermission]);
        $this->user->assignRole($role);

        $result = $this->accessService->canAccessSubModule($this->user, 'test-module', 'test-submodule');

        $this->assertTrue($result['allowed']);
        $this->assertEquals('success', $result['reason']);
    }

    public function test_user_can_access_component_with_proper_access(): void
    {
        // Setup subscription and permissions
        Subscription::factory()->create([
            'tenant_id' => $this->tenant->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
        ]);

        $modulePermission = Permission::create(['name' => 'test.module.access']);
        ModulePermission::create([
            'module_id' => $this->module->id,
            'permission_id' => $modulePermission->id,
            'is_required' => true,
        ]);

        $submodulePermission = Permission::create(['name' => 'test.submodule.access']);
        ModulePermission::create([
            'sub_module_id' => $this->subModule->id,
            'module_id' => $this->module->id,
            'permission_id' => $submodulePermission->id,
            'is_required' => true,
        ]);

        $componentPermission = Permission::create(['name' => 'test.component.access']);
        ModulePermission::create([
            'component_id' => $this->component->id,
            'module_id' => $this->module->id,
            'sub_module_id' => $this->subModule->id,
            'permission_id' => $componentPermission->id,
            'is_required' => true,
        ]);

        $role = Role::create(['name' => 'Test Role']);
        $role->givePermissionTo([$modulePermission, $submodulePermission, $componentPermission]);
        $this->user->assignRole($role);

        $result = $this->accessService->canAccessComponent($this->user, 'test-module', 'test-submodule', 'test-component');

        $this->assertTrue($result['allowed']);
        $this->assertEquals('success', $result['reason']);
    }

    public function test_user_can_perform_action_with_proper_access(): void
    {
        // Setup subscription and permissions
        Subscription::factory()->create([
            'tenant_id' => $this->tenant->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
        ]);

        $modulePermission = Permission::create(['name' => 'test.module.access']);
        ModulePermission::create([
            'module_id' => $this->module->id,
            'permission_id' => $modulePermission->id,
            'is_required' => true,
        ]);

        $submodulePermission = Permission::create(['name' => 'test.submodule.access']);
        ModulePermission::create([
            'sub_module_id' => $this->subModule->id,
            'module_id' => $this->module->id,
            'permission_id' => $submodulePermission->id,
            'is_required' => true,
        ]);

        $componentPermission = Permission::create(['name' => 'test.component.access']);
        ModulePermission::create([
            'component_id' => $this->component->id,
            'module_id' => $this->module->id,
            'sub_module_id' => $this->subModule->id,
            'permission_id' => $componentPermission->id,
            'is_required' => true,
        ]);

        $actionPermission = Permission::create(['name' => 'test.action.perform']);
        ModulePermission::create([
            'module_component_action_id' => $this->action->id,
            'component_id' => $this->component->id,
            'module_id' => $this->module->id,
            'sub_module_id' => $this->subModule->id,
            'permission_id' => $actionPermission->id,
            'is_required' => true,
        ]);

        $role = Role::create(['name' => 'Test Role']);
        $role->givePermissionTo([$modulePermission, $submodulePermission, $componentPermission, $actionPermission]);
        $this->user->assignRole($role);

        $result = $this->accessService->canPerformAction(
            $this->user,
            'test-module',
            'test-submodule',
            'test-component',
            'test-action'
        );

        $this->assertTrue($result['allowed']);
        $this->assertEquals('success', $result['reason']);
    }

    public function test_access_denied_if_any_level_fails(): void
    {
        // Setup subscription and all permissions EXCEPT action permission
        Subscription::factory()->create([
            'tenant_id' => $this->tenant->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
        ]);

        $modulePermission = Permission::create(['name' => 'test.module.access']);
        ModulePermission::create([
            'module_id' => $this->module->id,
            'permission_id' => $modulePermission->id,
            'is_required' => true,
        ]);

        $submodulePermission = Permission::create(['name' => 'test.submodule.access']);
        ModulePermission::create([
            'sub_module_id' => $this->subModule->id,
            'module_id' => $this->module->id,
            'permission_id' => $submodulePermission->id,
            'is_required' => true,
        ]);

        $componentPermission = Permission::create(['name' => 'test.component.access']);
        ModulePermission::create([
            'component_id' => $this->component->id,
            'module_id' => $this->module->id,
            'sub_module_id' => $this->subModule->id,
            'permission_id' => $componentPermission->id,
            'is_required' => true,
        ]);

        // Create action permission requirement but DON'T assign to user
        $actionPermission = Permission::create(['name' => 'test.action.perform']);
        ModulePermission::create([
            'module_component_action_id' => $this->action->id,
            'component_id' => $this->component->id,
            'module_id' => $this->module->id,
            'sub_module_id' => $this->subModule->id,
            'permission_id' => $actionPermission->id,
            'is_required' => true,
        ]);

        $role = Role::create(['name' => 'Test Role']);
        $role->givePermissionTo([$modulePermission, $submodulePermission, $componentPermission]);
        $this->user->assignRole($role);

        $result = $this->accessService->canPerformAction(
            $this->user,
            'test-module',
            'test-submodule',
            'test-component',
            'test-action'
        );

        $this->assertFalse($result['allowed']);
        $this->assertEquals('insufficient_permissions', $result['reason']);
    }
}
