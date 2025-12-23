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
        Schema::table('tenants', function (Blueprint $table) {
            // Archived metadata (for retention tracking)
            $table->timestamp('archived_at')->nullable()->after('deleted_at');
            $table->unsignedBigInteger('archived_by')->nullable()->after('archived_at');
            $table->string('archived_reason', 500)->nullable()->after('archived_by');
            
            // Restored metadata (for audit trail)
            $table->timestamp('restored_at')->nullable()->after('archived_reason');
            $table->unsignedBigInteger('restored_by')->nullable()->after('restored_at');

            // Indexes for performance
            $table->index('archived_at');
            $table->index(['deleted_at', 'archived_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropIndex(['deleted_at', 'archived_at']);
            $table->dropIndex(['archived_at']);
            
            $table->dropColumn([
                'archived_at',
                'archived_by',
                'archived_reason',
                'restored_at',
                'restored_by',
            ]);
        });
    }
};
