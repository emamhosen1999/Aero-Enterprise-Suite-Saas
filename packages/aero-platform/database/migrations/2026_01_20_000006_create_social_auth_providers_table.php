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
        // Social Auth linked accounts (for landlord users and registration)
        Schema::create('social_auth_accounts', function (Blueprint $table) {
            $table->id();
            $table->string('provider'); // google, linkedin, facebook, github
            $table->string('provider_user_id');
            $table->string('email')->nullable();
            $table->string('name')->nullable();
            $table->string('avatar')->nullable();
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('token_expires_at')->nullable();
            $table->json('provider_data')->nullable();

            // Polymorphic relationship - can link to landlord_users or be used for registration
            $table->nullableMorphs('authenticatable');

            // For pending registrations (before tenant is created)
            $table->string('pending_registration_token')->nullable()->unique();
            $table->timestamp('pending_expires_at')->nullable();

            $table->timestamps();

            $table->unique(['provider', 'provider_user_id']);
            $table->index(['email']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_auth_accounts');
    }
};
