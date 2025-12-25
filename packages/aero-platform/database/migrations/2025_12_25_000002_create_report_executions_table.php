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
        if (Schema::hasTable('report_executions')) {
            return;
        }

        Schema::create('report_executions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('scheduled_report_id')->constrained('scheduled_reports')->onDelete('cascade');
            $table->enum('status', ['pending', 'running', 'completed', 'failed'])->default('pending')->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('execution_time_ms')->nullable(); // Duration in milliseconds
            $table->integer('record_count')->nullable(); // Number of records in report
            $table->string('file_path')->nullable(); // Path to generated file
            $table->integer('file_size_kb')->nullable(); // File size in KB
            $table->text('error_message')->nullable(); // Error details if failed
            $table->integer('retry_count')->default(0); // Number of retry attempts
            $table->timestamps();

            // Indexes for performance
            $table->index('scheduled_report_id');
            $table->index('status');
            $table->index('created_at'); // For cleanup and history queries
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('report_executions');
    }
};
