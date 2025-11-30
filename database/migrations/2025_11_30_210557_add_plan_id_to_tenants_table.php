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
        Schema::table('tenants', function (Blueprint $table) {
            // Add plan_id as nullable UUID foreign key
            // Nullable because tenant might be on trial without a plan
            $table->uuid('plan_id')->nullable()->after('phone');

            // Foreign key constraint to plans table
            $table->foreign('plan_id')
                ->references('id')
                ->on('plans')
                ->onDelete('set null'); // Don't delete tenant if plan is deleted

            // Index for efficient plan-based queries
            $table->index('plan_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropForeign(['plan_id']);
            $table->dropIndex(['plan_id']);
            $table->dropColumn('plan_id');
        });
    }
};
