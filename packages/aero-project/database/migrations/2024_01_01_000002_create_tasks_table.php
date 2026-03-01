<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tasks Table - Core task management for projects
     */
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->nullable()->constrained('projects')->nullOnDelete();
            $table->foreignId('milestone_id')->nullable()->comment('FK to project_milestones if exists');
            $table->unsignedBigInteger('assigned_to')->nullable()->index()->comment('FK to users');
            $table->unsignedBigInteger('created_by')->nullable()->comment('FK to users');

            // Core task fields
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['todo', 'pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
            $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');

            // Dates
            $table->date('start_date')->nullable();
            $table->date('due_date')->nullable();
            $table->date('completed_at')->nullable();

            // Tracking
            $table->integer('estimated_hours')->nullable();
            $table->integer('actual_hours')->nullable()->default(0);
            $table->integer('progress')->default(0)->comment('0-100 percentage');

            // Flags
            $table->boolean('is_complete')->default(false);
            $table->boolean('is_billable')->default(false);

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('status');
            $table->index('priority');
            $table->index('due_date');
            $table->index(['project_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
