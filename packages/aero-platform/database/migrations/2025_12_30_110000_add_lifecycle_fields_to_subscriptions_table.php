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
        Schema::table('subscriptions', function (Blueprint $table) {
            // Upgrade tracking (use foreignUuid for UUID foreign keys)
            if (! Schema::hasColumn('subscriptions', 'upgraded_from_plan_id')) {
                $table->foreignUuid('upgraded_from_plan_id')->nullable()->after('plan_id')->constrained('plans')->nullOnDelete();
            }
            if (! Schema::hasColumn('subscriptions', 'upgraded_at')) {
                $table->timestamp('upgraded_at')->nullable()->after('upgraded_from_plan_id');
            }

            // Downgrade tracking (use foreignUuid for UUID foreign keys)
            if (! Schema::hasColumn('subscriptions', 'downgraded_from_plan_id')) {
                $table->foreignUuid('downgraded_from_plan_id')->nullable()->after('upgraded_at')->constrained('plans')->nullOnDelete();
            }
            if (! Schema::hasColumn('subscriptions', 'pending_plan_id')) {
                $table->foreignUuid('pending_plan_id')->nullable()->after('downgraded_from_plan_id')->constrained('plans')->nullOnDelete();
            }
            if (! Schema::hasColumn('subscriptions', 'downgraded_at')) {
                $table->timestamp('downgraded_at')->nullable()->after('pending_plan_id');
            }
            if (! Schema::hasColumn('subscriptions', 'downgrade_scheduled_at')) {
                $table->timestamp('downgrade_scheduled_at')->nullable()->after('downgraded_at');
            }

            // Grace period tracking
            if (! Schema::hasColumn('subscriptions', 'grace_period_ends_at')) {
                $table->timestamp('grace_period_ends_at')->nullable()->after('downgrade_scheduled_at');
            }

            // Billing cycle tracking
            if (! Schema::hasColumn('subscriptions', 'current_period_start')) {
                $table->timestamp('current_period_start')->nullable()->after('grace_period_ends_at');
            }

            // Indexes for efficient queries (only add when we create the column)
            if (! Schema::hasColumn('subscriptions', 'pending_plan_id')) {
                $table->index('pending_plan_id');
            }
            if (! Schema::hasColumn('subscriptions', 'downgrade_scheduled_at')) {
                $table->index('downgrade_scheduled_at');
            }
            if (! Schema::hasColumn('subscriptions', 'grace_period_ends_at')) {
                $table->index('grace_period_ends_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropForeign(['upgraded_from_plan_id']);
            $table->dropForeign(['downgraded_from_plan_id']);
            $table->dropForeign(['pending_plan_id']);
            
            $table->dropIndex(['pending_plan_id']);
            $table->dropIndex(['downgrade_scheduled_at']);
            $table->dropIndex(['grace_period_ends_at']);
            
            $table->dropColumn([
                'upgraded_from_plan_id',
                'upgraded_at',
                'downgraded_from_plan_id',
                'pending_plan_id',
                'downgraded_at',
                'downgrade_scheduled_at',
                'grace_period_ends_at',
                'current_period_start',
            ]);
        });
    }
};
