<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * HRM Attendance Enhancement Migration
 *
 * Enhances the existing attendances table with:
 * - Status tracking (present, absent, late, half_day)
 * - Calculated work hours
 * - IP address logging for anti-buddy-punching
 * - Regularization workflow
 *
 * Note: Leave system uses existing `leave_settings` and `leaves` tables.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ============================================================
        // ENHANCE EXISTING ATTENDANCES TABLE
        // ============================================================
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                // Add status tracking if not exists
                if (! Schema::hasColumn('attendances', 'status')) {
                    $table->enum('status', ['present', 'absent', 'late', 'half_day', 'on_leave', 'holiday', 'weekend'])
                        ->default('present')
                        ->after('punchout_location');
                }

                // Add calculated work hours
                if (! Schema::hasColumn('attendances', 'total_hours')) {
                    $table->decimal('total_hours', 5, 2)
                        ->nullable()
                        ->after('status')
                        ->comment('Calculated work hours');
                }

                // Add IP addresses for security (prevent buddy punching)
                if (! Schema::hasColumn('attendances', 'punchin_ip')) {
                    $table->string('punchin_ip', 45)->nullable()->after('punchin_location');
                }
                if (! Schema::hasColumn('attendances', 'punchout_ip')) {
                    $table->string('punchout_ip', 45)->nullable()->after('punchout_location');
                }

                // Add attendance type reference
                if (! Schema::hasColumn('attendances', 'attendance_type_id')) {
                    $table->foreignId('attendance_type_id')
                        ->nullable()
                        ->after('user_id')
                        ->constrained('attendance_types')
                        ->nullOnDelete();
                }

                // Add notes/remarks
                if (! Schema::hasColumn('attendances', 'notes')) {
                    $table->text('notes')->nullable();
                }

                // Add soft deletes if not exists
                if (! Schema::hasColumn('attendances', 'deleted_at')) {
                    $table->softDeletes();
                }
            });

            // Add indexes for performance
            Schema::table('attendances', function (Blueprint $table) {
                $sm = Schema::getConnection()->getDoctrineSchemaManager();
                $indexes = $sm->listTableIndexes('attendances');

                if (! isset($indexes['attendances_date_index'])) {
                    $table->index('date', 'attendances_date_index');
                }
                if (! isset($indexes['attendances_user_date_index'])) {
                    $table->index(['user_id', 'date'], 'attendances_user_date_index');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                $columns = [
                    'status',
                    'total_hours',
                    'punchin_ip',
                    'punchout_ip',
                    'attendance_type_id',
                    'notes',
                    'deleted_at',
                ];

                foreach ($columns as $column) {
                    if (Schema::hasColumn('attendances', $column)) {
                        if ($column === 'attendance_type_id') {
                            $table->dropForeign(['attendance_type_id']);
                        }
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
