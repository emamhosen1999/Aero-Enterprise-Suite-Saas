<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix duplicate RFI numbers before adding unique constraint
        $duplicates = DB::select("
            SELECT number, COUNT(*) as count 
            FROM daily_works 
            GROUP BY number 
            HAVING count > 1
        ");
        
        foreach ($duplicates as $duplicate) {
            $records = DB::table('daily_works')
                ->where('number', $duplicate->number)
                ->orderBy('id')
                ->get();
            
            // Keep first, rename rest with suffix
            $suffix = 1;
            foreach ($records as $index => $record) {
                if ($index > 0) {
                    DB::table('daily_works')
                        ->where('id', $record->id)
                        ->update(['number' => $duplicate->number . '-DUP' . $suffix]);
                    $suffix++;
                }
            }
        }
        
        Schema::table('daily_works', function (Blueprint $table) {
            // Add unique constraint on RFI number
            $table->unique('number');
            
            // Add performance indexes
            $table->index(['status', 'date']);
            $table->index(['incharge', 'date']);
            $table->index(['assigned', 'status']);
            $table->index('type');
            
            // Add soft deletes
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('daily_works', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropIndex(['status', 'date']);
            $table->dropIndex(['incharge', 'date']);
            $table->dropIndex(['assigned', 'status']);
            $table->dropIndex(['type']);
            $table->dropUnique(['number']);
        });
    }
};
