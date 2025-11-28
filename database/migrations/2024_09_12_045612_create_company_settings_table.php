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
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('companyName');
            $table->string('contactPerson')->nullable();
            $table->string('address')->nullable();
            $table->string('country');
            $table->string('city');
            $table->string('state');
            $table->string('postalCode');
            $table->string('email');
            $table->string('phoneNumber')->nullable();
            $table->string('mobileNumber')->nullable();
            $table->string('fax')->nullable();
            $table->string('websiteUrl')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};
