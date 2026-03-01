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
        // Only run if table exists
        if (! Schema::hasTable('onboardings')) {
            return;
        }

        Schema::table('onboardings', function (Blueprint $table) {
            if (! Schema::hasColumn('onboardings', 'actual_completion_date')) {
                $table->timestamp('actual_completion_date')->nullable()->after('expected_completion_date');
            }
            if (! Schema::hasColumn('onboardings', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('onboardings', function (Blueprint $table) {
            $table->dropColumn(['actual_completion_date', 'deleted_at']);
        });
    }
};
