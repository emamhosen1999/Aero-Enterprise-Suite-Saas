<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This creates tables for metered billing usage tracking.
     */
    public function up(): void
    {
        // =====================================================================
        // Usage Records - Tracks individual usage events for metered billing
        // =====================================================================
        Schema::create('usage_records', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('subscription_id')->nullable()->constrained()->onDelete('set null');

            // Metric identification
            $table->string('metric_name');  // e.g., 'api_calls', 'storage_gb', 'emails_sent'
            $table->string('metric_type')->default('counter'); // counter, gauge, histogram

            // Usage value
            $table->decimal('quantity', 20, 6);
            $table->string('unit')->default('unit'); // e.g., 'calls', 'gb', 'emails'

            // Billing period tracking
            $table->date('billing_period_start');
            $table->date('billing_period_end');

            // Optional attribution
            $table->nullableUuidMorphs('attributable'); // Links to user/module/feature that caused usage
            $table->json('metadata')->nullable(); // Additional context (e.g., endpoint, module)

            // Billing status
            $table->boolean('reported_to_stripe')->default(false);
            $table->string('stripe_usage_record_id')->nullable();
            $table->timestamp('reported_at')->nullable();

            $table->timestamps();

            // Indexes for querying
            $table->index(['tenant_id', 'metric_name', 'billing_period_start'], 'usage_tenant_metric_period');
            $table->index(['tenant_id', 'billing_period_start', 'billing_period_end'], 'usage_tenant_period');
            $table->index(['subscription_id', 'metric_name'], 'usage_sub_metric');
            $table->index('reported_to_stripe');
        });

        // =====================================================================
        // Usage Aggregates - Daily/monthly rollups for faster querying
        // =====================================================================
        Schema::create('usage_aggregates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->onDelete('cascade');

            $table->string('metric_name');
            $table->string('period_type'); // 'daily', 'monthly'
            $table->date('period_start');
            $table->date('period_end');

            // Aggregate values
            $table->decimal('total_quantity', 20, 6)->default(0);
            $table->decimal('min_quantity', 20, 6)->nullable();
            $table->decimal('max_quantity', 20, 6)->nullable();
            $table->decimal('avg_quantity', 20, 6)->nullable();
            $table->integer('record_count')->default(0);

            $table->timestamps();

            $table->unique(['tenant_id', 'metric_name', 'period_type', 'period_start'], 'usage_agg_unique');
            $table->index(['tenant_id', 'metric_name']);
        });

        // =====================================================================
        // Usage Limits - Configurable limits per plan/tenant
        // =====================================================================
        Schema::create('usage_limits', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Can be linked to plan OR tenant (tenant overrides plan)
            $table->foreignUuid('plan_id')->nullable()->constrained()->onDelete('cascade');
            $table->foreignUuid('tenant_id')->nullable()->constrained()->onDelete('cascade');

            $table->string('metric_name');
            $table->decimal('limit_value', 20, 6);
            $table->string('period_type')->default('monthly'); // monthly, daily, yearly

            // Limit behavior
            $table->enum('action_on_limit', ['block', 'throttle', 'charge_overage', 'notify'])->default('notify');
            $table->decimal('overage_price', 10, 4)->nullable(); // Price per unit over limit
            $table->integer('soft_limit_percent')->default(80); // When to warn

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['plan_id', 'metric_name'], 'usage_limits_plan_metric_unique');
            $table->unique(['tenant_id', 'metric_name'], 'usage_limits_tenant_metric_unique');
        });

        // =====================================================================
        // Usage Alerts - Track when limits are approached/exceeded
        // =====================================================================
        Schema::create('usage_alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('tenant_id')->constrained()->onDelete('cascade');
            $table->foreignUuid('usage_limit_id')->nullable()->constrained()->onDelete('cascade');

            $table->string('metric_name');
            $table->string('alert_type'); // 'approaching_limit', 'limit_reached', 'overage'
            $table->integer('threshold_percent');
            $table->decimal('current_usage', 20, 6);
            $table->decimal('limit_value', 20, 6);

            $table->boolean('notification_sent')->default(false);
            $table->timestamp('notified_at')->nullable();
            $table->boolean('acknowledged')->default(false);
            $table->timestamp('acknowledged_at')->nullable();

            $table->timestamps();

            $table->index(['tenant_id', 'alert_type', 'acknowledged']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usage_alerts');
        Schema::dropIfExists('usage_limits');
        Schema::dropIfExists('usage_aggregates');
        Schema::dropIfExists('usage_records');
    }
};
