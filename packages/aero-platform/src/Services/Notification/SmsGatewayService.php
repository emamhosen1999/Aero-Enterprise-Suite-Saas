<?php

namespace Aero\Platform\Services\Notification;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class SmsGatewayService
{
    protected string $defaultProvider;

    protected array $providers = [
        'twilio' => 'sendViaTwilio',
        'bulksmsbd' => 'sendViaBulkSmsBd',
        'elitbuzz' => 'sendViaElitBuzz',
        'ssl_wireless' => 'sendViaSslWireless',
        'log' => 'sendViaLog',
    ];

    public function __construct()
    {
        $this->defaultProvider = config('services.sms.default', 'log');
    }

    /**
     * Send SMS message.
     */
    public function send(string $to, string $message, ?string $provider = null): array
    {
        $provider = $provider ?? $this->defaultProvider;

        if (! isset($this->providers[$provider])) {
            throw new RuntimeException("Invalid SMS provider: {$provider}");
        }

        $method = $this->providers[$provider];

        try {
            return $this->$method($to, $message);
        } catch (\Exception $e) {
            Log::error("SMS send failed via {$provider}", [
                'to' => $to,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Send SMS via Twilio.
     */
    protected function sendViaTwilio(string $to, string $message): array
    {
        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        $from = config('services.twilio.from');

        if (! $sid || ! $token || ! $from) {
            throw new RuntimeException('Twilio credentials not configured');
        }

        $response = Http::withBasicAuth($sid, $token)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To' => $to,
                'From' => $from,
                'Body' => $message,
            ]);

        if ($response->failed()) {
            $error = $response->json('message', 'Unknown error');

            throw new RuntimeException("Twilio error: {$error}");
        }

        return [
            'success' => true,
            'provider' => 'twilio',
            'message_id' => $response->json('sid'),
            'status' => $response->json('status'),
        ];
    }

    /**
     * Send SMS via BulkSMS BD.
     */
    protected function sendViaBulkSmsBd(string $to, string $message): array
    {
        $apiKey = config('services.bulksmsbd.api_key');
        $senderId = config('services.bulksmsbd.sender_id');

        if (! $apiKey || ! $senderId) {
            throw new RuntimeException('BulkSMS BD credentials not configured');
        }

        // Normalize Bangladesh phone number
        $to = $this->normalizePhoneNumber($to, '880');

        $response = Http::get('http://bulksmsbd.net/api/smsapi', [
            'api_key' => $apiKey,
            'senderid' => $senderId,
            'number' => $to,
            'message' => $message,
            'type' => 'text',
        ]);

        $data = $response->json();

        if (isset($data['response_code']) && $data['response_code'] != 202) {
            throw new RuntimeException('BulkSMS BD error: '.($data['error_message'] ?? 'Unknown error'));
        }

        return [
            'success' => true,
            'provider' => 'bulksmsbd',
            'message_id' => $data['response_code'] ?? null,
            'status' => 'sent',
        ];
    }

    /**
     * Send SMS via ElitBuzz.
     */
    protected function sendViaElitBuzz(string $to, string $message): array
    {
        $username = config('services.elitbuzz.username');
        $password = config('services.elitbuzz.password');
        $senderId = config('services.elitbuzz.sender_id');

        if (! $username || ! $password || ! $senderId) {
            throw new RuntimeException('ElitBuzz credentials not configured');
        }

        // Normalize Bangladesh phone number
        $to = $this->normalizePhoneNumber($to, '880');

        $response = Http::get('https://msg.elitbuzz-bd.com/smsapi', [
            'api_key' => $password,
            'type' => 'text',
            'contacts' => $to,
            'senderid' => $senderId,
            'msg' => $message,
        ]);

        $result = $response->body();

        // ElitBuzz returns a simple string response
        if (str_contains(strtolower($result), 'error') || str_contains(strtolower($result), 'failed')) {
            throw new RuntimeException("ElitBuzz error: {$result}");
        }

        return [
            'success' => true,
            'provider' => 'elitbuzz',
            'message_id' => $result,
            'status' => 'sent',
        ];
    }

    /**
     * Send SMS via SSL Wireless.
     */
    protected function sendViaSslWireless(string $to, string $message): array
    {
        $username = config('services.ssl_wireless.username');
        $password = config('services.ssl_wireless.password');
        $sid = config('services.ssl_wireless.sid');

        if (! $username || ! $password || ! $sid) {
            throw new RuntimeException('SSL Wireless credentials not configured');
        }

        // Normalize Bangladesh phone number
        $to = $this->normalizePhoneNumber($to, '880');

        $response = Http::post('https://smsplus.sslwireless.com/api/v3/send-sms', [
            'api_token' => $password,
            'sid' => $sid,
            'msisdn' => $to,
            'sms' => $message,
            'csms_id' => uniqid('sms_'),
        ]);

        $data = $response->json();

        if (! isset($data['status']) || $data['status'] !== 'SUCCESS') {
            throw new RuntimeException('SSL Wireless error: '.($data['status_message'] ?? 'Unknown error'));
        }

        return [
            'success' => true,
            'provider' => 'ssl_wireless',
            'message_id' => $data['smsinfo'][0]['sms_id'] ?? null,
            'status' => 'sent',
        ];
    }

    /**
     * Log SMS instead of sending (for development).
     */
    protected function sendViaLog(string $to, string $message): array
    {
        Log::channel('sms')->info('SMS Message', [
            'to' => $to,
            'message' => $message,
            'timestamp' => now()->toIso8601String(),
        ]);

        return [
            'success' => true,
            'provider' => 'log',
            'message_id' => 'log_'.uniqid(),
            'status' => 'logged',
        ];
    }

    /**
     * Normalize phone number.
     */
    protected function normalizePhoneNumber(string $number, string $countryCode): string
    {
        // Remove all non-numeric characters
        $number = preg_replace('/[^0-9]/', '', $number);

        // Handle different formats
        if (str_starts_with($number, '00')) {
            $number = substr($number, 2);
        } elseif (str_starts_with($number, '+')) {
            $number = substr($number, 1);
        } elseif (str_starts_with($number, '0')) {
            $number = $countryCode.substr($number, 1);
        } elseif (! str_starts_with($number, $countryCode)) {
            $number = $countryCode.$number;
        }

        return $number;
    }

    /**
     * Get available SMS providers.
     */
    public function getProviders(): array
    {
        return array_keys($this->providers);
    }

    /**
     * Check if provider is configured.
     */
    public function isProviderConfigured(string $provider): bool
    {
        return match ($provider) {
            'twilio' => (bool) (config('services.twilio.sid') && config('services.twilio.token')),
            'bulksmsbd' => (bool) config('services.bulksmsbd.api_key'),
            'elitbuzz' => (bool) (config('services.elitbuzz.username') && config('services.elitbuzz.password')),
            'ssl_wireless' => (bool) (config('services.ssl_wireless.username') && config('services.ssl_wireless.password')),
            'log' => true,
            default => false,
        };
    }

    /**
     * Get the configured providers status.
     */
    public function getProvidersStatus(): array
    {
        $status = [];

        foreach ($this->providers as $provider => $method) {
            $status[$provider] = [
                'configured' => $this->isProviderConfigured($provider),
                'is_default' => $provider === $this->defaultProvider,
            ];
        }

        return $status;
    }
}
