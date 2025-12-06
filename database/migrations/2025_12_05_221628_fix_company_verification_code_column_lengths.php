<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Fixes company verification code columns to store hashed codes (60 chars for bcrypt).
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            // Increase column length to store bcrypt hashes (same as admin columns)
            $table->string('company_email_verification_code', 60)->nullable()->change();
            $table->string('company_phone_verification_code', 60)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('company_email_verification_code', 6)->nullable()->change();
            $table->string('company_phone_verification_code', 6)->nullable()->change();
        });
    }
};
