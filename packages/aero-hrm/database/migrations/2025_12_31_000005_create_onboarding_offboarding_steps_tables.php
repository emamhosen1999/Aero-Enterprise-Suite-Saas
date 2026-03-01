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
        if (! Schema::hasTable('onboarding_steps')) {
            Schema::create('onboarding_steps', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->integer('order')->default(0);
                $table->boolean('active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['active', 'order']);
            });
        }

        if (! Schema::hasTable('offboardings')) {
            Schema::create('offboardings', function (Blueprint $table) {
                $table->id();
                $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
                $table->date('last_working_date');
                $table->enum('reason', ['resignation', 'termination', 'retirement', 'contract_end', 'other'])->default('resignation');
                $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'last_working_date']);
            });
        }

        if (! Schema::hasTable('offboarding_steps')) {
            Schema::create('offboarding_steps', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
                $table->integer('order')->default(0);
                $table->boolean('active')->default(true);
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['active', 'order']);
            });
        }

        if (! Schema::hasTable('offboarding_tasks')) {
            Schema::create('offboarding_tasks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('offboarding_id')->constrained('offboardings')->cascadeOnDelete();
                $table->string('task');
                $table->text('description')->nullable();
                $table->date('due_date')->nullable();
                $table->date('completed_date')->nullable();
                $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
                $table->enum('status', ['pending', 'in_progress', 'completed', 'cancelled'])->default('pending');
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['offboarding_id', 'status']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('offboarding_tasks');
        Schema::dropIfExists('offboarding_steps');
        Schema::dropIfExists('offboardings');
        Schema::dropIfExists('onboarding_steps');
    }
};
