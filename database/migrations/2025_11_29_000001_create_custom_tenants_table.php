<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {
            $table->string('id')->primary(); // UUID primary key for Stancl compatibility
            $table->string('name'); // Company or individual name
            $table->string('type'); // 'company' or 'individual'
            $table->string('subdomain')->unique();
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('subscription_plan')->nullable(); // monthly/yearly
            $table->json('modules')->nullable(); // selected modules
            $table->date('trial_ends_at')->nullable();
            $table->date('subscription_ends_at')->nullable();
            $table->json('data')->nullable(); // Stancl's data column for additional attributes
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
