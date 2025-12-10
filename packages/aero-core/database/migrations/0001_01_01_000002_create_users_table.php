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
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('user_name');
            $table->string('phone')->unique()->nullable();
            $table->string('email')->unique();
            $table->string('password');

            // Two-Factor Authentication (from Fortify)
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();

            // OAuth / Social Login
            $table->string('oauth_provider')->nullable();
            $table->string('oauth_provider_id')->nullable();
            $table->string('oauth_token')->nullable();
            $table->string('oauth_refresh_token')->nullable();
            $table->timestamp('oauth_token_expires_at')->nullable();
            $table->string('avatar_url')->nullable();

            $table->string('name');

            // Account Status
            $table->boolean('active')->default(true);
            $table->boolean('is_active')->default(true);
            $table->timestamp('account_locked_at')->nullable();
            $table->string('locked_reason')->nullable();

            $table->softDeletes();

            // Basic Profile Info
            $table->date('date_of_joining')->nullable();
            $table->date('birthday')->nullable();
            $table->string('gender')->nullable();
            $table->string('passport_no')->nullable();
            $table->date('passport_exp_date')->nullable();
            $table->string('nationality')->nullable();
            $table->string('religion')->nullable();
            $table->string('marital_status')->nullable();
            $table->string('employment_of_spouse')->nullable();
            $table->integer('number_of_children')->nullable();

            // Salary & Benefits (kept for backward compatibility)
            $table->string('salary_basis')->nullable();
            $table->decimal('salary_amount', 10, 2)->nullable();
            $table->string('payment_type')->nullable();
            $table->boolean('pf_contribution')->nullable();
            $table->string('pf_no')->nullable();
            $table->string('employee_pf_rate')->nullable();
            $table->string('additional_pf_rate')->nullable();
            $table->string('total_pf_rate')->nullable();
            $table->boolean('esi_contribution')->nullable();
            $table->string('esi_no')->nullable();
            $table->string('employee_esi_rate')->nullable();
            $table->string('additional_esi_rate')->nullable();
            $table->string('total_esi_rate')->nullable();

            // Authentication Timestamps
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip', 45)->nullable();
            $table->integer('login_count')->default(0);

            // User Preferences
            $table->json('notification_preferences')->nullable();
            $table->boolean('security_notifications')->default(true);

            $table->rememberToken();
            $table->timestamps();

            // Indexes
            $table->index(['oauth_provider', 'oauth_provider_id']);
        });
        }

        if (!Schema::hasTable('password_reset_tokens')) {
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
        }

        if (!Schema::hasTable('sessions')) {
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
        }

        // User Sessions Tracking (enhanced session management)
        if (!Schema::hasTable('user_sessions_tracking')) {
        Schema::create('user_sessions_tracking', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_id', 100)->index();
            $table->string('ip_address', 45);
            $table->text('user_agent');
            $table->string('device_type', 50)->nullable();
            $table->string('device_name', 100)->nullable();
            $table->string('browser', 50)->nullable();
            $table->string('platform', 50)->nullable();
            $table->string('location', 255)->nullable();
            $table->json('device_fingerprint')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_activity')->useCurrent();
            $table->timestamp('login_at')->useCurrent();
            $table->timestamp('logout_at')->nullable();
            $table->enum('logout_type', ['manual', 'timeout', 'forced', 'admin'])->nullable();
            $table->json('security_flags')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_active']);
            $table->index(['user_id', 'last_activity']);
        });
        }

        // Authentication Events (security audit log)
        if (!Schema::hasTable('authentication_events')) {
        Schema::create('authentication_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('event_type', 50);
            $table->string('ip_address', 45);
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable();
            $table->string('status', 20);
            $table->string('risk_level', 20)->default('low');
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['user_id', 'event_type']);
            $table->index(['ip_address', 'occurred_at']);
            $table->index(['event_type', 'status']);
        });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('authentication_events');
        Schema::dropIfExists('user_sessions_tracking');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};
