<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Convert departments table from MyISAM to InnoDB to support foreign key constraints
        DB::statement('ALTER TABLE departments ENGINE = InnoDB');

        // Also convert designations table if it's MyISAM
        $designationsEngine = DB::select("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'designations'");
        if (! empty($designationsEngine) && $designationsEngine[0]->ENGINE === 'MyISAM') {
            DB::statement('ALTER TABLE designations ENGINE = InnoDB');
        }

        // Convert attendance_types table if it's MyISAM
        $attendanceTypesEngine = DB::select("SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'attendance_types'");
        if (! empty($attendanceTypesEngine) && $attendanceTypesEngine[0]->ENGINE === 'MyISAM') {
            DB::statement('ALTER TABLE attendance_types ENGINE = InnoDB');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Convert back to MyISAM if needed (not recommended for production)
        // DB::statement('ALTER TABLE departments ENGINE = MyISAM');
        // DB::statement('ALTER TABLE designations ENGINE = MyISAM');
        // DB::statement('ALTER TABLE attendance_types ENGINE = MyISAM');
    }
};
