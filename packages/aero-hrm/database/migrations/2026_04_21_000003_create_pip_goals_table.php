<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('pip_goals')) {
            Schema::create('pip_goals', function (Blueprint $table) {
                $table->id();
                $table->foreignId('pip_plan_id')->constrained('pip_plans')->onDelete('cascade');
                $table->string('title');
                $table->text('description')->nullable();
                $table->date('target_date');
                $table->enum('status', ['pending', 'in_progress', 'achieved', 'missed'])->default('pending');
                $table->text('progress_notes')->nullable();
                $table->timestamps();

                $table->index('pip_plan_id');
                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('pip_goals');
    }
};
