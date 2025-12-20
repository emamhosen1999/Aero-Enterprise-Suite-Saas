<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Many-to-many pivot table for DailyWork <-> Objection relationship.
     * Allows one objection to affect multiple RFIs and one RFI to have multiple objections.
     */
    public function up(): void
    {
        Schema::create('daily_work_objection', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daily_work_id')
                ->constrained('daily_works')
                ->cascadeOnDelete();
            $table->foreignId('objection_id')
                ->constrained('objections')
                ->cascadeOnDelete();
            $table->foreignId('attached_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->comment('User who attached this objection to the RFI');
            $table->timestamp('attached_at')->nullable()->comment('When the objection was attached');
            $table->text('attachment_notes')->nullable()->comment('Notes about why objection was attached to this RFI');
            $table->timestamps();

            // Unique constraint to prevent duplicate attachments
            $table->unique(['daily_work_id', 'objection_id'], 'daily_work_objection_unique');

            // Indexes
            $table->index('attached_by');
            $table->index('attached_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_work_objection');
    }
};
