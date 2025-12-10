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
        Schema::create('user_invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->json('roles')->nullable();
            $table->json('metadata')->nullable(); // Additional data (department, designation, etc.)
            $table->unsignedBigInteger('invited_by');
            $table->timestamp('expires_at');
            $table->timestamp('accepted_at')->nullable();
            $table->ipAddress('invited_from_ip')->nullable();
            $table->timestamps();
            
            $table->foreign('invited_by')->references('id')->on('users')->onDelete('cascade');
            $table->index(['token', 'expires_at']);
            $table->index('email');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_invitations');
    }
};
