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
        // Jurisdictions / Work Locations table
        if (! Schema::hasTable('jurisdictions')) {
            Schema::create('jurisdictions', function (Blueprint $table) {
                $table->id();
                $table->string('location');
                $table->string('start_chainage')->nullable();
                $table->string('end_chainage')->nullable();
                $table->foreignId('incharge')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        // Compliance Policies table
        if (! Schema::hasTable('compliance_policies')) {
            Schema::create('compliance_policies', function (Blueprint $table) {
                $table->id();
                $table->string('policy_id')->unique();
                $table->string('title');
                $table->text('description')->nullable();
                $table->longText('content')->nullable();
                $table->string('type')->nullable();
                $table->string('category')->nullable();
                $table->string('department')->nullable();
                $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
                $table->date('effective_date')->nullable();
                $table->integer('review_frequency_months')->default(12);
                $table->date('next_review_date')->nullable();
                $table->date('expiry_date')->nullable();
                $table->string('version')->default('1.0');
                $table->string('status')->default('draft');
                $table->string('priority')->default('medium');
                $table->json('applicable_locations')->nullable();
                $table->json('applicable_roles')->nullable();
                $table->boolean('requires_acknowledgment')->default(false);
                $table->text('approval_notes')->nullable();
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('approved_at')->nullable();
                $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('published_at')->nullable();
                $table->foreignId('archived_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('archived_at')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->json('tags')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Compliance Policy Acknowledgments table
        if (! Schema::hasTable('compliance_policy_acknowledgments')) {
            Schema::create('compliance_policy_acknowledgments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('policy_id')->constrained('compliance_policies')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->timestamp('acknowledged_at');
                $table->string('acknowledgment_method')->default('electronic');
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['policy_id', 'user_id']);
            });
        }

        // Regulatory Requirements table
        if (! Schema::hasTable('regulatory_requirements')) {
            Schema::create('regulatory_requirements', function (Blueprint $table) {
                $table->id();
                $table->string('requirement_number')->unique();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('regulatory_body')->nullable();
                $table->string('regulation_reference')->nullable();
                $table->string('requirement_type')->nullable();
                $table->string('industry')->nullable();
                $table->json('applicable_locations')->nullable();
                $table->date('effective_date')->nullable();
                $table->date('compliance_deadline')->nullable();
                $table->string('status')->default('pending');
                $table->string('priority')->default('medium');
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->decimal('compliance_percentage', 5, 2)->default(0);
                $table->text('implementation_notes')->nullable();
                $table->json('evidence_documents')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Risk Assessments table
        if (! Schema::hasTable('risk_assessments')) {
            Schema::create('risk_assessments', function (Blueprint $table) {
                $table->id();
                $table->string('risk_id')->unique();
                $table->string('name');
                $table->text('description')->nullable();
                $table->string('category')->nullable();
                $table->integer('likelihood')->default(1);
                $table->integer('impact')->default(1);
                $table->decimal('risk_score', 5, 2)->nullable();
                $table->string('risk_level')->default('low');
                $table->string('status')->default('pending');
                $table->date('assessment_date')->nullable();
                $table->date('next_review_date')->nullable();
                $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        // Risk Mitigation Actions table
        if (! Schema::hasTable('risk_mitigation_actions')) {
            Schema::create('risk_mitigation_actions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('risk_assessment_id')->constrained('risk_assessments')->cascadeOnDelete();
                $table->string('action_id')->unique();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('priority')->default('medium');
                $table->string('status')->default('planned');
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->date('due_date')->nullable();
                $table->date('completion_date')->nullable();
                $table->integer('progress_percentage')->default(0);
                $table->decimal('cost_estimate', 15, 2)->nullable();
                $table->decimal('actual_cost', 15, 2)->nullable();
                $table->decimal('effectiveness_rating', 3, 2)->nullable();
                $table->text('notes')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        // Compliance Audits table
        if (! Schema::hasTable('compliance_audits')) {
            Schema::create('compliance_audits', function (Blueprint $table) {
                $table->id();
                $table->string('reference_number')->unique()->nullable();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('type')->nullable();
                $table->string('status')->default('planned');
                $table->date('planned_date')->nullable();
                $table->date('actual_date')->nullable();
                $table->foreignId('lead_auditor_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
                $table->text('scope')->nullable();
                $table->text('findings')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        }

        // Audit Findings table
        if (! Schema::hasTable('audit_findings')) {
            Schema::create('audit_findings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('compliance_audit_id')->constrained('compliance_audits')->cascadeOnDelete();
                $table->string('finding_id')->unique();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('severity')->default('minor');
                $table->string('category')->nullable();
                $table->string('status')->default('open');
                $table->string('area_affected')->nullable();
                $table->json('evidence')->nullable();
                $table->text('root_cause')->nullable();
                $table->text('immediate_action')->nullable();
                $table->text('corrective_action')->nullable();
                $table->text('preventive_action')->nullable();
                $table->foreignId('responsible_person_id')->nullable()->constrained('users')->nullOnDelete();
                $table->date('due_date')->nullable();
                $table->date('completion_date')->nullable();
                $table->date('verification_date')->nullable();
                $table->foreignId('verifier_id')->nullable()->constrained('users')->nullOnDelete();
                $table->text('closure_notes')->nullable();
                $table->string('recurrence_risk')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }

        // Compliance Audit Findings (simpler version for quick entries)
        if (! Schema::hasTable('compliance_audit_findings')) {
            Schema::create('compliance_audit_findings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('audit_id')->constrained('compliance_audits')->cascadeOnDelete();
                $table->string('type')->nullable();
                $table->text('description');
                $table->text('root_cause')->nullable();
                $table->text('corrective_action')->nullable();
                $table->date('due_date')->nullable();
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->string('status')->default('open');
                $table->timestamps();
            });
        }

        // Controlled Documents table
        if (! Schema::hasTable('controlled_documents')) {
            Schema::create('controlled_documents', function (Blueprint $table) {
                $table->id();
                $table->string('document_id')->unique();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('category')->nullable();
                $table->string('type')->nullable();
                $table->string('status')->default('draft');
                $table->string('current_version')->default('1.0');
                $table->foreignId('document_owner_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('reviewer_id')->nullable()->constrained('users')->nullOnDelete();
                $table->date('creation_date')->nullable();
                $table->date('effective_date')->nullable();
                $table->date('next_review_date')->nullable();
                $table->string('retention_period')->nullable();
                $table->string('confidentiality_level')->default('internal');
                $table->string('access_level')->default('standard');
                $table->json('distribution_list')->nullable();
                $table->json('tags')->nullable();
                $table->string('file_path')->nullable();
                $table->bigInteger('file_size')->nullable();
                $table->string('file_type')->nullable();
                $table->string('checksum')->nullable();
                $table->boolean('is_template')->default(false);
                $table->string('template_category')->nullable();
                $table->string('workflow_stage')->nullable();
                $table->boolean('approval_required')->default(true);
                $table->json('metadata')->nullable();
                $table->timestamps();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('controlled_documents');
        Schema::dropIfExists('compliance_audit_findings');
        Schema::dropIfExists('audit_findings');
        Schema::dropIfExists('compliance_audits');
        Schema::dropIfExists('risk_mitigation_actions');
        Schema::dropIfExists('risk_assessments');
        Schema::dropIfExists('regulatory_requirements');
        Schema::dropIfExists('compliance_policy_acknowledgments');
        Schema::dropIfExists('compliance_policies');
        Schema::dropIfExists('jurisdictions');
    }
};
