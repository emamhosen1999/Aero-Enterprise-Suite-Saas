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
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->default('default')->unique();
            $table->string('company_name')->default('Your Company');
            $table->string('legal_name')->nullable();
            $table->string('tagline')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('support_email')->nullable();
            $table->string('support_phone')->nullable();
            $table->string('website_url')->nullable();
            $table->string('timezone')->nullable();
            $table->text('address_line1')->nullable();
            $table->string('address_line2')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country')->nullable();
            $table->json('branding')->nullable();
            $table->json('metadata')->nullable();
            $table->json('email_settings')->nullable();
            $table->json('sms_settings')->nullable();
            $table->json('notification_channels')->nullable();
            $table->json('integrations')->nullable();
            $table->json('advanced')->nullable();
            $table->json('organization')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
    }
};
