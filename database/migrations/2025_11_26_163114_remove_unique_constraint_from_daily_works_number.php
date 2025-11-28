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
        Schema::table('daily_works', function (Blueprint $table) {
            // Drop the unique constraint on number column
            // This allows resubmissions to update existing RFI numbers
            $table->dropUnique(['number']);
            
            // Add a regular index instead for performance
            $table->index('number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_works', function (Blueprint $table) {
            $table->dropIndex(['number']);
            $table->unique('number');
        });
    }
};
