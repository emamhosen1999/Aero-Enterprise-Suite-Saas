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
        // Create documents table for compliance
        Schema::create('compliance_documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('document_number')->unique();
            $table->string('version');
            $table->enum('status', ['draft', 'review', 'approved', 'published', 'archived', 'superseded'])->default('draft');
            $table->string('document_type');
            $table->date('effective_date')->nullable();
            $table->date('expiry_date')->nullable();
            $table->string('file_path')->nullable();
            $table->foreignId('owner_id')->constrained('users');
            $table->foreignId('department_id')->nullable()->constrained('departments');
            $table->text('keywords')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        // Create document revision history
        Schema::create('compliance_document_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('compliance_documents')->onDelete('cascade');
            $table->string('version');
            $table->text('change_summary');
            $table->string('file_path')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        // Create audits table
        Schema::create('compliance_audits', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('type', ['internal', 'external', 'supplier', 'surveillance', 'certification']);
            $table->enum('status', ['planned', 'in_progress', 'completed', 'cancelled']);
            $table->date('planned_date');
            $table->date('actual_date')->nullable();
            $table->foreignId('lead_auditor_id')->constrained('users');
            $table->foreignId('department_id')->nullable()->constrained('departments');
            $table->text('scope');
            $table->text('findings')->nullable();
            $table->string('reference_number')->unique();
            $table->timestamps();
            $table->softDeletes();
        });

        // Create audit findings
        Schema::create('compliance_audit_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audit_id')->constrained('compliance_audits')->onDelete('cascade');
            $table->enum('type', ['non_conformance', 'observation', 'opportunity_for_improvement']);
            $table->text('description');
            $table->text('root_cause')->nullable();
            $table->text('corrective_action')->nullable();
            $table->date('due_date')->nullable();
            $table->foreignId('assigned_to')->nullable()->constrained('users');
            $table->enum('status', ['open', 'in_progress', 'closed', 'verified'])->default('open');
            $table->timestamps();
        });

        // Create regulatory requirements table
        Schema::create('compliance_requirements', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description');
            $table->string('source'); // e.g., ISO 9001, FDA, GDPR
            $table->string('reference_number')->nullable();
            $table->boolean('applicable')->default(true);
            $table->enum('status', ['compliant', 'non_compliant', 'partially_compliant', 'in_progress', 'not_evaluated'])->default('not_evaluated');
            $table->text('compliance_evidence')->nullable();
            $table->foreignId('responsible_person_id')->nullable()->constrained('users');
            $table->date('last_evaluation_date')->nullable();
            $table->date('next_evaluation_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compliance_requirements');
        Schema::dropIfExists('compliance_audit_findings');
        Schema::dropIfExists('compliance_audits');
        Schema::dropIfExists('compliance_document_revisions');
        Schema::dropIfExists('compliance_documents');
    }
};
