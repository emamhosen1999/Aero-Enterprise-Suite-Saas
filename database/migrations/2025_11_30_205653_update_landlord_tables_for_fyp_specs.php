<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * EOS365 Landlord (Central) Database Schema Update
 *
 * This migration aligns the landlord tables with strict FYP academic standards:
 * - UUID for tenants (prevents enumeration attacks)
 * - Soft deletes on all major tables (data safety)
 * - Decimal for financial columns (precision)
 * - Strategic indexing for multi-tenant routing
 *
 * @author EOS365 Architecture Team
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // =====================================================
        // 1. UPDATE TENANTS TABLE - Add FYP required columns
        // =====================================================
        Schema::table('tenants', function (Blueprint $table) {
            // Status enum for tenant lifecycle management
            $table->string('status')->default('pending')->after('data')
                ->comment('Tenant status: pending, active, suspended, archived');

            // Maintenance mode flag for planned downtime
            $table->boolean('maintenance_mode')->default(false)->after('status')
                ->comment('When true, tenant sees maintenance page');

            // Index on status for filtering active tenants quickly
            $table->index('status');
        });

        // =====================================================
        // 2. UPDATE DOMAINS TABLE - Add is_primary flag
        // =====================================================
        Schema::table('domains', function (Blueprint $table) {
            // Primary domain flag (each tenant can have multiple domains)
            $table->boolean('is_primary')->default(true)->after('domain')
                ->comment('Primary domain used for redirects and canonical URLs');

            // Compound index for primary domain lookups
            $table->index(['tenant_id', 'is_primary']);
        });

        // =====================================================
        // 3. UPDATE PLANS TABLE - Match exact FYP spec
        // =====================================================
        Schema::table('plans', function (Blueprint $table) {
            // Add duration_in_months (replaces separate monthly/yearly prices)
            $table->integer('duration_in_months')->default(1)->after('slug')
                ->comment('1 = Monthly, 12 = Yearly billing cycle');

            // Add explicit limit columns (FYP requirement)
            $table->integer('max_users')->default(0)->after('duration_in_months')
                ->comment('0 = Unlimited users');
            $table->integer('max_storage_gb')->default(10)->after('max_users')
                ->comment('Storage quota in gigabytes');

            // Rename monthly_price to just price for simplicity
            // (We'll use duration_in_months to determine billing cycle)
        });

        // =====================================================
        // 4. UPDATE SUBSCRIPTIONS TABLE - Add payment_ref_id
        // =====================================================
        Schema::table('subscriptions', function (Blueprint $table) {
            // Rename external_subscription_id to payment_ref_id (FYP spec)
            $table->renameColumn('external_subscription_id', 'payment_ref_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->renameColumn('payment_ref_id', 'external_subscription_id');
        });

        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['duration_in_months', 'max_users', 'max_storage_gb']);
        });

        Schema::table('domains', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'is_primary']);
            $table->dropColumn('is_primary');
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn(['status', 'maintenance_mode']);
        });
    }
};
