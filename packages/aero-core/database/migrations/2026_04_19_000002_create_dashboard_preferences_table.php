<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dashboard_preferences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('dashboard_key', 50)->default('core');
            $table->json('layout')->nullable();
            $table->json('hidden_widgets')->nullable();
            $table->json('collapsed_sections')->nullable();
            $table->timestamps();

            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->unique(['user_id', 'dashboard_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dashboard_preferences');
    }
};
