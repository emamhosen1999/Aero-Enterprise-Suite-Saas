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
        Schema::create('project_task_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('predecessor_id')->constrained('project_tasks')->onDelete('cascade');
            $table->foreignId('successor_id')->constrained('project_tasks')->onDelete('cascade');
            $table->enum('dependency_type', ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'])->default('finish_to_start');
            $table->integer('lag_days')->default(0);
            $table->timestamps();

            $table->unique(['predecessor_id', 'successor_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_task_dependencies');
    }
};
