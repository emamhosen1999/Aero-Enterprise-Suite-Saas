<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Extend existing projects table with additional fields
        Schema::table('projects', function (Blueprint $table) {
            if (! Schema::hasColumn('projects', 'status')) {
                $table->string('status')->default('not_started')->after('description');
            }
            if (! Schema::hasColumn('projects', 'budget')) {
                $table->decimal('budget', 15, 2)->nullable()->after('rate_type');
            }
            if (! Schema::hasColumn('projects', 'department_id')) {
                $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
            }
            if (! Schema::hasColumn('projects', 'progress')) {
                $table->integer('progress')->default(0)->after('project_leader_id');
            }
            if (! Schema::hasColumn('projects', 'color')) {
                $table->string('color')->nullable()->after('progress');
            }
            if (! Schema::hasColumn('projects', 'notes')) {
                $table->text('notes')->nullable()->after('description');
            }
        });

        // Create project milestones table
        Schema::create('project_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->date('due_date')->nullable();
            $table->string('status')->default('not_started');
            $table->integer('weight')->default(1);
            $table->integer('order')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Create project tasks table
        Schema::create('project_tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('milestone_id')->nullable()->constrained('project_milestones')->onDelete('set null');
            $table->foreignId('parent_task_id')->nullable()->references('id')->on('project_tasks')->onDelete('set null');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('status')->default('todo');
            $table->string('priority')->default('medium');
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->decimal('estimated_hours', 8, 2)->nullable();
            $table->decimal('actual_hours', 8, 2)->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->integer('progress')->default(0);
            $table->json('tags')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Create project task comments table
        Schema::create('project_task_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('project_tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->text('content');
            $table->timestamps();
        });

        // Create project task attachments table
        Schema::create('project_task_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('project_tasks')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('filename');
            $table->string('file_path');
            $table->string('file_type')->nullable();
            $table->integer('file_size')->nullable();
            $table->timestamps();
        });

        // Create project issues table
        Schema::create('project_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type')->default('bug');
            $table->string('status')->default('open');
            $table->string('priority')->default('medium');
            $table->foreignId('reported_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->date('reported_date');
            $table->date('resolution_date')->nullable();
            $table->text('resolution')->nullable();
            $table->json('tags')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Create project task issues pivot table
        Schema::create('project_task_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('project_tasks')->onDelete('cascade');
            $table->foreignId('issue_id')->constrained('project_issues')->onDelete('cascade');
            $table->timestamps();
        });

        // Create project resources table
        Schema::create('project_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role')->nullable();
            $table->integer('allocation_percentage')->default(100);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop tables in reverse order
        Schema::dropIfExists('project_resources');
        Schema::dropIfExists('project_task_issues');
        Schema::dropIfExists('project_issues');
        Schema::dropIfExists('project_task_attachments');
        Schema::dropIfExists('project_task_comments');
        Schema::dropIfExists('project_tasks');
        Schema::dropIfExists('project_milestones');

        // Remove added columns from projects table
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['status', 'budget', 'progress', 'color', 'notes']);
            if (Schema::hasColumn('projects', 'department_id')) {
                $table->dropForeign(['department_id']);
                $table->dropColumn('department_id');
            }
        });
    }
};
