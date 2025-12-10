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
        Schema::create('shift_schedules', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->time('start_time');
            $table->time('end_time');
            $table->integer('break_duration')->default(0)->comment('in minutes');
            $table->integer('grace_period')->default(0)->comment('in minutes');
            $table->json('working_days')->nullable()->comment('[1,2,3,4,5] for Mon-Fri');
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('employee_shift_schedule', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('shift_schedule_id');
            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('shift_schedule_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_shift_schedule');
        Schema::dropIfExists('shift_schedules');
    }
};
