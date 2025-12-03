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
        Schema::table('tenants', function (Blueprint $table) {
            $table->timestamp('admin_email_verified_at')->nullable()->after('status');
            $table->timestamp('admin_phone_verified_at')->nullable()->after('admin_email_verified_at');
            $table->string('admin_email_verification_code', 60)->nullable()->after('admin_phone_verified_at');
            $table->timestamp('admin_email_verification_sent_at')->nullable()->after('admin_email_verification_code');
            $table->string('admin_phone_verification_code', 60)->nullable()->after('admin_email_verification_sent_at');
            $table->timestamp('admin_phone_verification_sent_at')->nullable()->after('admin_phone_verification_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'admin_email_verified_at',
                'admin_phone_verified_at',
                'admin_email_verification_code',
                'admin_email_verification_sent_at',
                'admin_phone_verification_code',
                'admin_phone_verification_sent_at',
            ]);
        });
    }
};
