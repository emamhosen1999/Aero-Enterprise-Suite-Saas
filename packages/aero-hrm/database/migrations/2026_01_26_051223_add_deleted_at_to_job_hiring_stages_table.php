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
        Schema::table('job_hiring_stages', function (Blueprint $table) {
            if (! Schema::hasColumn('job_hiring_stages', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_hiring_stages', function (Blueprint $table) {
            if (Schema::hasColumn('job_hiring_stages', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
