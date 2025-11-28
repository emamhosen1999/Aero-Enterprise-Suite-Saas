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
        Schema::create('project_budget_expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('budget_id')->constrained('project_budgets')->onDelete('cascade');
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('category');
            $table->text('description');
            $table->decimal('amount', 10, 2);
            $table->string('currency', 3)->default('USD');
            $table->date('expense_date');
            $table->string('receipt_number')->nullable();
            $table->string('vendor')->nullable();
            $table->boolean('approved')->default(false);
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->string('receipt_file_path')->nullable();
            $table->timestamps();

            $table->index(['budget_id', 'expense_date']);
            $table->index(['project_id', 'expense_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_budget_expenses');
    }
};
