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
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Department name
            $table->string('code')->unique()->nullable(); // Department code (ISO standard identifier)
            $table->text('description')->nullable(); // Department description
            $table->unsignedBigInteger('parent_id')->nullable(); // For hierarchical structure
            $table->string('manager_id')->nullable(); // Department manager/head
            $table->string('location')->nullable(); // Physical location
            $table->boolean('is_active')->default(true); // Department status
            $table->date('established_date')->nullable(); // When department was established
            $table->timestamps(); // Created at and updated at columns
            $table->softDeletes(); // Soft delete capability

            // Foreign key constraint for parent department
            $table->foreign('parent_id')
                ->references('id')
                ->on('departments')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
