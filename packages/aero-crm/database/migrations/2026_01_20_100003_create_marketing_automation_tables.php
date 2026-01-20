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
        Schema::create('marketing_workflows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('status', ['draft', 'active', 'paused', 'completed', 'archived'])
                ->default('draft');
            $table->enum('trigger_type', [
                'lead_created',
                'lead_updated',
                'lead_status_changed',
                'deal_created',
                'deal_stage_changed',
                'deal_won',
                'deal_lost',
                'customer_created',
                'tag_added',
                'form_submitted',
                'email_opened',
                'email_clicked',
                'link_clicked',
                'page_visited',
                'date_based',
                'manual',
                'api'
            ]);
            $table->json('trigger_conditions')->nullable();
            $table->json('entry_criteria')->nullable();
            $table->json('exit_criteria')->nullable();
            $table->json('workflow_data')->nullable();
            $table->unsignedInteger('enrollments_count')->default(0);
            $table->unsignedInteger('completions_count')->default(0);
            $table->unsignedInteger('active_count')->default(0);
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('paused_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();

            $table->index('status');
            $table->index('trigger_type');
        });

        Schema::create('marketing_workflow_steps', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('marketing_workflows')->cascadeOnDelete();
            $table->unsignedInteger('order')->default(0);
            $table->string('name')->nullable();
            $table->enum('type', [
                'send_email',
                'send_sms',
                'wait',
                'condition',
                'split',
                'update_field',
                'add_tag',
                'remove_tag',
                'assign_user',
                'create_task',
                'create_deal',
                'webhook',
                'internal_notification',
                'score_lead',
                'move_stage',
                'goal'
            ]);
            $table->json('config')->nullable();
            $table->json('conditions')->nullable();
            $table->string('yes_step_id')->nullable();
            $table->string('no_step_id')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['workflow_id', 'order']);
        });

        Schema::create('marketing_workflow_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('marketing_workflows')->cascadeOnDelete();
            $table->morphs('enrollable');
            $table->foreignId('current_step_id')->nullable()->constrained('marketing_workflow_steps')->nullOnDelete();
            $table->enum('status', ['active', 'waiting', 'completed', 'exited', 'failed', 'paused'])
                ->default('active');
            $table->timestamp('enrolled_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('exited_at')->nullable();
            $table->timestamp('next_action_at')->nullable();
            $table->string('exit_reason')->nullable();
            $table->json('data')->nullable();
            $table->timestamps();

            $table->index(['workflow_id', 'status']);
            $table->index('next_action_at');
        });

        Schema::create('marketing_workflow_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('marketing_workflow_enrollments')->cascadeOnDelete();
            $table->foreignId('step_id')->nullable()->constrained('marketing_workflow_steps')->nullOnDelete();
            $table->string('action');
            $table->enum('status', ['success', 'failed', 'skipped', 'pending'])->default('pending');
            $table->json('input_data')->nullable();
            $table->json('output_data')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('executed_at');
            $table->unsignedInteger('duration_ms')->nullable();
            $table->timestamps();

            $table->index(['enrollment_id', 'executed_at']);
        });

        Schema::create('automation_triggers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('event_type');
            $table->json('event_conditions')->nullable();
            $table->json('actions');
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('priority')->default(0);
            $table->unsignedInteger('execution_count')->default(0);
            $table->timestamp('last_triggered_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['event_type', 'is_active']);
            $table->index('priority');
        });

        Schema::create('automation_trigger_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trigger_id')->constrained('automation_triggers')->cascadeOnDelete();
            $table->morphs('triggerable');
            $table->json('event_data')->nullable();
            $table->json('actions_executed')->nullable();
            $table->enum('status', ['success', 'partial', 'failed'])->default('success');
            $table->text('error_message')->nullable();
            $table->timestamp('triggered_at');
            $table->unsignedInteger('duration_ms')->nullable();
            $table->timestamps();

            $table->index('triggered_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('automation_trigger_logs');
        Schema::dropIfExists('automation_triggers');
        Schema::dropIfExists('marketing_workflow_logs');
        Schema::dropIfExists('marketing_workflow_enrollments');
        Schema::dropIfExists('marketing_workflow_steps');
        Schema::dropIfExists('marketing_workflows');
    }
};
