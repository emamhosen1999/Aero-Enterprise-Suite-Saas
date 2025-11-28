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
        Schema::table('leaves', function (Blueprint $table) {
            // Approval workflow fields
            $table->json('approval_chain')->nullable()->after('status');
            $table->integer('current_approval_level')->default(0)->after('approval_chain');
            $table->timestamp('approved_at')->nullable()->after('current_approval_level');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null')->after('approved_at');
            $table->text('rejection_reason')->nullable()->after('approved_by');
            $table->foreignId('rejected_by')->nullable()->constrained('users')->onDelete('set null')->after('rejection_reason');
            $table->timestamp('submitted_at')->nullable()->after('rejected_by');

            // Index for better query performance (no composite index due to MySQL key length limits)
            $table->index('current_approval_level');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['rejected_by']);
            $table->dropIndex(['status']);
            $table->dropIndex(['current_approval_level']);
            $table->dropColumn([
                'approval_chain',
                'current_approval_level',
                'approved_at',
                'approved_by',
                'rejection_reason',
                'rejected_by',
                'submitted_at',
            ]);
        });
    }
};
