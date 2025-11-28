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
        Schema::create('project_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('category');
            $table->string('budget_type');
            $table->decimal('initial_budget', 12, 2);
            $table->decimal('allocated_budget', 12, 2);
            $table->decimal('spent_amount', 12, 2)->default(0);
            $table->decimal('remaining_budget', 12, 2);
            $table->string('currency', 3)->default('USD');
            $table->text('description')->nullable();
            $table->date('start_date');
            $table->date('end_date');
            $table->string('status', 50)->default('draft');

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_budgets');
    }
};
