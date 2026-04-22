<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leave_accrual_rules', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->foreignId('leave_type_id')->constrained('leave_settings')->cascadeOnDelete();
            $table->string('name');
            $table->enum('accrual_frequency', ['monthly', 'bi-weekly', 'weekly', 'annually']);
            $table->decimal('accrual_rate', 8, 2)->comment('Days accrued per period');
            $table->decimal('max_balance', 8, 2)->nullable()->comment('Maximum days cap');
            $table->unsignedInteger('min_service_months')->default(0)->comment('Eligibility threshold in months');
            $table->boolean('is_active')->default(true);
            $table->boolean('carry_forward')->default(false);
            $table->decimal('max_carry_forward_days', 8, 2)->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_accrual_rules');
    }
};
