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
        Schema::table('users', function (Blueprint $table) {
            $table->string('oauth_provider')->nullable()->after('password');
            $table->string('oauth_provider_id')->nullable()->after('oauth_provider');
            $table->string('oauth_token')->nullable()->after('oauth_provider_id');
            $table->string('oauth_refresh_token')->nullable()->after('oauth_token');
            $table->timestamp('oauth_token_expires_at')->nullable()->after('oauth_refresh_token');
            $table->string('avatar_url')->nullable()->after('oauth_token_expires_at');

            // Index for faster lookups
            $table->index(['oauth_provider', 'oauth_provider_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex(['oauth_provider', 'oauth_provider_id']);
            $table->dropColumn([
                'oauth_provider',
                'oauth_provider_id',
                'oauth_token',
                'oauth_refresh_token',
                'oauth_token_expires_at',
                'avatar_url',
            ]);
        });
    }
};
