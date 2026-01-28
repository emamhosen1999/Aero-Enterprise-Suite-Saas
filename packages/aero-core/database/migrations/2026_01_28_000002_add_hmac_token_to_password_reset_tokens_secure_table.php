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
        Schema::table('password_reset_tokens_secure', function (Blueprint $table) {
            $table->string('hmac_token', 255)->nullable()->after('token');
            $table->index('hmac_token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('password_reset_tokens_secure', function (Blueprint $table) {
            $table->dropIndex(['hmac_token']);
            $table->dropColumn('hmac_token');
        });
    }
};