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
        Schema::create('daily_works', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('number');
            $table->string('status');
            $table->string('type');
            $table->text('description');
            $table->string('location');
            $table->string('side')->nullable();
            $table->string('qty_layer')->nullable();
            $table->string('planned_time')->nullable();
            $table->foreignId('incharge')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned')->constrained('users')->cascadeOnDelete();
            $table->dateTime('completion_time')->nullable();
            $table->text('inspection_details')->nullable();
            $table->integer('resubmission_count')->nullable();
            $table->text('resubmission_date')->nullable();
            $table->date('rfi_submission_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_works');
    }
};
