<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Update Landlord Users Table to Match Users Structure
 *
 * This migration updates the landlord_users table to have the same structure
 * as the users table, enabling shared roles and permissions between
 * platform admins (landlord) and tenant users.
 *
 * Key changes:
 * - Change from UUID to auto-increment ID (matching users table)
 * - Add user_name column
 * - Rename is_active to active
 * - Remove role column (will use Spatie roles instead)
 * - Add profile fields for consistency
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop existing table and recreate with matching structure
        Schema::dropIfExists('landlord_password_reset_tokens');
        Schema::dropIfExists('landlord_users');

        Schema::create('landlord_users', function (Blueprint $table) {
            // Core fields matching users table
            $table->id();
           
            $table->string('phone')->unique()->nullable();
            $table->string('email')->unique();
            $table->string('password');
            $table->string('name');

            $table->boolean('active')->default(true);
            $table->softDeletes();

            // Profile fields (subset of users - platform admins don't need HRM fields)
            $table->string('profile_image')->nullable();
            $table->string('timezone')->default('UTC');

            // Two-factor authentication
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();

            // Login tracking
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();

            $table->timestamp('email_verified_at')->nullable();
            $table->rememberToken();
            $table->timestamps();

            // Indexes
            $table->index('active');
            $table->index(['email', 'active']);
        });

        // Password reset tokens for landlord users
        Schema::create('landlord_password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        // Sessions table for database session driver (shared for landlord)
        if (! Schema::hasTable('sessions')) {
            Schema::create('sessions', function (Blueprint $table) {
                $table->string('id')->primary();
                $table->foreignId('user_id')->nullable()->index();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->longText('payload');
                $table->integer('last_activity')->index();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('landlord_password_reset_tokens');
        Schema::dropIfExists('landlord_users');

        // Recreate original structure
        Schema::create('landlord_users', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('role')->default('admin');
            $table->boolean('is_active')->default(true);
            $table->string('avatar')->nullable();
            $table->string('phone')->nullable();
            $table->string('timezone')->default('UTC');
            $table->text('two_factor_secret')->nullable();
            $table->text('two_factor_recovery_codes')->nullable();
            $table->timestamp('two_factor_confirmed_at')->nullable();
            $table->timestamp('last_login_at')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();
            $table->index('role');
            $table->index('is_active');
            $table->index(['email', 'is_active']);
        });

        Schema::create('landlord_password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });
    }
};
