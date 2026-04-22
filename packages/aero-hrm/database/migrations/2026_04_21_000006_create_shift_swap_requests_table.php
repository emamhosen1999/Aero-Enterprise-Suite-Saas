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
        Schema::create('shift_swap_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('requester_id');
            $table->unsignedBigInteger('shift_schedule_id');
            $table->unsignedBigInteger('acceptor_id')->nullable();
            $table->unsignedBigInteger('replacement_shift_id')->nullable();
            $table->enum('status', ['open', 'pending', 'approved', 'rejected', 'cancelled', 'completed'])->default('open');
            $table->enum('request_type', ['open_pickup', 'specific_swap'])->default('open_pickup');
            $table->text('reason')->nullable();
            $table->text('manager_notes')->nullable();
            $table->unsignedBigInteger('approved_by')->nullable();
            $table->text('rejected_reason')->nullable();
            $table->dateTime('started_at')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('requester_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('shift_schedule_id')->references('id')->on('shift_schedules')->cascadeOnDelete();
            $table->foreign('acceptor_id')->references('id')->on('users')->cascadeOnDelete();
            $table->foreign('replacement_shift_id')->references('id')->on('shift_schedules')->cascadeOnDelete();
            $table->foreign('approved_by')->references('id')->on('users')->nullOnDelete();

            // Indexes for common queries
            $table->index('requester_id');
            $table->index('shift_schedule_id');
            $table->index('acceptor_id');
            $table->index('status');
            $table->index('request_type');
            $table->index(['requester_id', 'status']);
            $table->index(['shift_schedule_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shift_swap_requests');
    }
};
