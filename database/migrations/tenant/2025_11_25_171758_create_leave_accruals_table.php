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
        Schema::create('leave_accruals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('leave_type_id')->constrained('leave_settings')->onDelete('cascade');
            $table->date('accrual_date');
            $table->decimal('accrued_days', 5, 2);
            $table->decimal('balance_after_accrual', 5, 2);
            $table->enum('accrual_type', ['monthly', 'annual', 'joining', 'adjustment'])->default('monthly');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes
            $table->index(['user_id', 'leave_type_id']);
            $table->index('accrual_date');
            $table->unique(['user_id', 'leave_type_id', 'accrual_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_accruals');
    }
};
