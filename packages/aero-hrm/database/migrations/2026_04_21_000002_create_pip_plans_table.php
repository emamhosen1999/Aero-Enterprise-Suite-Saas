<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pip_plans')) {
            Schema::create('pip_plans', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('employee_id');
                $table->unsignedBigInteger('manager_id')->nullable();
                $table->string('title');
                $table->text('reason');
                $table->date('start_date');
                $table->date('end_date');
                $table->enum('status', ['draft', 'active', 'completed', 'extended', 'terminated'])->default('draft');
                $table->text('description')->nullable();
                $table->text('expected_outcomes')->nullable();
                $table->text('notes')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->timestamp('closed_at')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');

                $table->index('employee_id');
                $table->index('manager_id');
                $table->index('status');
                $table->index(['start_date', 'end_date']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pip_plans');
    }
};
