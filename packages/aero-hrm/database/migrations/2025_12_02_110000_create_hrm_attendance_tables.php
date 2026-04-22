<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Canonical HRM Attendance tables migration.
 *
 * Split from: 2025_12_02_121546_create_hrm_core_tables.php (section 2.2)
 * No additive migrations absorbed — this domain was clean.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── attendance_settings ────────────────────────────────────────────────
        if (! Schema::hasTable('attendance_settings')) {
            Schema::create('attendance_settings', function (Blueprint $table) {
                $table->id();
                $table->time('shift_start_time')->default('09:00:00');
                $table->time('shift_end_time')->default('17:00:00');
                $table->integer('break_duration_minutes')->default(60);
                $table->integer('late_arrival_threshold_minutes')->default(15);
                $table->integer('early_leave_threshold_minutes')->default(15);
                $table->decimal('half_day_threshold_hours', 5, 2)->default(4);
                $table->decimal('full_day_hours', 5, 2)->default(8);
                $table->boolean('enable_ip_restriction')->default(false);
                $table->json('allowed_ip_addresses')->nullable();
                $table->boolean('enable_geolocation')->default(false);
                $table->decimal('office_latitude', 10, 7)->nullable();
                $table->decimal('office_longitude', 10, 7)->nullable();
                $table->integer('geofence_radius_meters')->default(100);
                $table->boolean('require_selfie')->default(false);
                $table->timestamps();
            });
        }

        // ── attendance_types ───────────────────────────────────────────────────
        if (! Schema::hasTable('attendance_types')) {
            Schema::create('attendance_types', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->unique();
                $table->text('description')->nullable();
                $table->string('color')->nullable();
                $table->boolean('is_active')->default(true);
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // ── attendances ────────────────────────────────────────────────────────
        if (! Schema::hasTable('attendances')) {
            Schema::create('attendances', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->foreignId('attendance_type_id')->nullable()->constrained()->nullOnDelete();
                $table->date('date');
                $table->dateTime('punchin')->nullable();
                $table->dateTime('punchout')->nullable();
                $table->text('punchin_location')->nullable();
                $table->text('punchout_location')->nullable();
                $table->decimal('work_hours', 5, 2)->default(0);
                $table->decimal('overtime_hours', 5, 2)->default(0);
                $table->boolean('is_late')->default(false);
                $table->boolean('is_early_leave')->default(false);
                $table->string('status')->default('Present');
                $table->string('punchin_ip')->nullable();
                $table->string('punchout_ip')->nullable();
                $table->boolean('is_manual')->default(false);
                $table->text('adjustment_reason')->nullable();
                $table->foreignId('adjusted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'date']);
                $table->index(['date', 'status']);
                $table->index(['user_id', 'date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('attendance_types');
        Schema::dropIfExists('attendance_settings');
    }
};
