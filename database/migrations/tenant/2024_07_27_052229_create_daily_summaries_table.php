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
        Schema::create('daily_summaries', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->foreignId('incharge')->constrained('users')->cascadeOnDelete();
            $table->integer('totalTasks');
            $table->integer('totalResubmission');
            $table->integer('embankmentTasks');
            $table->integer('structureTasks');
            $table->integer('pavementTasks');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_summaries');
    }
};
