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
        if (! Schema::hasTable('departments')) {
            return;
        }

        Schema::table('departments', function (Blueprint $table) {
            if (! Schema::hasColumn('departments', 'code')) {
                $table->string('code', 50)->nullable()->unique()->after('name');
            }
            if (! Schema::hasColumn('departments', 'location')) {
                $table->string('location')->nullable()->after('manager_id');
            }
            if (! Schema::hasColumn('departments', 'established_date')) {
                $table->date('established_date')->nullable()->after('location');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'code')) {
                $table->dropColumn('code');
            }
            if (Schema::hasColumn('departments', 'location')) {
                $table->dropColumn('location');
            }
            if (Schema::hasColumn('departments', 'established_date')) {
                $table->dropColumn('established_date');
            }
        });
    }
};
