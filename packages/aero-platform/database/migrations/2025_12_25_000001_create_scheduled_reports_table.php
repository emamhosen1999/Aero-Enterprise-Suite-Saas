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
        if (Schema::hasTable('scheduled_reports')) {
            return;
        }

        Schema::create('scheduled_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('landlord_users')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('report_type', [
                'revenue',
                'subscription',
                'cohort_analysis',
                'plan_performance',
                'customer_analytics',
                'usage'
            ]);
            $table->json('config'); // Report configuration (metrics, filters, grouping, etc.)
            $table->enum('frequency', ['daily', 'weekly', 'monthly', 'custom'])->default('weekly');
            $table->json('schedule_config'); // Day/time configuration for schedule
            $table->json('recipients'); // Array of email addresses
            $table->json('export_formats')->nullable(); // ['pdf', 'csv', 'excel', 'json'] - defaults set in code
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('last_run_at')->nullable()->index();
            $table->timestamp('next_run_at')->nullable()->index();
            $table->timestamps();
            $table->softDeletes();

            // Indexes for performance
            $table->index('user_id');
            $table->index('frequency');
            $table->index(['is_active', 'next_run_at']); // Composite for finding due reports
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scheduled_reports');
    }
};
