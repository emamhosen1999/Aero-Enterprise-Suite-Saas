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
        if (Schema::hasTable('quota_warnings')) {
            return;
        }

        Schema::create('quota_warnings', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id')->index();
            $table->string('quota_type', 50)->index(); // 'users', 'storage_gb', 'api_calls_monthly', etc.
            $table->decimal('percentage', 5, 2); // e.g., 85.50 for 85.5%
            $table->string('threshold_type', 20); // 'warning', 'critical', 'block'
            $table->timestamp('first_warned_at')->nullable();
            $table->timestamp('last_warned_at')->nullable();
            $table->unsignedInteger('warning_count')->default(0);
            $table->boolean('is_dismissed')->default(false)->index();
            $table->timestamp('dismissed_at')->nullable();
            $table->foreignId('dismissed_by_user_id')->nullable()->constrained('landlord_users')->onDelete('set null');
            $table->timestamps();

            // Foreign key for tenant
            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');

            // Composite indexes for common queries
            $table->index(['tenant_id', 'quota_type', 'is_dismissed']);
            $table->index(['is_dismissed', 'last_warned_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quota_warnings');
    }
};
