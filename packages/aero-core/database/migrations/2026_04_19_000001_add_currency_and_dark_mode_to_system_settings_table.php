<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->string('currency', 10)->nullable()->default('USD')->after('timezone');
            $table->boolean('default_dark_mode')->default(false)->after('currency');
        });
    }

    public function down(): void
    {
        Schema::table('system_settings', function (Blueprint $table) {
            $table->dropColumn(['currency', 'default_dark_mode']);
        });
    }
};
