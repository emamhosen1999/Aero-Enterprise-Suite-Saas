<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('designations', function (Blueprint $table) {
            $table->id();
            $table->string('title')->comment('Designation title');
            $table->foreignId('department_id')->constrained('departments')->comment('Foreign key to departments table');
            $table->unsignedBigInteger('parent_id')->nullable()->comment('For hierarchical structure, if applicable');
            $table->boolean('is_active')->default(true)->comment('Designation active status');
            $table->timestamps();
            $table->softDeletes();

            $table->index(['department_id', 'is_active'], 'designation_dept_active_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('designations');
    }
};
