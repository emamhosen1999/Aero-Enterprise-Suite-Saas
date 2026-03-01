<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds module_codes column to store which Composer-installed modules are included in each plan.
     * This is populated with module codes (e.g., ['hrm', 'crm', 'finance']) that reference
     * modules discovered from vendor/aero/* packages via ModuleDiscoveryService.
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->json('module_codes')->nullable()->after('limits')
                ->comment('Array of module codes included in this plan (e.g., ["hrm", "crm"])');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn('module_codes');
        });
    }
};
