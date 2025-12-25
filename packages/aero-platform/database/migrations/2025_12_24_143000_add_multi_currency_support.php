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
        // Add currency fields to plans table
        if (!Schema::hasColumn('plans', 'base_currency')) {
            Schema::table('plans', function (Blueprint $table) {
                $table->string('base_currency', 3)->default('USD')->after('yearly_price');
                $table->json('regional_pricing')->nullable()->after('base_currency'); // {"EUR": 89, "GBP": 79, etc.}
            });
        }

        // Add currency and notification branding to tenants table
        if (!Schema::hasColumn('tenants', 'currency')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->string('currency', 3)->default('USD')->after('trial_ends_at');
                $table->decimal('exchange_rate_at_signup', 10, 6)->default(1.000000)->after('currency');
            });
        }

        // Add notification branding columns (separate check in case currency already exists)
        if (!Schema::hasColumn('tenants', 'notification_branding')) {
            Schema::table('tenants', function (Blueprint $table) {
                $table->json('notification_branding')->nullable()->after('data'); // Custom branding for notifications
                $table->boolean('sms_notifications_enabled')->default(false)->after('notification_branding');
                $table->string('notification_phone', 20)->nullable()->after('sms_notifications_enabled');
            });
        }

        // Add currency to subscriptions table
        if (!Schema::hasColumn('subscriptions', 'currency')) {
            Schema::table('subscriptions', function (Blueprint $table) {
                $table->string('currency', 3)->default('USD')->after('quantity');
                $table->decimal('exchange_rate_at_purchase', 10, 6)->default(1.000000)->after('currency');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['base_currency', 'regional_pricing']);
        });

        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'currency',
                'exchange_rate_at_signup',
                'notification_branding',
                'sms_notifications_enabled',
                'notification_phone',
            ]);
        });

        Schema::table('subscriptions', function (Blueprint $table) {
            $table->dropColumn(['currency', 'exchange_rate_at_purchase']);
        });
    }
};
