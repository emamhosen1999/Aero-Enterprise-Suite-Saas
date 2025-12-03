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
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->default('platform')->unique();
            $table->string('site_name')->default(config('app.name'));
            $table->string('legal_name')->nullable();
            $table->string('tagline')->nullable();
            $table->string('support_email')->nullable();
            $table->string('support_phone')->nullable();
            $table->string('marketing_url')->nullable();
            $table->string('status_page_url')->nullable();
            $table->json('branding')->nullable();
            $table->json('metadata')->nullable();
            $table->json('email_settings')->nullable();
            $table->json('sms_settings')->nullable();
            $table->json('legal')->nullable();
            $table->json('integrations')->nullable();
            $table->json('admin_preferences')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
