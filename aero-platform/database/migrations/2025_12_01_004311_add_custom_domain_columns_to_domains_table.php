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
        Schema::table('domains', function (Blueprint $table) {
            $table->boolean('is_custom')->default(false)->after('is_primary');
            $table->enum('status', ['pending', 'verified', 'active', 'failed'])->default('active')->after('is_custom');
            $table->string('dns_verification_code')->nullable()->after('status');
            $table->enum('ssl_status', ['pending', 'provisioning', 'active', 'failed'])->nullable()->after('dns_verification_code');
            $table->timestamp('verified_at')->nullable()->after('ssl_status');
            $table->text('verification_errors')->nullable()->after('verified_at');
        });

        // Update existing domains to have 'active' status (they're already working)
        DB::table('domains')->whereNull('is_custom')->update([
            'is_custom' => false,
            'status' => 'active',
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('domains', function (Blueprint $table) {
            $table->dropColumn([
                'is_custom',
                'status',
                'dns_verification_code',
                'ssl_status',
                'verified_at',
                'verification_errors',
            ]);
        });
    }
};
