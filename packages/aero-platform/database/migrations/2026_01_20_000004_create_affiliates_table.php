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
        // Affiliates (Referral Partners)
        Schema::create('affiliates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('company_name')->nullable();
            $table->string('website')->nullable();
            $table->string('referral_code')->unique();
            $table->string('status')->default('pending'); // pending, approved, suspended, rejected
            $table->decimal('commission_rate', 5, 2)->default(10.00); // Percentage
            $table->string('commission_type')->default('percentage'); // percentage, fixed
            $table->decimal('fixed_commission', 10, 2)->nullable(); // Fixed amount per referral
            $table->integer('cookie_days')->default(30); // Cookie lifetime for tracking
            $table->string('payout_method')->nullable(); // bank_transfer, paypal, stripe
            $table->json('payout_details')->nullable(); // Bank details, PayPal email, etc.
            $table->decimal('minimum_payout', 10, 2)->default(50.00);
            $table->decimal('total_earnings', 12, 2)->default(0);
            $table->decimal('pending_earnings', 12, 2)->default(0);
            $table->decimal('paid_earnings', 12, 2)->default(0);
            $table->integer('total_referrals')->default(0);
            $table->integer('successful_referrals')->default(0);
            $table->json('metadata')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('last_referral_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'created_at']);
            $table->index(['referral_code']);
        });

        // Affiliate Referrals (Tracking)
        Schema::create('affiliate_referrals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_id')->constrained()->cascadeOnDelete();
            $table->string('visitor_id')->nullable(); // Cookie/session ID
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();
            $table->string('referrer_url')->nullable();
            $table->string('landing_page')->nullable();
            $table->json('utm_data')->nullable();
            $table->string('status')->default('clicked'); // clicked, registered, converted, refunded
            $table->foreignId('tenant_id')->nullable(); // If converted to tenant
            $table->string('tenant_email')->nullable();
            $table->decimal('transaction_amount', 12, 2)->nullable();
            $table->decimal('commission_amount', 12, 2)->nullable();
            $table->string('commission_status')->default('pending'); // pending, approved, paid, cancelled
            $table->timestamp('registered_at')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->timestamp('commission_paid_at')->nullable();
            $table->timestamps();

            $table->index(['affiliate_id', 'status']);
            $table->index(['visitor_id']);
            $table->index(['tenant_id']);
        });

        // Affiliate Payouts
        Schema::create('affiliate_payouts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('affiliate_id')->constrained()->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency')->default('USD');
            $table->string('status')->default('pending'); // pending, processing, completed, failed
            $table->string('payout_method');
            $table->json('payout_details')->nullable();
            $table->string('transaction_reference')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['affiliate_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('affiliate_payouts');
        Schema::dropIfExists('affiliate_referrals');
        Schema::dropIfExists('affiliates');
    }
};
