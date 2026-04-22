<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Canonical user_devices table migration.
 *
 * Consolidates:
 *  - 2025_12_02_202539_create_user_devices_table.php           (base)
 *  - 2026_01_28_000001_add_device_salt_to_user_devices_table.php (absorbed)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->uuid('device_id')->index();

            // ── Token fields ───────────────────────────────────────────────────
            $table->string('device_token')->nullable();

            // Absorbed from: add_device_salt_to_user_devices_table
            $table->string('device_salt', 255)->nullable();
            $table->decimal('token_timestamp', 16, 6)->nullable();

            // ── Device metadata ────────────────────────────────────────────────
            $table->string('device_name')->nullable();
            $table->string('device_type')->nullable();
            $table->string('browser')->nullable();
            $table->string('platform')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();

            // ── Status ─────────────────────────────────────────────────────────
            $table->boolean('is_active')->default(true);
            $table->boolean('is_trusted')->default(false);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'device_id']);
            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_devices');
    }
};
