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
        Schema::table('holidays', function (Blueprint $table) {
            // Add new industry-standard columns only if they don't exist
            if (! Schema::hasColumn('holidays', 'description')) {
                $table->text('description')->nullable()->after('title');
            }
            if (! Schema::hasColumn('holidays', 'type')) {
                $table->enum('type', ['public', 'religious', 'national', 'company', 'optional'])
                    ->default('company')->after('to_date');
            }
            if (! Schema::hasColumn('holidays', 'is_recurring')) {
                $table->boolean('is_recurring')->default(false)->after('type');
            }
            if (! Schema::hasColumn('holidays', 'recurrence_pattern')) {
                $table->string('recurrence_pattern')->nullable()->after('is_recurring');
            }
            if (! Schema::hasColumn('holidays', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('recurrence_pattern');
            }
            if (! Schema::hasColumn('holidays', 'created_by')) {
                $table->unsignedBigInteger('created_by')->nullable()->after('is_active');
                $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            }
            if (! Schema::hasColumn('holidays', 'updated_by')) {
                $table->unsignedBigInteger('updated_by')->nullable()->after('created_by');
                $table->foreign('updated_by')->references('id')->on('users')->onDelete('set null');
            }

            // Remove old action column if it exists
            if (Schema::hasColumn('holidays', 'action')) {
                $table->dropColumn('action');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('holidays', function (Blueprint $table) {
            // Drop foreign keys first if they exist
            if (Schema::hasColumn('holidays', 'created_by')) {
                $table->dropForeign(['created_by']);
            }
            if (Schema::hasColumn('holidays', 'updated_by')) {
                $table->dropForeign(['updated_by']);
            }

            // Drop new columns if they exist
            $columnsToRemove = [];
            if (Schema::hasColumn('holidays', 'description')) {
                $columnsToRemove[] = 'description';
            }
            if (Schema::hasColumn('holidays', 'type')) {
                $columnsToRemove[] = 'type';
            }
            if (Schema::hasColumn('holidays', 'is_recurring')) {
                $columnsToRemove[] = 'is_recurring';
            }
            if (Schema::hasColumn('holidays', 'recurrence_pattern')) {
                $columnsToRemove[] = 'recurrence_pattern';
            }
            if (Schema::hasColumn('holidays', 'is_active')) {
                $columnsToRemove[] = 'is_active';
            }
            if (Schema::hasColumn('holidays', 'created_by')) {
                $columnsToRemove[] = 'created_by';
            }
            if (Schema::hasColumn('holidays', 'updated_by')) {
                $columnsToRemove[] = 'updated_by';
            }

            if (! empty($columnsToRemove)) {
                $table->dropColumn($columnsToRemove);
            }

            // Add back old action column if needed
            if (! Schema::hasColumn('holidays', 'action')) {
                $table->string('action')->nullable();
            }
        });
    }
};
