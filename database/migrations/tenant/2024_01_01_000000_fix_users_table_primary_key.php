<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, check if users table exists and if id column needs to be fixed
        if (Schema::hasTable('users')) {
            // Check if the primary key already exists
            $indexes = DB::select("SHOW INDEX FROM users WHERE Key_name = 'PRIMARY'");

            if (empty($indexes)) {
                // Check if there are any records in the users table
                $userCount = DB::table('users')->count();

                if ($userCount > 0) {
                    // If there are users, we need to ensure id values are unique and set them properly
                    // First, check if there are any NULL or duplicate id values
                    $nullIds = DB::table('users')->whereNull('id')->count();
                    $duplicateIds = DB::select('
                        SELECT id, COUNT(*) as count 
                        FROM users 
                        WHERE id IS NOT NULL 
                        GROUP BY id 
                        HAVING COUNT(*) > 1
                    ');

                    if ($nullIds > 0 || ! empty($duplicateIds)) {
                        // Fix the id values - assign sequential IDs starting from 1
                        $users = DB::table('users')->get();
                        $counter = 1;
                        foreach ($users as $user) {
                            DB::table('users')
                                ->where('id', $user->id)
                                ->update(['id' => $counter]);
                            $counter++;
                        }
                    }
                }

                // Now modify the id column to be AUTO_INCREMENT and PRIMARY KEY
                DB::statement('ALTER TABLE users MODIFY COLUMN id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY');

                // If there are existing records, set the AUTO_INCREMENT value to start after the highest existing ID
                if ($userCount > 0) {
                    $maxId = DB::table('users')->max('id');
                    DB::statement('ALTER TABLE users AUTO_INCREMENT = '.($maxId + 1));
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // We don't want to reverse this as it would break the database structure
        // If needed, this would require dropping the primary key and auto_increment
        // But that's not recommended for a production system
    }
};
