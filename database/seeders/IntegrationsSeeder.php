<?php

namespace Database\Seeders;

use App\Models\Integrations\ApiKey;
use App\Models\Integrations\Connector;
use App\Models\Integrations\Webhook;
use App\Models\Integrations\WebhookLog;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class IntegrationsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {
            // Create sample connectors
            $this->seedConnectors();
            
            // Create sample webhooks
            $this->seedWebhooks();
            
            // Create sample API keys
            $this->seedApiKeys();
            
            // Create sample webhook logs
            $this->seedWebhookLogs();
        });
    }

    /**
     * Seed sample third-party connectors
     */
    private function seedConnectors(): void
    {
        Connector::create([
            'name' => 'Stripe Payment Gateway',
            'type' => 'payment',
            'status' => 'active',
            'config' => [
                'api_key' => 'sk_test_***',
                'webhook_secret' => 'whsec_***',
                'currency' => 'USD',
            ],
            'last_sync_at' => now()->subHours(2),
        ]);

        Connector::create([
            'name' => 'SendGrid Email Service',
            'type' => 'email',
            'status' => 'active',
            'config' => [
                'api_key' => 'SG.***',
                'from_email' => 'noreply@example.com',
                'from_name' => 'Aero ERP',
            ],
            'last_sync_at' => now()->subHours(1),
        ]);

        Connector::create([
            'name' => 'Slack Notifications',
            'type' => 'messaging',
            'status' => 'active',
            'config' => [
                'webhook_url' => 'https://hooks.slack.com/services/***',
                'channel' => '#general',
            ],
            'last_sync_at' => now()->subMinutes(30),
        ]);

        Connector::create([
            'name' => 'Zoom Video Conferencing',
            'type' => 'video',
            'status' => 'inactive',
            'config' => [
                'client_id' => '***',
                'client_secret' => '***',
                'redirect_uri' => 'https://app.example.com/integrations/zoom/callback',
            ],
        ]);

        Connector::create([
            'name' => 'AWS S3 Storage',
            'type' => 'storage',
            'status' => 'active',
            'config' => [
                'bucket' => 'aero-erp-storage',
                'region' => 'us-east-1',
                'access_key_id' => '***',
                'secret_access_key' => '***',
            ],
            'last_sync_at' => now()->subMinutes(15),
        ]);
    }

    /**
     * Seed sample webhooks
     */
    private function seedWebhooks(): void
    {
        $connector = Connector::where('name', 'Stripe Payment Gateway')->first();

        Webhook::create([
            'connector_id' => $connector->id,
            'name' => 'Payment Success Notification',
            'url' => 'https://api.example.com/webhooks/payment-success',
            'method' => 'POST',
            'headers' => [
                'Authorization' => 'Bearer ***',
                'Content-Type' => 'application/json',
            ],
            'status' => 'active',
            'success_count' => 45,
            'failure_count' => 2,
            'last_triggered_at' => now()->subHours(3),
        ]);

        $slackConnector = Connector::where('name', 'Slack Notifications')->first();

        Webhook::create([
            'connector_id' => $slackConnector->id,
            'name' => 'New User Registration Alert',
            'url' => 'https://hooks.slack.com/services/***/notifications',
            'method' => 'POST',
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'status' => 'active',
            'success_count' => 128,
            'failure_count' => 1,
            'last_triggered_at' => now()->subMinutes(45),
        ]);

        Webhook::create([
            'connector_id' => $slackConnector->id,
            'name' => 'Daily Report Webhook',
            'url' => 'https://hooks.slack.com/services/***/reports',
            'method' => 'POST',
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'status' => 'inactive',
            'success_count' => 30,
            'failure_count' => 5,
            'last_triggered_at' => now()->subDays(2),
        ]);
    }

    /**
     * Seed sample API keys
     */
    private function seedApiKeys(): void
    {
        ApiKey::create([
            'name' => 'Mobile App API Key',
            'key' => Str::random(64),
            'scopes' => ['read:users', 'write:users', 'read:orders'],
            'status' => 'active',
            'expires_at' => now()->addYear(),
            'last_used_at' => now()->subHours(2),
        ]);

        ApiKey::create([
            'name' => 'Third-Party Integration',
            'key' => Str::random(64),
            'scopes' => ['read:products', 'read:inventory'],
            'status' => 'active',
            'expires_at' => now()->addMonths(6),
            'last_used_at' => now()->subDays(1),
        ]);

        ApiKey::create([
            'name' => 'Analytics Dashboard',
            'key' => Str::random(64),
            'scopes' => ['read:analytics', 'read:reports'],
            'status' => 'active',
            'expires_at' => now()->addMonths(3),
            'last_used_at' => now()->subHours(5),
        ]);

        ApiKey::create([
            'name' => 'Deprecated Legacy API',
            'key' => Str::random(64),
            'scopes' => ['read:users'],
            'status' => 'inactive',
            'expires_at' => now()->subMonths(1),
            'last_used_at' => now()->subMonths(2),
        ]);
    }

    /**
     * Seed sample webhook logs
     */
    private function seedWebhookLogs(): void
    {
        $webhook = Webhook::where('name', 'Payment Success Notification')->first();

        // Successful webhook log
        WebhookLog::create([
            'webhook_id' => $webhook->id,
            'status' => 'success',
            'payload' => [
                'event' => 'payment.success',
                'payment_id' => 'pay_123456',
                'amount' => 99.99,
                'currency' => 'USD',
            ],
            'response' => [
                'status' => 200,
                'message' => 'Webhook received successfully',
            ],
            'response_time' => 245,
            'triggered_at' => now()->subHours(3),
        ]);

        // Failed webhook log
        WebhookLog::create([
            'webhook_id' => $webhook->id,
            'status' => 'failed',
            'payload' => [
                'event' => 'payment.failed',
                'payment_id' => 'pay_789012',
                'error' => 'Insufficient funds',
            ],
            'response' => [
                'status' => 500,
                'error' => 'Internal server error',
            ],
            'response_time' => 1250,
            'triggered_at' => now()->subHours(6),
        ]);

        $slackWebhook = Webhook::where('name', 'New User Registration Alert')->first();

        // Recent successful log
        WebhookLog::create([
            'webhook_id' => $slackWebhook->id,
            'status' => 'success',
            'payload' => [
                'text' => 'New user registered: john@example.com',
                'channel' => '#general',
            ],
            'response' => [
                'ok' => true,
            ],
            'response_time' => 180,
            'triggered_at' => now()->subMinutes(45),
        ]);
    }
}
