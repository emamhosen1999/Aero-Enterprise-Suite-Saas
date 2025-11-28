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
        Schema::table('users', function (Blueprint $table) {
            // Add modern authentication columns if they don't exist
            if (! Schema::hasColumn('users', 'two_factor_secret')) {
                $table->text('two_factor_secret')->nullable()->after('password');
            }

            if (! Schema::hasColumn('users', 'two_factor_recovery_codes')) {
                $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            }

            if (! Schema::hasColumn('users', 'two_factor_confirmed_at')) {
                $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_recovery_codes');
            }

            // Security tracking columns
            if (! Schema::hasColumn('users', 'last_login_at')) {
                $table->timestamp('last_login_at')->nullable()->after('email_verified_at');
            }

            if (! Schema::hasColumn('users', 'last_login_ip')) {
                $table->string('last_login_ip', 45)->nullable()->after('last_login_at');
            }

            if (! Schema::hasColumn('users', 'login_count')) {
                $table->integer('login_count')->default(0)->after('last_login_ip');
            }

            // Security preferences
            if (! Schema::hasColumn('users', 'notification_preferences')) {
                $table->json('notification_preferences')->nullable()->after('login_count');
            }

            if (! Schema::hasColumn('users', 'security_notifications')) {
                $table->boolean('security_notifications')->default(true)->after('notification_preferences');
            }

            // Account status
            if (! Schema::hasColumn('users', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('security_notifications');
            }

            if (! Schema::hasColumn('users', 'account_locked_at')) {
                $table->timestamp('account_locked_at')->nullable()->after('is_active');
            }

            if (! Schema::hasColumn('users', 'locked_reason')) {
                $table->string('locked_reason')->nullable()->after('account_locked_at');
            }
        });

        // Create authentication events table
        if (! Schema::hasTable('authentication_events')) {
            Schema::create('authentication_events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
                $table->string('event_type', 50); // Limited length to prevent index issues
                $table->string('ip_address', 45);
                $table->text('user_agent')->nullable();
                $table->json('metadata')->nullable(); // Additional context data
                $table->string('status', 20); // Limited length: success, failure, attempted
                $table->string('risk_level', 20)->default('low'); // Limited length: low, medium, high, critical
                $table->timestamp('occurred_at');
                $table->timestamps();

                $table->index(['user_id', 'event_type']);
                $table->index(['ip_address', 'occurred_at']);
                $table->index(['event_type', 'status']); // Now safe with limited lengths
            });
        }

        // Create user sessions table for tracking
        if (! Schema::hasTable('user_sessions')) {
            Schema::create('user_sessions', function (Blueprint $table) {
                $table->id();
                $table->string('session_id', 191)->unique(); // Limited for index
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->string('ip_address', 45);
                $table->text('user_agent');
                $table->string('device_fingerprint', 191)->nullable(); // Limited for potential indexing
                $table->json('device_info')->nullable(); // browser, os, device type
                $table->json('location_info')->nullable(); // country, city, timezone
                $table->boolean('is_current')->default(true);
                $table->timestamp('last_activity');
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();

                $table->index(['user_id', 'is_current']);
                $table->index(['session_id', 'is_current']);
                $table->index('last_activity');
            });
        }

        // Create password reset tokens table (enhanced)
        if (! Schema::hasTable('password_reset_tokens_secure')) {
            Schema::create('password_reset_tokens_secure', function (Blueprint $table) {
                $table->id();
                $table->string('email');
                $table->string('token', 191); // Limited for index safety
                $table->string('verification_code', 6)->nullable(); // For OTP verification
                $table->boolean('is_verified')->default(false);
                $table->integer('attempts')->default(0);
                $table->timestamp('expires_at');
                $table->timestamp('verified_at')->nullable();
                $table->string('ip_address', 45);
                $table->text('user_agent')->nullable();
                $table->timestamps();

                $table->index(['email', 'token']);
                $table->index(['verification_code', 'is_verified']);
            });
        }

        // Create failed login attempts table
        if (! Schema::hasTable('failed_login_attempts')) {
            Schema::create('failed_login_attempts', function (Blueprint $table) {
                $table->id();
                $table->string('email');
                $table->string('ip_address', 45);
                $table->text('user_agent')->nullable();
                $table->string('failure_reason', 100); // Limited length for index safety
                $table->json('metadata')->nullable();
                $table->timestamp('attempted_at');
                $table->timestamps();

                $table->index(['email', 'attempted_at']);
                $table->index(['ip_address', 'attempted_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_secret',
                'two_factor_recovery_codes',
                'two_factor_confirmed_at',
                'last_login_at',
                'last_login_ip',
                'login_count',
                'notification_preferences',
                'security_notifications',
                'is_active',
                'account_locked_at',
                'locked_reason',
            ]);
        });

        Schema::dropIfExists('authentication_events');
        Schema::dropIfExists('user_sessions');
        Schema::dropIfExists('password_reset_tokens_secure');
        Schema::dropIfExists('failed_login_attempts');
    }
};
