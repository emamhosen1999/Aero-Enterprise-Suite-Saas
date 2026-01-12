<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add Project Type System Fields
 *
 * This migration adds fields for the multi-domain, department-agnostic
 * project type system that supports different project types (construction,
 * software, marketing, etc.) with their domain-specific configurations.
 *
 * ARCHITECTURAL PRINCIPLE:
 * - project_type: Defines the domain-specific behavior (e.g., 'construction', 'software_development')
 * - department_context: Stores which departments are involved (not tied to any specific department)
 * - type_specific_data: JSON storage for domain-specific fields defined in project_types config
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add project type fields to main projects table
        if (Schema::hasTable('projects')) {
            Schema::table('projects', function (Blueprint $table) {
                // Project type code (references config/project_types.php)
                if (! Schema::hasColumn('projects', 'project_type')) {
                    $table->string('project_type', 50)->default('general')->after('type')
                        ->comment('Project type code from project_types config');
                }

                // Department context - stores involved departments (not a single FK)
                if (! Schema::hasColumn('projects', 'department_context')) {
                    $table->json('department_context')->nullable()->after('department_id')
                        ->comment('JSON array of department involvement: [{id, role, percentage}]');
                }

                // Project methodology (for software/IT projects)
                if (! Schema::hasColumn('projects', 'methodology')) {
                    $table->string('methodology', 50)->nullable()->after('project_type')
                        ->comment('Project methodology: agile, scrum, waterfall, etc.');
                }

                // Sprint duration for agile projects
                if (! Schema::hasColumn('projects', 'sprint_duration')) {
                    $table->unsignedSmallInteger('sprint_duration')->nullable()->after('methodology')
                        ->comment('Sprint duration in days for agile projects');
                }

                // Type-specific data storage (domain-specific fields)
                if (! Schema::hasColumn('projects', 'type_specific_data')) {
                    $table->json('type_specific_data')->nullable()->after('geofence_settings')
                        ->comment('Domain-specific fields based on project_type');
                }

                // Feature flags for this project
                if (! Schema::hasColumn('projects', 'enabled_features')) {
                    $table->json('enabled_features')->nullable()->after('type_specific_data')
                        ->comment('JSON array of enabled feature codes');
                }

                // Workflow template being used
                if (! Schema::hasColumn('projects', 'workflow')) {
                    $table->string('workflow', 50)->nullable()->after('methodology')
                        ->comment('Workflow template code');
                }

                // Index for project type queries
                $table->index('project_type', 'idx_projects_project_type');
                $table->index('methodology', 'idx_projects_methodology');
            });
        }

        // Create project_type_metadata table for storing dynamic type configurations
        if (! Schema::hasTable('project_type_metadata')) {
            Schema::create('project_type_metadata', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id')->nullable();
                $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
                $table->string('field_code', 100);
                $table->string('field_type', 50)->default('text');
                $table->text('field_value')->nullable();
                $table->json('field_options')->nullable()->comment('Additional options for the field');
                $table->timestamps();

                $table->unique(['project_id', 'field_code'], 'uniq_project_type_field');
                $table->index(['tenant_id', 'project_id'], 'idx_tenant_project');
            });
        }

        // Create project_department_involvements table for multi-department tracking
        if (! Schema::hasTable('project_department_involvements')) {
            Schema::create('project_department_involvements', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id')->nullable();
                $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
                $table->unsignedBigInteger('department_id');
                $table->string('role', 50)->default('participating')
                    ->comment('Role: owner, primary, supporting, participating, consulting');
                $table->decimal('allocation_percentage', 5, 2)->default(0)
                    ->comment('Percentage of department resources allocated');
                $table->boolean('is_primary')->default(false)
                    ->comment('Whether this is the primary responsible department');
                $table->json('responsibilities')->nullable()
                    ->comment('JSON array of specific responsibilities');
                $table->timestamps();

                $table->unique(['project_id', 'department_id'], 'uniq_project_department');
                $table->index(['tenant_id', 'department_id'], 'idx_tenant_department');
            });
        }

        // Create project_workflow_steps table for custom workflows
        if (! Schema::hasTable('project_workflow_steps')) {
            Schema::create('project_workflow_steps', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id')->nullable();
                $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
                $table->string('workflow_code', 50);
                $table->string('step_code', 50);
                $table->string('step_name', 100);
                $table->unsignedSmallInteger('step_order');
                $table->enum('status', ['pending', 'in_progress', 'completed', 'skipped'])->default('pending');
                $table->timestamp('started_at')->nullable();
                $table->timestamp('completed_at')->nullable();
                $table->unsignedBigInteger('completed_by')->nullable();
                $table->json('step_data')->nullable()->comment('Step-specific data and outcomes');
                $table->timestamps();

                $table->index(['project_id', 'workflow_code'], 'idx_project_workflow');
                $table->index(['tenant_id', 'status'], 'idx_tenant_workflow_status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop new tables
        Schema::dropIfExists('project_workflow_steps');
        Schema::dropIfExists('project_department_involvements');
        Schema::dropIfExists('project_type_metadata');

        // Remove columns from projects table
        if (Schema::hasTable('projects')) {
            Schema::table('projects', function (Blueprint $table) {
                $table->dropIndex('idx_projects_project_type');
                $table->dropIndex('idx_projects_methodology');

                $columns = [
                    'project_type',
                    'department_context',
                    'methodology',
                    'sprint_duration',
                    'workflow',
                    'type_specific_data',
                    'enabled_features',
                ];

                foreach ($columns as $column) {
                    if (Schema::hasColumn('projects', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
