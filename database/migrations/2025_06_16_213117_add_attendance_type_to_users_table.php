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
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'attendance_type_id')) {
                $table->unsignedBigInteger('attendance_type_id')->nullable()->after('email_verified_at');
                $table->foreign('attendance_type_id')->references('id')->on('attendance_types')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['attendance_type_id']);
            $table->dropColumn(['attendance_type_id']);
        });
    }
};
