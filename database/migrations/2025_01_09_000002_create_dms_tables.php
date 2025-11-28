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
        // Document Categories
        Schema::create('dms_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->string('color', 7)->default('#3B82F6');
            $table->string('icon')->nullable();
            $table->json('allowed_file_types')->nullable(); // ['pdf', 'doc', 'docx', 'xls', 'xlsx']
            $table->integer('max_file_size')->default(10240); // in KB
            $table->integer('retention_period')->nullable(); // in days
            $table->boolean('requires_approval')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);
            $table->foreignId('parent_id')->nullable()->constrained('dms_categories')->onDelete('set null');
            $table->timestamps();
        });

        // Document Storage
        Schema::create('dms_documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('document_number')->unique();
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained('dms_categories');
            $table->string('file_name');
            $table->string('original_file_name');
            $table->string('file_path');
            $table->string('file_type');
            $table->integer('file_size'); // in bytes
            $table->string('mime_type');
            $table->string('checksum'); // for file integrity

            // Metadata
            $table->json('tags')->nullable();
            $table->json('keywords')->nullable();
            $table->json('custom_fields')->nullable();

            // Version Control
            $table->string('version', 20)->default('1.0');
            $table->foreignId('parent_document_id')->nullable()->constrained('dms_documents')->onDelete('cascade');
            $table->boolean('is_latest_version')->default(true);

            // Status and Workflow
            $table->enum('status', ['draft', 'pending_review', 'approved', 'published', 'archived', 'expired'])->default('draft');
            $table->foreignId('created_by')->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();

            // Access Control
            $table->enum('visibility', ['public', 'internal', 'restricted', 'confidential'])->default('internal');
            $table->json('access_permissions')->nullable(); // roles/users who can access

            // Indexing for Search
            $table->text('search_content')->nullable(); // OCR extracted text
            $table->boolean('is_searchable')->default(true);

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index(['category_id', 'status']);
            $table->index(['created_by', 'status']);
            $table->index(['document_number']);
            $table->fullText(['title', 'description', 'search_content']);
        });

        // Document Versions/Revisions
        Schema::create('dms_document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->onDelete('cascade');
            $table->string('version', 20);
            $table->text('change_summary')->nullable();
            $table->string('file_path');
            $table->integer('file_size');
            $table->string('checksum');
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->unique(['document_id', 'version']);
        });

        // Document Approval Workflow
        Schema::create('dms_approval_workflows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('steps'); // [{step: 1, approver_role: 'manager', required: true}, ...]
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        // Document Approval Process
        Schema::create('dms_document_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->onDelete('cascade');
            $table->foreignId('workflow_id')->constrained('dms_approval_workflows');
            $table->integer('step_number');
            $table->foreignId('approver_id')->constrained('users');
            $table->enum('status', ['pending', 'approved', 'rejected', 'skipped'])->default('pending');
            $table->text('comments')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['document_id', 'step_number']);
        });

        // Document Access Log
        Schema::create('dms_document_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->enum('action', ['view', 'download', 'edit', 'delete', 'share']);
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->json('metadata')->nullable(); // additional context
            $table->timestamps();

            $table->index(['document_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });

        // Document Sharing/Collaboration
        Schema::create('dms_document_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->onDelete('cascade');
            $table->foreignId('shared_by')->constrained('users');
            $table->foreignId('shared_with')->nullable()->constrained('users');
            $table->string('share_token')->unique()->nullable(); // for public links
            $table->enum('permission', ['view', 'comment', 'edit'])->default('view');
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->integer('download_count')->default(0);
            $table->integer('view_count')->default(0);
            $table->timestamps();
        });

        // Document Comments/Annotations
        Schema::create('dms_document_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users');
            $table->text('content');
            $table->json('position')->nullable(); // for PDF annotations {page: 1, x: 100, y: 200}
            $table->enum('type', ['general', 'annotation', 'review', 'approval'])->default('general');
            $table->foreignId('parent_comment_id')->nullable()->constrained('dms_document_comments')->onDelete('cascade');
            $table->boolean('is_resolved')->default(false);
            $table->timestamps();
            $table->softDeletes();
        });

        // Document Templates
        Schema::create('dms_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained('dms_categories');
            $table->string('file_path');
            $table->json('placeholders')->nullable(); // {name: 'Company Name', type: 'text', required: true}
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
        });

        // Document Folders/Collections
        Schema::create('dms_folders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color', 7)->default('#6B7280');
            $table->foreignId('parent_id')->nullable()->constrained('dms_folders')->onDelete('cascade');
            $table->foreignId('created_by')->constrained('users');
            $table->json('access_permissions')->nullable();
            $table->boolean('is_shared')->default(false);
            $table->timestamps();
        });

        // Document-Folder Relationships
        Schema::create('dms_document_folders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->onDelete('cascade');
            $table->foreignId('folder_id')->constrained('dms_folders')->onDelete('cascade');
            $table->foreignId('added_by')->constrained('users');
            $table->timestamps();

            $table->unique(['document_id', 'folder_id']);
        });

        // Digital Signatures
        Schema::create('dms_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->onDelete('cascade');
            $table->foreignId('signer_id')->constrained('users');
            $table->text('signature_data'); // base64 encoded signature image or cryptographic signature
            $table->enum('signature_type', ['digital', 'electronic', 'wet'])->default('electronic');
            $table->string('certificate_fingerprint')->nullable(); // for digital certificates
            $table->json('metadata')->nullable(); // timestamp, IP, etc.
            $table->timestamp('signed_at');
            $table->boolean('is_valid')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dms_signatures');
        Schema::dropIfExists('dms_document_folders');
        Schema::dropIfExists('dms_folders');
        Schema::dropIfExists('dms_templates');
        Schema::dropIfExists('dms_document_comments');
        Schema::dropIfExists('dms_document_shares');
        Schema::dropIfExists('dms_document_access_logs');
        Schema::dropIfExists('dms_document_approvals');
        Schema::dropIfExists('dms_approval_workflows');
        Schema::dropIfExists('dms_document_versions');
        Schema::dropIfExists('dms_documents');
        Schema::dropIfExists('dms_categories');
    }
};
