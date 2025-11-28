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
        Schema::create('attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->time('office_start_time')->default('09:00');
            $table->time('office_end_time')->default('18:00');
            $table->integer('break_time_duration')->default(60); // minutes
            $table->integer('late_mark_after')->default(15); // minutes
            $table->integer('early_leave_before')->default(15); // minutes
            $table->integer('overtime_after')->default(30); // minutes
            $table->boolean('auto_punch_out')->default(false);
            $table->time('auto_punch_out_time')->nullable();
            $table->json('weekend_days')->nullable(); // Remove the default value
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_settings');
    }
};
