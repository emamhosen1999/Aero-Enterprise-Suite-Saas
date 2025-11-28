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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('action', 100); // Reduced length for better indexing
            $table->json('context')->nullable();
            $table->enum('level', ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug'])->default('info');
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->ipAddress('ip_address')->nullable();
            $table->string('user_agent', 512)->nullable();
            $table->string('route', 100)->nullable(); // Reduced length for better indexing
            $table->string('method', 10)->nullable();
            $table->text('url')->nullable();
            $table->string('session_id', 50)->nullable(); // Reduced length
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // Optimized indexes for performance (avoid exceeding MySQL key length limit)
            $table->index(['user_id', 'created_at']);
            $table->index(['level', 'created_at']);
            $table->index('action'); // Separate index for action
            $table->index('created_at'); // Separate index for created_at
            $table->index('ip_address');
            $table->index('route');
        });        // Create performance monitoring table
        Schema::create('performance_metrics', function (Blueprint $table) {
            $table->id();
            $table->string('metric_type', 50); // 'page_load', 'api_response', 'query_execution'
            $table->string('identifier', 100); // route name, endpoint, query hash
            $table->float('execution_time_ms');
            $table->json('metadata')->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->ipAddress('ip_address')->nullable();
            $table->timestamp('created_at')->useCurrent();

            // Optimized indexes for performance analysis
            $table->index(['metric_type', 'created_at']);
            $table->index(['identifier', 'created_at']);
            $table->index('execution_time_ms');
            $table->index('created_at');
        });        // Create error tracking table
        Schema::create('error_logs', function (Blueprint $table) {
            $table->id();
            $table->string('error_id', 50)->unique(); // Reduced length
            $table->string('message', 500); // Controlled length for better performance
            $table->text('stack_trace')->nullable();
            $table->text('component_stack')->nullable();
            $table->string('url', 500); // Controlled length
            $table->string('user_agent', 512)->nullable();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->ipAddress('ip_address')->nullable();
            $table->json('metadata')->nullable();
            $table->boolean('resolved')->default(false);
            $table->text('resolution_notes')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();

            // Optimized indexes
            $table->index(['resolved', 'created_at']);
            $table->index('error_id');
            $table->index('created_at');
            $table->index('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('error_logs');
        Schema::dropIfExists('performance_metrics');
        Schema::dropIfExists('audit_logs');
    }
};
