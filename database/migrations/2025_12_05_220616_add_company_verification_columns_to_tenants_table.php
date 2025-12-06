<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration adds company verification columns for the registration flow.
     * Company email/phone are the organization's contact details that need verification.
     * Admin credentials are NOT verified - they're passed directly to the tenant database.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Company verification columns (replaces admin verification for company contact info)
            $table->timestamp('company_email_verified_at')->nullable()->after('admin_phone_verification_sent_at');
            $table->timestamp('company_phone_verified_at')->nullable()->after('company_email_verified_at');
            $table->string('company_email_verification_code', 6)->nullable()->after('company_phone_verified_at');
            $table->timestamp('company_email_verification_sent_at')->nullable()->after('company_email_verification_code');
            $table->string('company_phone_verification_code', 6)->nullable()->after('company_email_verification_sent_at');
            $table->timestamp('company_phone_verification_sent_at')->nullable()->after('company_phone_verification_code');

            // Track which registration step the user left from (for resume functionality)
            $table->string('registration_step', 50)->nullable()->after('company_phone_verification_sent_at');

            // Index for finding resumable registrations efficiently
            $table->index(['email', 'status'], 'tenants_email_status_index');
            $table->index(['subdomain', 'status'], 'tenants_subdomain_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex('tenants_email_status_index');
            $table->dropIndex('tenants_subdomain_status_index');

            $table->dropColumn([
                'company_email_verified_at',
                'company_phone_verified_at',
                'company_email_verification_code',
                'company_email_verification_sent_at',
                'company_phone_verification_code',
                'company_phone_verification_sent_at',
                'registration_step',
            ]);
        });
    }
};
