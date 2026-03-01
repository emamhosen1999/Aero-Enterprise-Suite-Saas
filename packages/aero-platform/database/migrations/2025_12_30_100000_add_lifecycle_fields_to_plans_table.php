<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds lifecycle management fields to plans table:
     * - plan_type: explicit plan classification (trial/free/paid/custom)
     * - grace_days: grace period before suspension on payment failure
     * - downgrade_policy: behavior on plan downgrade (immediate/end_of_period)
     * - cancellation_policy: when cancellation takes effect (immediate/end_of_period)
     * - supports_custom_duration: whether plan allows custom billing cycles
     */
    public function up(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            // Plan type classification
            $table->string('plan_type')->default('paid')->after('tier')
                ->comment('Plan type: trial, free, paid, custom');

            // Lifecycle policies
            $table->integer('grace_days')->default(0)->after('trial_days')
                ->comment('Grace period days before suspension on payment failure');

            $table->string('downgrade_policy')->default('end_of_period')->after('grace_days')
                ->comment('Downgrade behavior: immediate, end_of_period');

            $table->string('cancellation_policy')->default('end_of_period')->after('downgrade_policy')
                ->comment('Cancellation behavior: immediate, end_of_period');

            // Custom billing support
            $table->boolean('supports_custom_duration')->default(false)->after('duration_in_months')
                ->comment('Whether plan allows custom billing cycles');

            // Indexes for filtering
            $table->index('plan_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropIndex(['plan_type']);
            $table->dropColumn([
                'plan_type',
                'grace_days',
                'downgrade_policy',
                'cancellation_policy',
                'supports_custom_duration',
            ]);
        });
    }
};
