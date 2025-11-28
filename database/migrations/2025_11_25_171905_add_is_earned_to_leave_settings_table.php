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
        Schema::table('leave_settings', function (Blueprint $table) {
            $table->boolean('is_earned')->default(false)->after('earned_leave');
            $table->index('is_earned');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leave_settings', function (Blueprint $table) {
            $table->dropIndex(['is_earned']);
            $table->dropColumn('is_earned');
        });
    }
};
