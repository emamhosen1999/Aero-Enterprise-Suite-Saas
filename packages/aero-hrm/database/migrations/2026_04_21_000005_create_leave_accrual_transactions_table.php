<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_accrual_transactions', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('leave_type_id')->constrained('leave_settings');
            $table->foreignId('accrual_rule_id')->nullable()->constrained('leave_accrual_rules')->nullOnDelete();
            $table->enum('transaction_type', ['accrual', 'adjustment', 'reset', 'carryforward']);
            $table->decimal('days', 8, 2);
            $table->decimal('balance_before', 8, 2);
            $table->decimal('balance_after', 8, 2);
            $table->date('period_month')->comment('The accrual month');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_accrual_transactions');
    }
};
