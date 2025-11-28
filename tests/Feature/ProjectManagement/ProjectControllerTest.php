<?php

namespace Tests\Feature\ProjectManagement;

use App\Models\HRM\Department;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class ProjectControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a user with project management permissions
        $this->user = User::factory()->create();
        $this->user->givePermissionTo([
            'project-management.projects.view',
            'project-management.projects.create',
            'project-management.projects.update',
            'project-management.projects.delete',
            'project-management.projects.export',
        ]);
    }

    public function test_can_view_projects_index()
    {
        $this->actingAs($this->user);

        $response = $this->get(route('project-management.projects.index'));

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert
                ->component('ProjectManagement/Projects/Index')
                ->has('projects')
                ->has('kpis')
                ->has('departments')
                ->has('users')
        );
    }

    public function test_can_get_portfolio_analytics()
    {
        $this->actingAs($this->user);

        // Create test projects
        $department = Department::factory()->create();
        Project::factory()->count(5)->create([
            'department_id' => $department->id,
            'project_leader_id' => $this->user->id,
        ]);

        $response = $this->get(route('project-management.projects.analytics'));

        $response->assertOk();
        $response->assertJsonStructure([
            'status_distribution',
            'priority_distribution',
            'health_distribution',
            'risk_distribution',
            'budget_analysis',
            'timeline_analysis',
            'performance_metrics',
        ]);
    }

    public function test_can_get_project_timeline()
    {
        $this->actingAs($this->user);

        // Create test projects
        Project::factory()->count(3)->create([
            'project_leader_id' => $this->user->id,
        ]);

        $response = $this->get(route('project-management.projects.timeline'));

        $response->assertOk();
        $response->assertJsonStructure([
            'projects',
            'date_range',
        ]);
    }

    public function test_can_get_portfolio_matrix()
    {
        $this->actingAs($this->user);

        // Create test projects
        Project::factory()->count(4)->create([
            'project_leader_id' => $this->user->id,
        ]);

        $response = $this->get(route('project-management.projects.matrix'));

        $response->assertOk();
        $response->assertJsonStructure([
            'projects' => [
                '*' => [
                    'id',
                    'name',
                    'value_score',
                    'risk_score',
                    'quadrant',
                ],
            ],
            'quadrants',
        ]);
    }

    public function test_can_bulk_update_projects()
    {
        $this->actingAs($this->user);

        // Create test projects
        $projects = Project::factory()->count(3)->create([
            'project_leader_id' => $this->user->id,
            'status' => 'not_started',
        ]);

        $response = $this->post(route('project-management.projects.bulk-update'), [
            'project_ids' => $projects->pluck('id')->toArray(),
            'action' => 'update_status',
            'data' => ['status' => 'in_progress'],
        ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'updated_count',
            'message',
        ]);

        // Verify projects were updated
        $this->assertDatabaseHas('projects', [
            'id' => $projects->first()->id,
            'status' => 'in_progress',
        ]);
    }

    public function test_can_export_projects()
    {
        $this->actingAs($this->user);

        // Create test projects
        Project::factory()->count(2)->create([
            'project_leader_id' => $this->user->id,
        ]);

        $response = $this->post(route('project-management.projects.export'), [
            'format' => 'csv',
            'columns' => ['project_name', 'status', 'priority'],
        ]);

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    public function test_can_save_and_get_preferences()
    {
        $this->actingAs($this->user);

        // Save preferences
        $preferences = [
            'view_mode' => 'list',
            'per_page' => 20,
            'sort_by' => 'project_name',
            'sort_direction' => 'asc',
            'filters' => ['status' => ['in_progress']],
        ];

        $response = $this->post(route('project-management.projects.save-preferences'), $preferences);
        $response->assertOk();

        // Get preferences
        $response = $this->get(route('project-management.projects.preferences'));
        $response->assertOk();
        $response->assertJsonStructure([
            'view_mode',
            'per_page',
            'sort_by',
            'sort_direction',
            'filters',
        ]);
    }

    public function test_index_with_filters()
    {
        $this->actingAs($this->user);

        // Create test projects with different statuses
        Project::factory()->create([
            'project_leader_id' => $this->user->id,
            'status' => 'in_progress',
            'priority' => 'high',
        ]);

        Project::factory()->create([
            'project_leader_id' => $this->user->id,
            'status' => 'completed',
            'priority' => 'low',
        ]);

        // Test filtering by status
        $response = $this->get(route('project-management.projects.index', [
            'status' => ['in_progress'],
        ]));

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert
                ->component('ProjectManagement/Projects/Index')
                ->has('projects')
                ->where('filters.status', ['in_progress'])
        );
    }

    public function test_index_with_search()
    {
        $this->actingAs($this->user);

        // Create test project with specific name
        Project::factory()->create([
            'project_leader_id' => $this->user->id,
            'project_name' => 'Test Search Project',
        ]);

        Project::factory()->create([
            'project_leader_id' => $this->user->id,
            'project_name' => 'Another Project',
        ]);

        // Test search
        $response = $this->get(route('project-management.projects.index', [
            'search' => 'Test Search',
        ]));

        $response->assertOk();
        $response->assertInertia(
            fn ($assert) => $assert
                ->component('ProjectManagement/Projects/Index')
                ->has('projects')
                ->where('filters.search', 'Test Search')
        );
    }
}
