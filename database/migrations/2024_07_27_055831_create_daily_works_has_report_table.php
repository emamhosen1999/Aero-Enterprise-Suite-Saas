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
        Schema::create('daily_work_has_report', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('daily_work_id');
            $table->unsignedBigInteger('report_id');
            // Add additional columns if needed
            $table->timestamps();

            // Define foreign key constraints
            $table->foreign('daily_work_id')->references('id')->on('daily_works')->onDelete('cascade');
            $table->foreign('report_id')->references('id')->on('reports')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_has_report');
    }
};
