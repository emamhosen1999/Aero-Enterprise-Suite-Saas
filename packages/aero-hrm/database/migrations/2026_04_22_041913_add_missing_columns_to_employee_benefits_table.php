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
        Schema::table('employee_benefits', function (Blueprint $table) {
            $table->decimal('cost_to_employee', 10, 2)->nullable()->after('coverage_level');
            $table->text('notes')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employee_benefits', function (Blueprint $table) {
            $table->dropColumn(['cost_to_employee', 'notes']);
        });
    }
};
