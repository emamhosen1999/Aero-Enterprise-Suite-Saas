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
        Schema::create('project_resources', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('role');
            $table->decimal('allocation_percentage', 5, 2);
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('hourly_rate', 10, 2)->nullable();
            $table->decimal('cost_per_hour', 10, 2)->nullable();
            $table->enum('availability_status', ['available', 'partially_available', 'busy', 'unavailable'])->default('available');
            $table->json('skills')->nullable();
            $table->text('notes')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();

            $table->unique(['project_id', 'user_id']);
            $table->index(['project_id', 'start_date', 'end_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('project_resources');
    }
};
