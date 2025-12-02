<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the plan_module pivot table linking subscription plans to modules.
     * Platform admins configure which modules are included in each plan.
     */
    public function up(): void
    {
        Schema::create('plan_module', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('plan_id')->constrained()->onDelete('cascade');
            $table->foreignId('module_id')->constrained()->onDelete('cascade');
            $table->json('limits')->nullable()->comment('Module-specific limits per plan');
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->unique(['plan_id', 'module_id']);
            $table->index('plan_id');
            $table->index('module_id');
            $table->index(['plan_id', 'is_enabled']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_module');
    }
};
