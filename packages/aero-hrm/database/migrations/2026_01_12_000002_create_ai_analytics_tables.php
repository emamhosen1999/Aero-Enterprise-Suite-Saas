<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * AI-Driven HRM Analytics Tables
     *
     * These tables support novel, next-generation HR analytics capabilities:
     * 1. Attrition Risk Prediction
     * 2. Behavioral Anomaly Detection
     * 3. Internal Talent Mobility Recommendations
     * 4. Burnout Risk Modeling
     * 5. Engagement Sentiment Analytics
     */
    public function up(): void
    {
        // Employee Risk Scores - Central risk tracking for each employee
        if (! Schema::hasTable('employee_risk_scores')) {
            Schema::create('employee_risk_scores', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

                // Attrition Risk (0-100 scale)
                $table->decimal('attrition_risk_score', 5, 2)->default(0);
                $table->json('attrition_risk_factors')->nullable(); // Contributing factors
                $table->timestamp('attrition_calculated_at')->nullable();

                // Burnout Risk (0-100 scale)
                $table->decimal('burnout_risk_score', 5, 2)->default(0);
                $table->json('burnout_risk_factors')->nullable();
                $table->timestamp('burnout_calculated_at')->nullable();

                // Engagement Score (0-100 scale)
                $table->decimal('engagement_score', 5, 2)->default(50);
                $table->json('engagement_factors')->nullable();
                $table->timestamp('engagement_calculated_at')->nullable();

                // Flight Risk Classification
                $table->enum('flight_risk_level', ['low', 'medium', 'high', 'critical'])->default('low');
                $table->text('recommended_actions')->nullable();

                // Performance Trend
                $table->enum('performance_trend', ['declining', 'stable', 'improving'])->default('stable');

                $table->timestamps();

                $table->unique('employee_id');
                $table->index(['attrition_risk_score', 'flight_risk_level'], 'ers_attrition_risk_idx');
                $table->index(['burnout_risk_score'], 'ers_burnout_risk_idx');
            });
        }

        // Attrition Prediction History - Track predictions over time
        if (! Schema::hasTable('attrition_predictions')) {
            Schema::create('attrition_predictions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

                $table->decimal('predicted_probability', 5, 4); // 0.0000 to 1.0000
                $table->integer('prediction_horizon_days')->default(90); // Prediction window
                $table->json('feature_importance')->nullable(); // Which factors contributed most
                $table->json('model_inputs')->nullable(); // Input data used for prediction
                $table->string('model_version')->default('v1.0');

                // Outcome tracking
                $table->boolean('was_correct')->nullable(); // Did the employee leave?
                $table->date('actual_departure_date')->nullable();

                $table->timestamp('predicted_at');
                $table->timestamps();

                $table->index(['employee_id', 'predicted_at']);
                $table->index('predicted_probability');
            });
        }

        // Behavioral Anomalies - Detect unusual patterns
        if (! Schema::hasTable('behavioral_anomalies')) {
            Schema::create('behavioral_anomalies', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

                $table->enum('anomaly_type', [
                    'attendance_pattern',      // Unusual check-in/out times
                    'absence_frequency',       // Sudden increase in absences
                    'performance_drop',        // Sudden performance decline
                    'communication_change',    // Reduced collaboration
                    'overtime_spike',          // Unusual overtime patterns
                    'productivity_variance',   // Inconsistent productivity
                    'leave_pattern',          // Unusual leave patterns
                    'engagement_drop',        // Reduced engagement metrics
                ]);

                $table->decimal('anomaly_score', 5, 2); // Severity (0-100)
                $table->decimal('baseline_value', 10, 2)->nullable(); // Expected value
                $table->decimal('actual_value', 10, 2)->nullable(); // Observed value
                $table->decimal('deviation_percentage', 8, 2)->nullable(); // % deviation

                $table->json('context_data')->nullable(); // Additional context
                $table->text('description')->nullable();

                $table->enum('status', ['detected', 'acknowledged', 'investigating', 'resolved', 'false_positive'])->default('detected');
                $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('review_notes')->nullable();
                $table->timestamp('reviewed_at')->nullable();

                $table->date('anomaly_date');
                $table->timestamps();

                $table->index(['employee_id', 'anomaly_type', 'status'], 'ba_emp_type_status_idx');
                $table->index(['anomaly_date', 'anomaly_score'], 'ba_date_score_idx');
            });
        }

        // Talent Mobility Recommendations
        if (! Schema::hasTable('talent_mobility_recommendations')) {
            Schema::create('talent_mobility_recommendations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

                // Recommendation type
                $table->enum('recommendation_type', [
                    'promotion',           // Ready for promotion
                    'lateral_move',        // Would benefit from role change
                    'skill_development',   // Needs upskilling
                    'mentorship',          // Should mentor or be mentored
                    'project_assignment',  // Good fit for specific project
                    'leadership_track',    // High potential for leadership
                    'retention_action',    // Needs retention intervention
                ]);

                // Target position/role if applicable
                $table->foreignId('target_department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->foreignId('target_designation_id')->nullable()->constrained('designations')->nullOnDelete();
                $table->string('target_role_name')->nullable();

                // Matching score
                $table->decimal('match_score', 5, 2); // 0-100 how good the fit is
                $table->json('matching_skills')->nullable(); // Skills that match
                $table->json('skill_gaps')->nullable(); // Skills needed
                $table->json('development_path')->nullable(); // Steps to prepare

                $table->text('rationale')->nullable(); // Why this recommendation
                $table->integer('estimated_readiness_months')->nullable(); // Time to be ready

                $table->enum('status', ['active', 'accepted', 'declined', 'expired', 'completed'])->default('active');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('actioned_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('actioned_at')->nullable();
                $table->text('action_notes')->nullable();

                $table->date('valid_until')->nullable();
                $table->timestamps();

                $table->index(['employee_id', 'recommendation_type', 'status'], 'tmr_emp_type_status_idx');
                $table->index(['match_score', 'status'], 'tmr_score_status_idx');
            });
        }

        // Workload Metrics - Track employee workload
        if (! Schema::hasTable('employee_workload_metrics')) {
            Schema::create('employee_workload_metrics', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

                $table->date('metric_date');
                $table->enum('period_type', ['daily', 'weekly', 'monthly'])->default('daily');

                // Time metrics
                $table->decimal('scheduled_hours', 6, 2)->default(0);
                $table->decimal('actual_hours_worked', 6, 2)->default(0);
                $table->decimal('overtime_hours', 6, 2)->default(0);
                $table->decimal('break_time_hours', 6, 2)->default(0);

                // Task/project metrics
                $table->integer('tasks_assigned')->default(0);
                $table->integer('tasks_completed')->default(0);
                $table->integer('tasks_overdue')->default(0);
                $table->integer('active_projects')->default(0);

                // Meeting metrics
                $table->decimal('meeting_hours', 6, 2)->default(0);
                $table->integer('meeting_count')->default(0);

                // Derived metrics
                $table->decimal('utilization_rate', 5, 2)->default(0); // Actual/Scheduled %
                $table->decimal('overtime_ratio', 5, 2)->default(0); // OT/Scheduled %
                $table->decimal('task_completion_rate', 5, 2)->default(0);

                // Burnout indicators
                $table->boolean('consecutive_overtime_flag')->default(false);
                $table->integer('days_without_leave')->default(0);
                $table->boolean('weekend_work_flag')->default(false);

                $table->timestamps();

                $table->unique(['employee_id', 'metric_date', 'period_type'], 'ewm_emp_date_period_unique');
                $table->index(['metric_date', 'utilization_rate'], 'ewm_date_utilization_idx');
            });
        }

        // Sentiment Analysis Records
        if (! Schema::hasTable('employee_sentiment_records')) {
            Schema::create('employee_sentiment_records', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');

                $table->enum('source_type', [
                    'survey_response',     // From engagement surveys
                    'feedback_submission', // From feedback forms
                    'pulse_check',         // Quick pulse surveys
                    'exit_interview',      // Exit interview data
                    'one_on_one',          // From 1:1 meeting notes
                    'performance_review',  // From review comments
                    'self_assessment',     // Employee self-reflection
                    'peer_feedback',       // 360 feedback
                ]);

                $table->string('source_reference')->nullable(); // Link to source

                // Sentiment scores (-1 to +1)
                $table->decimal('overall_sentiment', 4, 3)->default(0); // -1.000 to +1.000
                $table->decimal('job_satisfaction', 4, 3)->nullable();
                $table->decimal('manager_satisfaction', 4, 3)->nullable();
                $table->decimal('team_satisfaction', 4, 3)->nullable();
                $table->decimal('workload_satisfaction', 4, 3)->nullable();
                $table->decimal('growth_satisfaction', 4, 3)->nullable();
                $table->decimal('compensation_satisfaction', 4, 3)->nullable();

                // Emotion detection
                $table->json('detected_emotions')->nullable(); // joy, frustration, anxiety, etc.
                $table->json('key_themes')->nullable(); // Extracted topics
                $table->json('positive_mentions')->nullable();
                $table->json('negative_mentions')->nullable();

                // Raw data (anonymized/processed)
                $table->text('processed_text')->nullable();
                $table->integer('word_count')->default(0);

                $table->boolean('requires_followup')->default(false);
                $table->foreignId('followed_up_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('followed_up_at')->nullable();

                $table->date('recorded_date');
                $table->timestamps();

                $table->index(['employee_id', 'source_type', 'recorded_date'], 'esr_emp_source_date_idx');
                $table->index(['overall_sentiment', 'requires_followup'], 'esr_sentiment_followup_idx');
            });
        }

        // Engagement Surveys
        if (! Schema::hasTable('engagement_surveys')) {
            Schema::create('engagement_surveys', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->enum('survey_type', ['annual', 'quarterly', 'pulse', 'onboarding', 'exit', 'custom'])->default('pulse');
                $table->json('questions'); // Survey questions structure

                $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete(); // If department-specific

                $table->date('start_date');
                $table->date('end_date');
                $table->boolean('is_anonymous')->default(true);
                $table->boolean('is_mandatory')->default(false);
                $table->enum('status', ['draft', 'active', 'completed', 'cancelled'])->default('draft');

                $table->integer('target_respondents')->default(0);
                $table->integer('actual_respondents')->default(0);
                $table->decimal('response_rate', 5, 2)->default(0);

                $table->json('aggregate_results')->nullable(); // Computed results
                $table->timestamps();

                $table->index(['status', 'start_date', 'end_date']);
            });
        }

        // Survey Responses
        if (! Schema::hasTable('engagement_survey_responses')) {
            Schema::create('engagement_survey_responses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('survey_id')->constrained('engagement_surveys')->onDelete('cascade');
                $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete(); // Null if anonymous
                $table->string('anonymous_token')->nullable(); // For anonymous tracking

                $table->json('answers'); // Question responses
                $table->decimal('overall_score', 5, 2)->nullable(); // Calculated from answers
                $table->integer('completion_time_seconds')->nullable();

                $table->timestamps();

                $table->index(['survey_id', 'employee_id']);
            });
        }

        // AI Model Configurations
        if (! Schema::hasTable('ai_model_configurations')) {
            Schema::create('ai_model_configurations', function (Blueprint $table) {
                $table->id();
                $table->string('model_name'); // attrition_predictor, anomaly_detector, etc.
                $table->string('model_version')->default('v1.0');
                $table->json('configuration'); // Model parameters
                $table->json('feature_weights')->nullable(); // Feature importance
                $table->json('thresholds')->nullable(); // Alert thresholds

                $table->boolean('is_active')->default(true);
                $table->decimal('accuracy_score', 5, 4)->nullable(); // Model accuracy
                $table->integer('training_samples')->default(0);
                $table->timestamp('last_trained_at')->nullable();

                $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
                $table->timestamps();

                $table->unique(['model_name', 'model_version']);
            });
        }

        // AI Insights/Alerts
        if (! Schema::hasTable('ai_insights')) {
            Schema::create('ai_insights', function (Blueprint $table) {
                $table->id();
                $table->enum('insight_type', [
                    'attrition_alert',
                    'burnout_warning',
                    'anomaly_detected',
                    'mobility_opportunity',
                    'engagement_trend',
                    'team_health',
                    'department_risk',
                    'org_wide_pattern',
                ]);

                $table->enum('severity', ['info', 'low', 'medium', 'high', 'critical'])->default('info');
                $table->enum('scope', ['employee', 'team', 'department', 'organization'])->default('employee');

                // Scope references
                $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->foreignId('manager_id')->nullable()->constrained('employees')->nullOnDelete();

                $table->string('title');
                $table->text('description');
                $table->json('data_points')->nullable(); // Supporting data
                $table->json('recommended_actions')->nullable();
                $table->decimal('confidence_score', 5, 2)->default(0); // Model confidence

                $table->enum('status', ['new', 'viewed', 'acknowledged', 'actioned', 'dismissed'])->default('new');
                $table->foreignId('actioned_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('actioned_at')->nullable();
                $table->text('action_taken')->nullable();

                $table->date('insight_date');
                $table->date('valid_until')->nullable();
                $table->timestamps();

                $table->index(['insight_type', 'severity', 'status']);
                $table->index(['employee_id', 'insight_date']);
                $table->index(['department_id', 'insight_date']);
            });
        }

        // Approval Workflow Templates
        if (! Schema::hasTable('approval_workflow_templates')) {
            Schema::create('approval_workflow_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->unique(); // leave_approval, expense_approval, etc.
                $table->text('description')->nullable();

                $table->enum('entity_type', [
                    'leave_request',
                    'expense_claim',
                    'travel_request',
                    'purchase_requisition',
                    'job_offer',
                    'salary_revision',
                    'promotion',
                    'transfer',
                    'overtime_request',
                    'custom',
                ]);

                $table->json('steps'); // Workflow steps configuration
                $table->json('escalation_rules')->nullable();
                $table->json('notification_settings')->nullable();

                $table->boolean('is_active')->default(true);
                $table->boolean('allow_parallel_approval')->default(false);
                $table->integer('auto_approve_after_days')->nullable();

                $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
                $table->timestamps();

                $table->index(['entity_type', 'is_active']);
            });
        }

        // Approval Workflow Instances
        if (! Schema::hasTable('approval_workflow_instances')) {
            Schema::create('approval_workflow_instances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('template_id')->constrained('approval_workflow_templates')->onDelete('cascade');

                $table->morphs('approvable'); // Polymorphic relation to the entity being approved
                $table->foreignId('requester_id')->constrained('users')->onDelete('cascade');

                $table->integer('current_step')->default(1);
                $table->enum('status', ['pending', 'in_progress', 'approved', 'rejected', 'cancelled', 'escalated'])->default('pending');

                $table->json('step_history')->nullable(); // History of all step actions
                $table->text('final_remarks')->nullable();

                $table->timestamp('submitted_at');
                $table->timestamp('completed_at')->nullable();
                $table->integer('total_duration_hours')->nullable();

                $table->timestamps();

                $table->index(['status', 'current_step'], 'awi_status_step_idx');
                $table->index(['requester_id', 'status'], 'awi_requester_status_idx');
            });
        }

        // Approval Actions (individual approvals within a workflow)
        if (! Schema::hasTable('approval_actions')) {
            Schema::create('approval_actions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('workflow_instance_id')->constrained('approval_workflow_instances')->onDelete('cascade');

                $table->integer('step_number');
                $table->string('step_name');

                $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('delegate_id')->nullable()->constrained('users')->nullOnDelete(); // If delegated

                $table->enum('action', ['pending', 'approved', 'rejected', 'returned', 'escalated', 'skipped'])->default('pending');
                $table->text('remarks')->nullable();
                $table->json('conditions_met')->nullable(); // Auto-approval conditions

                $table->timestamp('due_at')->nullable();
                $table->timestamp('actioned_at')->nullable();
                $table->boolean('is_overdue')->default(false);

                $table->timestamps();

                $table->index(['workflow_instance_id', 'step_number']);
                $table->index(['approver_id', 'action']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_actions');
        Schema::dropIfExists('approval_workflow_instances');
        Schema::dropIfExists('approval_workflow_templates');
        Schema::dropIfExists('ai_insights');
        Schema::dropIfExists('ai_model_configurations');
        Schema::dropIfExists('engagement_survey_responses');
        Schema::dropIfExists('engagement_surveys');
        Schema::dropIfExists('employee_sentiment_records');
        Schema::dropIfExists('employee_workload_metrics');
        Schema::dropIfExists('talent_mobility_recommendations');
        Schema::dropIfExists('behavioral_anomalies');
        Schema::dropIfExists('attrition_predictions');
        Schema::dropIfExists('employee_risk_scores');
    }
};
