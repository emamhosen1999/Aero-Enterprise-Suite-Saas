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
        Schema::table('designations', function (Blueprint $table) {
            if (! Schema::hasColumn('designations', 'hierarchy_level')) {
                $table->unsignedInteger('hierarchy_level')->default(1)->after('parent_id')
                    ->comment('Hierarchy level: 1 = highest (CEO, Director), higher numbers = lower positions');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('designations', function (Blueprint $table) {
            $table->dropColumn('hierarchy_level');
        });
    }
};
