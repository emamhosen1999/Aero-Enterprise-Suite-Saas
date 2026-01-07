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
        // Compliance Training Records table
        if (! Schema::hasTable('compliance_training_records')) {
            Schema::create('compliance_training_records', function (Blueprint $table) {
                $table->id();
                $table->string('record_id')->unique();
                $table->foreignId('employee_id')->constrained('users')->cascadeOnDelete();
                $table->string('training_title');
                $table->text('training_description')->nullable();
                $table->string('training_type')->default('mandatory');
                $table->string('training_category')->nullable();
                $table->string('provider')->nullable();
                $table->string('instructor')->nullable();
                $table->date('scheduled_date')->nullable();
                $table->date('completion_date')->nullable();
                $table->date('expiry_date')->nullable();
                $table->string('status')->default('scheduled');
                $table->decimal('score', 5, 2)->nullable();
                $table->decimal('passing_score', 5, 2)->nullable();
                $table->decimal('duration_hours', 5, 2)->nullable();
                $table->decimal('cost', 15, 2)->nullable();
                $table->string('certificate_number')->nullable();
                $table->string('certificate_url')->nullable();
                $table->text('notes')->nullable();
                $table->boolean('reminder_sent')->default(false);
                $table->date('last_reminder_date')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['employee_id', 'status']);
                $table->index('training_category');
                $table->index('expiry_date');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('compliance_training_records');
    }
};
