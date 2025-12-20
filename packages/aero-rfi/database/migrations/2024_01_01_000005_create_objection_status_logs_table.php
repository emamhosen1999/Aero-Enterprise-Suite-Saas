<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Audit log for objection status changes.
     */
    public function up(): void
    {
        Schema::create('objection_status_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('objection_id')
                ->constrained('objections')
                ->cascadeOnDelete();
            $table->string('from_status')->nullable()->comment('Previous status (null for initial creation)');
            $table->string('to_status')->comment('New status');
            $table->text('notes')->nullable()->comment('Notes/reason for status change');
            $table->foreignId('changed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('changed_at');
            $table->timestamps();

            // Indexes
            $table->index('objection_id');
            $table->index('changed_by');
            $table->index('changed_at');
            $table->index(['objection_id', 'changed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('objection_status_logs');
    }
};
