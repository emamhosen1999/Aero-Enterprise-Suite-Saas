<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Laravel Cashier (Stripe) Integration Migration
 *
 * This migration adds the required columns for Laravel Cashier to the Landlord/Central database.
 * The Tenant model becomes the Billable entity for subscription management.
 *
 * @see https://laravel.com/docs/11.x/billing
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // =====================================================================
        // 1. Add Stripe Cashier columns to tenants table
        // =====================================================================
        Schema::table('tenants', function (Blueprint $table) {
            // Stripe Customer ID - links tenant to Stripe customer
            $table->string('stripe_id')->nullable()->index()->after('plan_id');

            // Payment Method details for displaying to users
            $table->string('pm_type')->nullable()->after('stripe_id');
            $table->string('pm_last_four', 4)->nullable()->after('pm_type');

            // Cashier-specific trial (separate from our trial_ends_at for flexibility)
            $table->timestamp('stripe_trial_ends_at')->nullable()->after('pm_last_four');
        });

        // =====================================================================
        // 2. Add Stripe Price IDs to plans table
        // =====================================================================
        Schema::table('plans', function (Blueprint $table) {
            // Stripe Price IDs for monthly and yearly billing
            $table->string('stripe_monthly_price_id')->nullable()->after('yearly_price');
            $table->string('stripe_yearly_price_id')->nullable()->after('stripe_monthly_price_id');

            // Stripe Product ID (optional, for reference)
            $table->string('stripe_product_id')->nullable()->after('stripe_yearly_price_id');
        });

        // =====================================================================
        // 3. Create subscription_items table (required by Cashier for metered billing)
        // =====================================================================
        Schema::create('subscription_items', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('subscription_id')->constrained()->onDelete('cascade');
            $table->string('stripe_id')->unique();
            $table->string('stripe_product');
            $table->string('stripe_price');
            $table->integer('quantity')->nullable();
            $table->timestamps();

            $table->index(['subscription_id', 'stripe_price']);
        });

        // =====================================================================
        // 4. Add Stripe columns to subscriptions table
        // =====================================================================
        Schema::table('subscriptions', function (Blueprint $table) {
            // Rename external_subscription_id to stripe_id for Cashier compatibility
            if (Schema::hasColumn('subscriptions', 'external_subscription_id')) {
                $table->renameColumn('external_subscription_id', 'stripe_id');
            } else {
                $table->string('stripe_id')->nullable()->unique()->after('id');
            }

            // Stripe-specific fields
            $table->string('stripe_status')->nullable()->after('status');
            $table->string('stripe_price')->nullable()->after('stripe_status');

            // Cashier uses 'type' to identify subscription names (e.g., 'default')
            if (! Schema::hasColumn('subscriptions', 'type')) {
                $table->string('type')->default('default')->after('tenant_id');
            }

            // Index for Cashier queries
            $table->index(['tenant_id', 'stripe_status']);
        });

        // =====================================================================
        // 5. Create customer_columns table for Stripe Tax/Invoicing (optional)
        // =====================================================================
        Schema::create('tenant_billing_addresses', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id');
            $table->string('company_name')->nullable();
            $table->string('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country', 2)->default('US'); // ISO 3166-1 alpha-2
            $table->string('tax_id')->nullable(); // VAT/GST number
            $table->string('tax_id_type')->nullable(); // eu_vat, us_ein, etc.
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->index('tenant_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop billing addresses table
        Schema::dropIfExists('tenant_billing_addresses');

        // Revert subscriptions table changes
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'stripe_status']);

            if (Schema::hasColumn('subscriptions', 'stripe_id')) {
                $table->renameColumn('stripe_id', 'external_subscription_id');
            }

            $table->dropColumn(['stripe_status', 'stripe_price', 'type']);
        });

        // Drop subscription_items table
        Schema::dropIfExists('subscription_items');

        // Revert plans table changes
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn([
                'stripe_monthly_price_id',
                'stripe_yearly_price_id',
                'stripe_product_id',
            ]);
        });

        // Revert tenants table changes
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex(['stripe_id']);
            $table->dropColumn([
                'stripe_id',
                'pm_type',
                'pm_last_four',
                'stripe_trial_ends_at',
            ]);
        });
    }
};
