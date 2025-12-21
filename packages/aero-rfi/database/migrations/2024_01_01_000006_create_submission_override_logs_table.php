<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Audit log for when RFI submissions are overridden despite active objections.
     * Important for compliance and accountability tracking.
     */
    public function up(): void
    {
        Schema::create('submission_override_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')
                ->constrained('daily_works')
                ->cascadeOnDelete();
            $table->date('old_submission_date')->nullable()->comment('Previous RFI submission date');
            $table->date('new_submission_date')->nullable()->comment('New RFI submission date after override');
            $table->integer('active_objections_count')->default(0)->comment('Number of active objections at time of override');
            $table->text('reason')->comment('Justification for override');
            $table->boolean('user_acknowledged')->default(true)->comment('Whether user acknowledged the override');
            $table->foreignId('overridden_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('overridden_at');
            $table->json('objection_ids')->nullable()->comment('Array of objection IDs that were active at time of override');
            $table->timestamps();

            // Indexes
            $table->index('daily_work_id');
            $table->index('overridden_by');
            $table->index('overridden_at');
            $table->index(['daily_work_id', 'overridden_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('submission_override_logs');
    }
};
