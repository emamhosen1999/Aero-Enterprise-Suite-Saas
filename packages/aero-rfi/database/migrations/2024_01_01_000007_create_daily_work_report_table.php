<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Pivot table for DailyWork <-> Report relationship.
     * Allows linking daily works to generated reports.
     */
    public function up(): void
    {
        Schema::create('daily_work_report', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')
                ->constrained('daily_works')
                ->cascadeOnDelete();
            $table->unsignedBigInteger('report_id')
                ->comment('Reference to reports table (may exist in different module)');
            $table->timestamps();

            // Unique constraint to prevent duplicate attachments
            $table->unique(['daily_work_id', 'report_id'], 'daily_work_report_unique');

            // Indexes
            $table->index('report_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_work_report');
    }
};
