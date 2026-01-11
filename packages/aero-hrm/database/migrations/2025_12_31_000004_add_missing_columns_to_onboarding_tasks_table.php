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
        if (!Schema::hasTable('onboarding_tasks')) {
            return;
        }

        Schema::table('onboarding_tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('onboarding_tasks', 'completed_date')) {
                $table->timestamp('completed_date')->nullable()->after('due_date');
            }
            if (!Schema::hasColumn('onboarding_tasks', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('onboarding_tasks', function (Blueprint $table) {
            $table->dropColumn(['completed_date', 'deleted_at']);
        });
    }
};

