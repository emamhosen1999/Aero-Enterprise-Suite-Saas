<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds tier and visibility columns to plans table for better plan categorization
     * and public/private visibility control.
     */
    public function up(): void
    {
        if (Schema::hasColumn('plans', 'tier')) {
            return;
        }

        Schema::table('plans', function (Blueprint $table) {
            // Plan tier for categorization (free, starter, professional, enterprise)
            $table->string('tier')->default('starter')->after('slug');
            
            // Visibility control (public, private, hidden)
            // - public: Shown on pricing pages and available for self-signup
            // - private: Only available via admin assignment or invite
            // - hidden: Not shown anywhere, for internal/legacy plans
            $table->string('visibility')->default('public')->after('is_featured');
            
            // Index for common queries
            $table->index('tier');
            $table->index('visibility');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropIndex(['tier']);
            $table->dropIndex(['visibility']);
            $table->dropColumn(['tier', 'visibility']);
        });
    }
};
