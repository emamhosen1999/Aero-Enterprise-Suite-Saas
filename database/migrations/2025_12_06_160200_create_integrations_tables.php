<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates tables for the Integrations module including:
     * - Connectors (third-party service connections)
     * - Webhooks (outgoing webhook configurations)
     * - Webhook Logs (webhook execution history)
     * - API Keys (secure API access tokens)
     */
    public function up(): void
    {
        // Connectors table
        Schema::create('integrations_connectors', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('Connector display name');
            $table->string('type', 100)->comment('Connector type: slack, zapier, custom, etc.');
            $table->text('description')->nullable();
            $table->json('config')->comment('Connection configuration (credentials, endpoints)');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_sync_at')->nullable()->comment('Last successful sync timestamp');
            $table->string('status', 50)->default('active')->comment('Connection status: active, error, disabled');
            $table->timestamps();
            $table->softDeletes();

            $table->index('type');
            $table->index('is_active');
            $table->index(['is_active', 'status']);
        });

        // Webhooks table
        Schema::create('integrations_webhooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('connector_id')->nullable()->constrained('integrations_connectors')->onDelete('cascade');
            $table->string('name')->comment('Webhook display name');
            $table->string('url', 500)->comment('Webhook endpoint URL');
            $table->string('event', 100)->comment('Event trigger: user.created, order.placed, etc.');
            $table->enum('method', ['GET', 'POST', 'PUT', 'DELETE'])->default('POST');
            $table->json('headers')->nullable()->comment('Custom HTTP headers');
            $table->string('secret')->nullable()->comment('Webhook signing secret');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_triggered_at')->nullable();
            $table->integer('success_count')->default(0);
            $table->integer('failure_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('connector_id');
            $table->index('event');
            $table->index('is_active');
            $table->index(['is_active', 'event']);
        });

        // Webhook logs table
        Schema::create('integrations_webhook_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('webhook_id')->constrained('integrations_webhooks')->onDelete('cascade');
            $table->json('payload')->nullable()->comment('Sent payload');
            $table->json('response')->nullable()->comment('Received response');
            $table->integer('status_code')->nullable()->comment('HTTP status code');
            $table->boolean('success')->default(false);
            $table->text('error_message')->nullable();
            $table->timestamps();

            $table->index('webhook_id');
            $table->index('success');
            $table->index('created_at');
            $table->index(['webhook_id', 'success']);
        });

        // API Keys table
        Schema::create('integrations_api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('landlord_users')->onDelete('cascade');
            $table->string('name')->comment('API key display name');
            $table->string('key', 128)->unique()->comment('Hashed API key');
            $table->json('scopes')->comment('Allowed scopes: ["read:users", "write:orders"]');
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('key');
            $table->index('is_active');
            $table->index(['is_active', 'expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('integrations_api_keys');
        Schema::dropIfExists('integrations_webhook_logs');
        Schema::dropIfExists('integrations_webhooks');
        Schema::dropIfExists('integrations_connectors');
    }
};
