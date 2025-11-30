<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create tenant_stats table for aggregated statistics from all tenants.
 *
 * This table stores daily snapshots of key metrics for each tenant,
 * enabling platform-wide analytics, reporting, and billing calculations.
 *
 * Data is collected by a scheduled job that runs daily and aggregates
 * metrics from each tenant's database.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tenant_stats', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->date('date')->comment('Date for which stats are recorded');

            // User metrics
            $table->unsignedInteger('total_users')->default(0)->comment('Total registered users in tenant');
            $table->unsignedInteger('active_users')->default(0)->comment('Users who logged in within last 30 days');

            // Revenue metrics (from Stripe/Cashier invoices)
            $table->decimal('total_revenue', 12, 2)->default(0)->comment('Total revenue from tenant in cents converted to dollars');
            $table->decimal('mrr', 10, 2)->default(0)->comment('Monthly Recurring Revenue');

            // Project/Module metrics
            $table->unsignedInteger('active_projects')->default(0)->comment('Projects with status active');
            $table->unsignedInteger('total_documents')->default(0)->comment('Total documents in DMS');
            $table->unsignedInteger('total_employees')->default(0)->comment('Total employees in HR module');

            // Storage & API metrics
            $table->unsignedBigInteger('storage_used_mb')->default(0)->comment('Storage used in megabytes');
            $table->unsignedBigInteger('api_requests')->default(0)->comment('API requests for the day');

            // Module usage flags (for feature adoption tracking)
            $table->json('module_usage')->nullable()->comment('JSON object with module-specific usage stats');

            $table->timestamp('created_at')->useCurrent();

            // Foreign key constraint
            $table->foreign('tenant_id')
                ->references('id')
                ->on('tenants')
                ->onDelete('cascade');

            // Indexes for common queries
            $table->index('date', 'idx_tenant_stats_date'); // Global totals by date
            $table->index('tenant_id', 'idx_tenant_stats_tenant');
            $table->index(['tenant_id', 'date'], 'idx_tenant_stats_tenant_date');
            $table->unique(['tenant_id', 'date'], 'uq_tenant_stats_tenant_date'); // One record per tenant per day
        });

        // Create a summary/rollup table for faster platform-wide queries
        Schema::create('platform_stats_daily', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique()->comment('Date for platform-wide stats');

            // Aggregated totals across all tenants
            $table->unsignedInteger('total_tenants')->default(0);
            $table->unsignedInteger('active_tenants')->default(0)->comment('Tenants with active status');
            $table->unsignedInteger('total_users')->default(0);
            $table->unsignedInteger('active_users')->default(0);
            $table->decimal('total_revenue', 14, 2)->default(0);
            $table->decimal('total_mrr', 12, 2)->default(0);
            $table->unsignedBigInteger('total_storage_mb')->default(0);
            $table->unsignedBigInteger('total_api_requests')->default(0);

            // Tenant lifecycle metrics
            $table->unsignedInteger('new_signups')->default(0)->comment('New tenants that day');
            $table->unsignedInteger('churned_tenants')->default(0)->comment('Tenants that cancelled');
            $table->unsignedInteger('trials_started')->default(0);
            $table->unsignedInteger('trials_converted')->default(0);

            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();

            // Index for date-based queries
            $table->index('date', 'idx_platform_stats_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_stats_daily');
        Schema::dropIfExists('tenant_stats');
    }
};
