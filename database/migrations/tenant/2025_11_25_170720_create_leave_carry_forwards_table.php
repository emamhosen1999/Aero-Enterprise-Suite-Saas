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
        Schema::create('leave_carry_forwards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('leave_type_id')->constrained('leave_settings')->onDelete('cascade');
            $table->year('year');
            $table->decimal('carried_days', 5, 1)->default(0);
            $table->decimal('used_days', 5, 1)->default(0);
            $table->date('expiry_date')->nullable();
            $table->boolean('is_expired')->default(false);
            $table->timestamps();

            // Unique constraint to prevent duplicate carry forwards
            $table->unique(['user_id', 'leave_type_id', 'year']);

            // Indexes for better query performance
            $table->index(['user_id', 'year']);
            $table->index('expiry_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_carry_forwards');
    }
};
