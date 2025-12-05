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
        Schema::create('error_logs', function (Blueprint $table) {
            $table->id();
            $table->uuid('trace_id')->unique()->index();
            $table->string('tenant_id')->nullable()->index();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('error_type', 100)->index(); // e.g., 'ServerException', 'ValidationException', 'TenantNotFound'
            $table->integer('http_code')->default(500)->index();
            $table->string('request_method', 10)->nullable();
            $table->text('request_url');
            $table->json('request_payload')->nullable(); // Sanitized payload (no passwords, tokens)
            $table->text('error_message');
            $table->longText('stack_trace')->nullable(); // Full exception stack (private)
            $table->enum('origin', ['backend', 'frontend'])->default('backend')->index();
            $table->string('module')->nullable(); // Module/page name if available
            $table->string('component')->nullable(); // React component name for frontend errors
            $table->json('context')->nullable(); // Additional context data
            $table->string('user_agent')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->boolean('is_resolved')->default(false)->index();
            $table->unsignedBigInteger('resolved_by')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();

            // Indexes for common queries
            $table->index(['created_at', 'error_type']);
            $table->index(['tenant_id', 'created_at']);
            $table->index(['http_code', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('error_logs');
    }
};
