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
        // Compliance Policies
        if (! Schema::hasTable('compliance_policies')) {
            Schema::create('compliance_policies', function (Blueprint $table) {
                $table->id();
                $table->string('policy_number')->unique();
                $table->string('title');
                $table->text('description');
                $table->text('content');
                $table->enum('policy_type', ['internal', 'regulatory', 'industry', 'customer', 'vendor'])->default('internal');
                $table->enum('category', ['hr', 'finance', 'operations', 'security', 'quality', 'environmental', 'legal', 'other'])->default('other');
                $table->string('department')->nullable();
                $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete(); // Policy owner
                $table->date('effective_date');
                $table->date('review_date')->nullable();
                $table->date('expiry_date')->nullable();
                $table->integer('version')->default(1);
                $table->enum('status', ['draft', 'under_review', 'approved', 'active', 'expired', 'archived'])->default('draft');
                $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
                $table->json('applicable_locations')->nullable(); // Which locations this applies to
                $table->json('applicable_roles')->nullable(); // Which roles this applies to
                $table->text('approval_notes')->nullable();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->text('tags')->nullable(); // Comma-separated tags for searchability
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Compliance Policy Acknowledgments
        if (! Schema::hasTable('compliance_policy_acknowledgments')) {
            Schema::create('compliance_policy_acknowledgments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('policy_id')->constrained('compliance_policies')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->timestamp('acknowledged_at');
                $table->string('acknowledgment_method')->default('digital'); // digital, paper, training
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['policy_id', 'user_id']);
            });
        }

        // Regulatory Requirements
        if (! Schema::hasTable('regulatory_requirements')) {
            Schema::create('regulatory_requirements', function (Blueprint $table) {
                $table->id();
                $table->string('requirement_number')->unique();
                $table->string('title');
                $table->text('description');
                $table->string('regulatory_body'); // FDA, OSHA, SEC, etc.
                $table->string('regulation_reference'); // CFR 21, ISO 9001, etc.
                $table->enum('requirement_type', ['mandatory', 'recommended', 'best_practice'])->default('mandatory');
                $table->enum('industry', ['healthcare', 'finance', 'manufacturing', 'technology', 'food', 'automotive', 'general'])->default('general');
                $table->json('applicable_locations')->nullable();
                $table->date('effective_date');
                $table->date('compliance_deadline')->nullable();
                $table->enum('status', ['pending', 'in_progress', 'compliant', 'non_compliant', 'not_applicable'])->default('pending');
                $table->enum('priority', ['low', 'medium', 'high', 'critical'])->default('medium');
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->decimal('compliance_percentage', 5, 2)->default(0);
                $table->text('implementation_notes')->nullable();
                $table->json('evidence_documents')->nullable(); // File paths or document IDs
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Risk Assessments
        if (! Schema::hasTable('risk_assessments')) {
            Schema::create('risk_assessments', function (Blueprint $table) {
                $table->id();
                $table->string('assessment_number')->unique();
                $table->string('title');
                $table->text('description');
                $table->enum('risk_category', ['operational', 'financial', 'legal', 'regulatory', 'reputational', 'strategic', 'technology', 'environmental'])->default('operational');
                $table->enum('risk_type', ['compliance', 'security', 'safety', 'quality', 'financial', 'operational', 'strategic'])->default('compliance');
                $table->text('risk_description');
                $table->text('impact_description');
                $table->integer('probability_score')->comment('1-5 scale'); // 1=Very Low, 5=Very High
                $table->integer('impact_score')->comment('1-5 scale'); // 1=Very Low, 5=Very High
                $table->integer('risk_score')->comment('Calculated: probability * impact');
                $table->enum('risk_level', ['very_low', 'low', 'medium', 'high', 'very_high'])->default('medium');
                $table->text('current_controls')->nullable();
                $table->text('mitigation_plan')->nullable();
                $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete(); // Risk owner
                $table->foreignId('assessor_id')->constrained('users')->cascadeOnDelete(); // Who performed assessment
                $table->date('assessment_date');
                $table->date('review_date')->nullable();
                $table->enum('status', ['draft', 'under_review', 'approved', 'active', 'mitigated', 'closed'])->default('draft');
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Risk Mitigation Actions
        if (! Schema::hasTable('risk_mitigation_actions')) {
            Schema::create('risk_mitigation_actions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('risk_assessment_id')->constrained()->cascadeOnDelete();
                $table->string('action_title');
                $table->text('action_description');
                $table->enum('action_type', ['preventive', 'detective', 'corrective', 'directive'])->default('preventive');
                $table->foreignId('assigned_to')->constrained('users')->cascadeOnDelete();
                $table->date('due_date');
                $table->date('completed_date')->nullable();
                $table->enum('status', ['planned', 'in_progress', 'completed', 'cancelled', 'overdue'])->default('planned');
                $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
                $table->text('implementation_notes')->nullable();
                $table->decimal('cost_estimate', 15, 2)->nullable();
                $table->decimal('actual_cost', 15, 2)->nullable();
                $table->timestamps();
            });
        }

        // Compliance Audits
        if (! Schema::hasTable('compliance_audits')) {
            Schema::create('compliance_audits', function (Blueprint $table) {
                $table->id();
                $table->string('audit_number')->unique();
                $table->string('title');
                $table->text('description');
                $table->enum('audit_type', ['internal', 'external', 'regulatory', 'customer', 'vendor', 'certification'])->default('internal');
                $table->enum('scope', ['department', 'process', 'system', 'organization', 'location', 'product'])->default('process');
                $table->string('auditing_body')->nullable(); // Internal team, external firm, regulatory agency
                $table->foreignId('lead_auditor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->json('audit_team')->nullable(); // Array of user IDs
                $table->json('auditees')->nullable(); // Array of user IDs being audited
                $table->date('planned_start_date');
                $table->date('planned_end_date');
                $table->date('actual_start_date')->nullable();
                $table->date('actual_end_date')->nullable();
                $table->enum('status', ['planned', 'in_progress', 'fieldwork_complete', 'report_draft', 'report_final', 'closed'])->default('planned');
                $table->text('audit_objectives')->nullable();
                $table->text('audit_criteria')->nullable(); // Standards, regulations, policies being audited against
                $table->json('areas_covered')->nullable(); // Departments, processes, systems covered
                $table->integer('total_findings')->default(0);
                $table->integer('critical_findings')->default(0);
                $table->integer('major_findings')->default(0);
                $table->integer('minor_findings')->default(0);
                $table->decimal('overall_score', 5, 2)->nullable(); // Overall compliance score
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Audit Findings
        if (! Schema::hasTable('audit_findings')) {
            Schema::create('audit_findings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('audit_id')->constrained('compliance_audits')->cascadeOnDelete();
                $table->string('finding_number');
                $table->string('title');
                $table->text('description');
                $table->enum('severity', ['critical', 'major', 'minor', 'observation'])->default('minor');
                $table->enum('category', ['non_conformance', 'opportunity_for_improvement', 'best_practice', 'observation'])->default('non_conformance');
                $table->string('area_affected')->nullable(); // Department, process, system affected
                $table->text('requirement_reference')->nullable(); // Which requirement/standard was violated
                $table->text('evidence')->nullable();
                $table->text('root_cause')->nullable();
                $table->text('immediate_action')->nullable();
                $table->text('corrective_action_required')->nullable();
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->date('due_date')->nullable();
                $table->enum('status', ['open', 'in_progress', 'completed', 'verified', 'closed'])->default('open');
                $table->text('implementation_notes')->nullable();
                $table->date('completed_date')->nullable();
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete();
                $table->date('verified_date')->nullable();
                $table->timestamps();
            });
        }

        // Compliance Training Records
        if (! Schema::hasTable('compliance_training_records')) {
            Schema::create('compliance_training_records', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('training_title');
                $table->text('training_description')->nullable();
                $table->enum('training_type', ['policy', 'regulatory', 'safety', 'security', 'quality', 'ethics', 'other'])->default('policy');
                $table->string('training_provider')->nullable();
                $table->date('training_date');
                $table->date('expiry_date')->nullable();
                $table->integer('duration_hours')->nullable();
                $table->enum('completion_status', ['completed', 'in_progress', 'not_started', 'expired'])->default('not_started');
                $table->decimal('score', 5, 2)->nullable(); // Test score if applicable
                $table->decimal('passing_score', 5, 2)->nullable();
                $table->string('certificate_number')->nullable();
                $table->string('certificate_file_path')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });
        }

        // Document Control
        if (! Schema::hasTable('controlled_documents')) {
            Schema::create('controlled_documents', function (Blueprint $table) {
                $table->id();
                $table->string('document_number')->unique();
                $table->string('title');
                $table->text('description')->nullable();
                $table->enum('document_type', ['policy', 'procedure', 'work_instruction', 'form', 'record', 'manual', 'specification', 'other'])->default('procedure');
                $table->string('department')->nullable();
                $table->foreignId('owner_id')->constrained('users')->cascadeOnDelete(); // Document owner
                $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('version', 10);
                $table->date('effective_date');
                $table->date('review_date')->nullable();
                $table->date('next_review_date')->nullable();
                $table->enum('status', ['draft', 'under_review', 'approved', 'active', 'superseded', 'obsolete'])->default('draft');
                $table->string('file_path')->nullable();
                $table->string('file_name')->nullable();
                $table->integer('file_size')->nullable();
                $table->string('mime_type')->nullable();
                $table->text('revision_notes')->nullable();
                $table->json('distribution_list')->nullable(); // Who should receive this document
                $table->boolean('controlled_copy')->default(true);
                $table->text('retention_period')->nullable(); // How long to keep this document
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Document Revisions
        if (! Schema::hasTable('document_revisions')) {
            Schema::create('document_revisions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('controlled_document_id')->constrained()->cascadeOnDelete();
                $table->string('version', 10);
                $table->text('revision_description');
                $table->foreignId('revised_by')->constrained('users')->cascadeOnDelete();
                $table->date('revision_date');
                $table->string('file_path')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_revisions');
        Schema::dropIfExists('controlled_documents');
        Schema::dropIfExists('compliance_training_records');
        Schema::dropIfExists('audit_findings');
        Schema::dropIfExists('compliance_audits');
        Schema::dropIfExists('risk_mitigation_actions');
        Schema::dropIfExists('risk_assessments');
        Schema::dropIfExists('regulatory_requirements');
        Schema::dropIfExists('compliance_policy_acknowledgments');
        Schema::dropIfExists('compliance_policies');
    }
};
