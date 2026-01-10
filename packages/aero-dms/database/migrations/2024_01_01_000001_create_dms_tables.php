<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // DMS Categories
        Schema::create('dms_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique()->nullable();
            $table->text('description')->nullable();
            $table->string('color', 20)->default('#3b82f6');
            $table->string('icon', 100)->nullable();
            $table->json('allowed_file_types')->nullable();
            $table->unsignedInteger('max_file_size')->nullable()->comment('Max file size in KB');
            $table->unsignedInteger('retention_period')->nullable()->comment('Retention period in days');
            $table->boolean('requires_approval')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);
            $table->foreignId('parent_id')->nullable()->constrained('dms_categories')->nullOnDelete();
            $table->timestamps();
        });

        // DMS Folders
        Schema::create('dms_folders', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('color', 20)->default('#6366f1');
            $table->foreignId('parent_id')->nullable()->constrained('dms_folders')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('access_permissions')->nullable();
            $table->boolean('is_shared')->default(false);
            $table->timestamps();
        });

        // DMS Approval Workflows
        Schema::create('dms_approval_workflows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('steps')->nullable()->comment('Array of approval steps with approver IDs and order');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // DMS Documents (main table)
        Schema::create('dms_documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('document_number')->unique()->nullable();
            $table->text('description')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('dms_categories')->nullOnDelete();
            $table->foreignId('folder_id')->nullable()->constrained('dms_folders')->nullOnDelete();
            $table->string('file_name');
            $table->string('original_file_name');
            $table->string('file_path');
            $table->string('file_type', 50)->nullable();
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('mime_type', 100)->nullable();
            $table->string('checksum', 64)->nullable();
            $table->json('tags')->nullable();
            $table->json('keywords')->nullable();
            $table->json('custom_fields')->nullable();
            $table->unsignedInteger('version')->default(1);
            $table->foreignId('parent_document_id')->nullable()->constrained('dms_documents')->nullOnDelete();
            $table->boolean('is_latest_version')->default(true);
            $table->enum('status', ['draft', 'pending_review', 'approved', 'published', 'archived', 'rejected'])->default('draft');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->enum('visibility', ['private', 'team', 'department', 'public'])->default('private');
            $table->json('access_permissions')->nullable();
            $table->text('search_content')->nullable()->comment('Full text search content');
            $table->boolean('is_searchable')->default(true);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['status', 'is_latest_version']);
            $table->index(['category_id', 'status']);
            $table->index('document_number');
        });

        // DMS Document Versions
        Schema::create('dms_document_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->cascadeOnDelete();
            $table->unsignedInteger('version');
            $table->text('change_summary')->nullable();
            $table->string('file_path');
            $table->unsignedBigInteger('file_size')->default(0);
            $table->string('checksum', 64)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['document_id', 'version']);
        });

        // DMS Document Approvals
        Schema::create('dms_document_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->cascadeOnDelete();
            $table->foreignId('workflow_id')->nullable()->constrained('dms_approval_workflows')->nullOnDelete();
            $table->unsignedInteger('step_number')->default(1);
            $table->foreignId('approver_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('status', ['pending', 'approved', 'rejected', 'skipped'])->default('pending');
            $table->text('comments')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['document_id', 'status']);
        });

        // DMS Document Shares
        Schema::create('dms_document_shares', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->cascadeOnDelete();
            $table->foreignId('shared_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('shared_with')->nullable()->constrained('users')->nullOnDelete();
            $table->string('share_token', 64)->unique()->nullable();
            $table->enum('permission', ['view', 'download', 'edit'])->default('view');
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('download_count')->default(0);
            $table->unsignedInteger('view_count')->default(0);
            $table->timestamps();

            $table->index(['share_token', 'is_active']);
        });

        // DMS Document Access Logs
        Schema::create('dms_document_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('action', ['view', 'download', 'upload', 'edit', 'delete', 'share', 'approve', 'reject']);
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['document_id', 'created_at']);
        });

        // DMS Document Comments
        Schema::create('dms_document_comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('parent_id')->nullable()->constrained('dms_document_comments')->cascadeOnDelete();
            $table->text('content');
            $table->boolean('is_resolved')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index('document_id');
        });

        // DMS Templates
        Schema::create('dms_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('dms_categories')->nullOnDelete();
            $table->string('file_path');
            $table->json('placeholders')->nullable()->comment('Template placeholders/variables');
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // DMS Signatures
        Schema::create('dms_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('document_id')->constrained('dms_documents')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('signature_type', 50)->default('digital')->comment('digital, electronic, wet');
            $table->text('signature_data')->nullable();
            $table->string('certificate_info')->nullable();
            $table->timestamp('signed_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->boolean('is_valid')->default(true);
            $table->timestamps();

            $table->index(['document_id', 'user_id']);
        });

        // DMS Settings
        Schema::create('dms_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group', 50)->default('general');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dms_settings');
        Schema::dropIfExists('dms_signatures');
        Schema::dropIfExists('dms_templates');
        Schema::dropIfExists('dms_document_comments');
        Schema::dropIfExists('dms_document_access_logs');
        Schema::dropIfExists('dms_document_shares');
        Schema::dropIfExists('dms_document_approvals');
        Schema::dropIfExists('dms_document_versions');
        Schema::dropIfExists('dms_documents');
        Schema::dropIfExists('dms_approval_workflows');
        Schema::dropIfExists('dms_folders');
        Schema::dropIfExists('dms_categories');
    }
};
