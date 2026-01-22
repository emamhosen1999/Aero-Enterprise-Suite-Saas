<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Full Project Management Domain Model
     *
     * Tables: sprints, project_members, project_comments, project_attachments,
     *         project_risks, project_labels, project_task_labels
     */
    public function up(): void
    {
        // Sprints/Iterations for Agile methodology
        Schema::create('project_sprints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('name');
            $table->text('goal')->nullable()->comment('Sprint goal/objective');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('status', ['planned', 'active', 'completed', 'cancelled'])->default('planned');
            $table->integer('capacity_points')->nullable()->comment('Team capacity in story points');
            $table->integer('completed_points')->default(0);
            $table->decimal('velocity', 8, 2)->nullable()->comment('Calculated velocity');
            $table->json('retrospective')->nullable()->comment('Sprint retrospective notes');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'status']);
            $table->index('start_date');
        });

        // Add sprint_id to project_tasks if table exists and column not exists
        if (Schema::hasTable('project_tasks') && !Schema::hasColumn('project_tasks', 'sprint_id')) {
            Schema::table('project_tasks', function (Blueprint $table) {
                $table->foreignId('sprint_id')->nullable()->after('milestone_id')
                    ->constrained('project_sprints')->nullOnDelete();
                $table->integer('story_points')->nullable()->after('estimated_hours');
                $table->integer('position')->default(0)->after('story_points')->comment('Order in backlog/sprint');
            });
        }

        // Project Members (many-to-many with roles)
        Schema::create('project_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id')->comment('References users table');
            $table->string('role', 50)->default('member')->comment('project_manager, lead, member, viewer');
            $table->decimal('allocation_percentage', 5, 2)->default(100.00)->comment('% allocated to project');
            $table->date('joined_at');
            $table->date('left_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->json('permissions')->nullable()->comment('Additional project-specific permissions');
            $table->timestamps();

            $table->unique(['project_id', 'user_id']);
            $table->index('user_id');
            $table->index('role');
        });

        // Project Comments (polymorphic for tasks, milestones, issues)
        Schema::create('project_comments', function (Blueprint $table) {
            $table->id();
            $table->morphs('commentable'); // project_tasks, project_milestones, project_issues
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('parent_id')->nullable()->comment('For threaded comments');
            $table->text('content');
            $table->json('mentions')->nullable()->comment('Array of mentioned user IDs');
            $table->boolean('is_internal')->default(false)->comment('Internal notes not visible to external');
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->foreign('parent_id')->references('id')->on('project_comments')->nullOnDelete();
        });

        // Project Attachments (polymorphic)
        Schema::create('project_attachments', function (Blueprint $table) {
            $table->id();
            $table->morphs('attachable');
            $table->unsignedBigInteger('uploaded_by');
            $table->string('name');
            $table->string('original_name');
            $table->string('path');
            $table->string('disk')->default('local');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('size')->comment('File size in bytes');
            $table->json('metadata')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('uploaded_by');
        });

        // Project Risks & Issues
        Schema::create('project_risks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->enum('type', ['risk', 'issue'])->default('risk');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['open', 'mitigating', 'resolved', 'closed', 'accepted'])->default('open');
            $table->enum('probability', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->enum('impact', ['low', 'medium', 'high', 'critical'])->default('medium');
            $table->integer('risk_score')->virtualAs('
                CASE probability WHEN "low" THEN 1 WHEN "medium" THEN 2 WHEN "high" THEN 3 WHEN "critical" THEN 4 END *
                CASE impact WHEN "low" THEN 1 WHEN "medium" THEN 2 WHEN "high" THEN 3 WHEN "critical" THEN 4 END
            ')->nullable();
            $table->text('mitigation_plan')->nullable();
            $table->text('contingency_plan')->nullable();
            $table->unsignedBigInteger('owner_id')->nullable()->comment('Risk owner');
            $table->unsignedBigInteger('reported_by')->nullable();
            $table->date('identified_date');
            $table->date('target_resolution_date')->nullable();
            $table->date('resolved_date')->nullable();
            $table->foreignId('related_task_id')->nullable()->constrained('project_tasks')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['project_id', 'type', 'status']);
        });

        // Labels/Tags for projects and tasks
        Schema::create('project_labels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->string('name', 50);
            $table->string('color', 20)->default('#6366f1');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'name']);
        });

        // Task Labels (pivot)
        Schema::create('project_task_labels', function (Blueprint $table) {
            $table->foreignId('task_id')->constrained('project_tasks')->cascadeOnDelete();
            $table->foreignId('label_id')->constrained('project_labels')->cascadeOnDelete();
            $table->timestamps();

            $table->primary(['task_id', 'label_id']);
        });

        // Watchers for tasks/projects
        Schema::create('project_watchers', function (Blueprint $table) {
            $table->id();
            $table->morphs('watchable');
            $table->unsignedBigInteger('user_id');
            $table->timestamps();

            $table->unique(['watchable_type', 'watchable_id', 'user_id'], 'unique_watcher');
        });

        // Activity Log specific to projects
        Schema::create('project_activity_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->morphs('subject'); // The entity being changed
            $table->unsignedBigInteger('causer_id')->nullable();
            $table->string('event', 50); // created, updated, deleted, status_changed, etc.
            $table->json('properties')->nullable(); // Old and new values
            $table->timestamps();

            $table->index(['project_id', 'created_at']);
            $table->index('causer_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_activity_log');
        Schema::dropIfExists('project_watchers');
        Schema::dropIfExists('project_task_labels');
        Schema::dropIfExists('project_labels');
        Schema::dropIfExists('project_risks');
        Schema::dropIfExists('project_attachments');
        Schema::dropIfExists('project_comments');
        Schema::dropIfExists('project_members');

        // Remove added columns from project_tasks if table exists
        if (Schema::hasTable('project_tasks') && Schema::hasColumn('project_tasks', 'sprint_id')) {
            Schema::table('project_tasks', function (Blueprint $table) {
                $table->dropForeign(['sprint_id']);
                $table->dropColumn(['sprint_id', 'story_points', 'position']);
            });
        }

        Schema::dropIfExists('project_sprints');
    }
};
