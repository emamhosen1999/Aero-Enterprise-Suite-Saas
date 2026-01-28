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
        Schema::create('partial_registrations', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique()->index();
            $table->string('token', 64)->unique()->index();
            $table->string('step', 50);
            $table->json('data');
            $table->timestamp('expires_at')->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partial_registrations');
    }
};
