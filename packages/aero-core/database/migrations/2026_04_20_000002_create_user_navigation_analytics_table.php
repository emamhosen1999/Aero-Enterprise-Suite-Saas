<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_navigation_analytics', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('nav_path', 255);             // e.g. /hrm/employees
            $table->string('nav_name', 100)->nullable(); // e.g. Employees
            $table->string('module', 50)->nullable();    // e.g. hrm
            $table->unsignedInteger('visit_count')->default(1);
            $table->timestamp('last_visited_at')->nullable();
            $table->timestamp('first_visited_at')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['user_id', 'nav_path']);
            $table->index(['user_id', 'visit_count']);
            $table->index(['user_id', 'last_visited_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_navigation_analytics');
    }
};
