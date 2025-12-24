<?php

namespace Aero\Platform\Services;

use Exception;
use Illuminate\Support\Facades\Log;
use Twilio\Rest\Client as TwilioClient;
use Aws\Sns\SnsClient;
use Aws\Exception\AwsException;

/**
 * Dual SMS Provider Service with Automatic Failover
 * 
 * Supports Twilio (primary) and AWS SNS (fallback) with automatic retry logic.
 * Implements production-ready error handling and logging.
 */
class SmsService
{
    protected ?TwilioClient $twilioClient = null;
    protected ?SnsClient $snsClient = null;
    protected string $primaryProvider;
    protected string $fallbackProvider;
    
    public function __construct()
    {
        $this->primaryProvider = config('services.sms.primary_provider', 'twilio');
        $this->fallbackProvider = config('services.sms.fallback_provider', 'sns');
        
        $this->initializeTwilio();
        $this->initializeSns();
    }
    
    /**
     * Send SMS with automatic failover
     *
     * @param string $to Phone number in E.164 format (+1234567890)
     * @param string $message SMS message content
     * @return array ['success' => bool, 'provider' => string, 'message_id' => string|null]
     */
    public function send(string $to, string $message): array
    {
        // Validate phone number format
        if (!$this->isValidPhoneNumber($to)) {
            Log::error('Invalid phone number format', ['phone' => $to]);
            return [
                'success' => false,
                'provider' => null,
                'error' => 'Invalid phone number format. Must be E.164 format (+1234567890)',
            ];
        }
        
        // Try primary provider first
        $result = $this->sendWithProvider($to, $message, $this->primaryProvider);
        
        if ($result['success']) {
            return $result;
        }
        
        // Fallback to secondary provider
        Log::warning('Primary SMS provider failed, trying fallback', [
            'primary' => $this->primaryProvider,
            'fallback' => $this->fallbackProvider,
            'error' => $result['error'] ?? 'Unknown error',
        ]);
        
        $fallbackResult = $this->sendWithProvider($to, $message, $this->fallbackProvider);
        
        if (!$fallbackResult['success']) {
            Log::error('Both SMS providers failed', [
                'phone' => $to,
                'primary_error' => $result['error'] ?? 'Unknown',
                'fallback_error' => $fallbackResult['error'] ?? 'Unknown',
            ]);
        }
        
        return $fallbackResult;
    }
    
    /**
     * Send SMS using specific provider
     *
     * @param string $to
     * @param string $message
     * @param string $provider 'twilio' or 'sns'
     * @return array
     */
    protected function sendWithProvider(string $to, string $message, string $provider): array
    {
        try {
            if ($provider === 'twilio') {
                return $this->sendViaTwilio($to, $message);
            } elseif ($provider === 'sns') {
                return $this->sendViaSns($to, $message);
            }
            
            return [
                'success' => false,
                'provider' => null,
                'error' => "Unknown provider: {$provider}",
            ];
        } catch (Exception $e) {
            Log::error("SMS send failed via {$provider}", [
                'phone' => $to,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'provider' => $provider,
                'error' => $e->getMessage(),
            ];
        }
    }
    
    /**
     * Send SMS via Twilio
     */
    protected function sendViaTwilio(string $to, string $message): array
    {
        if (!$this->twilioClient) {
            return [
                'success' => false,
                'provider' => 'twilio',
                'error' => 'Twilio client not initialized',
            ];
        }
        
        $twilioMessage = $this->twilioClient->messages->create(
            $to,
            [
                'from' => config('services.twilio.phone_number'),
                'body' => $message,
            ]
        );
        
        Log::info('SMS sent via Twilio', [
            'phone' => $to,
            'message_id' => $twilioMessage->sid,
        ]);
        
        return [
            'success' => true,
            'provider' => 'twilio',
            'message_id' => $twilioMessage->sid,
        ];
    }
    
    /**
     * Send SMS via AWS SNS
     */
    protected function sendViaSns(string $to, string $message): array
    {
        if (!$this->snsClient) {
            return [
                'success' => false,
                'provider' => 'sns',
                'error' => 'AWS SNS client not initialized',
            ];
        }
        
        $result = $this->snsClient->publish([
            'PhoneNumber' => $to,
            'Message' => $message,
        ]);
        
        Log::info('SMS sent via AWS SNS', [
            'phone' => $to,
            'message_id' => $result['MessageId'],
        ]);
        
        return [
            'success' => true,
            'provider' => 'sns',
            'message_id' => $result['MessageId'],
        ];
    }
    
    /**
     * Validate phone number format (E.164)
     */
    protected function isValidPhoneNumber(string $phone): bool
    {
        return preg_match('/^\+[1-9]\d{1,14}$/', $phone);
    }
    
    /**
     * Initialize Twilio client
     */
    protected function initializeTwilio(): void
    {
        $sid = config('services.twilio.sid');
        $token = config('services.twilio.token');
        
        if ($sid && $token) {
            try {
                $this->twilioClient = new TwilioClient($sid, $token);
            } catch (Exception $e) {
                Log::error('Failed to initialize Twilio client', ['error' => $e->getMessage()]);
            }
        }
    }
    
    /**
     * Initialize AWS SNS client
     */
    protected function initializeSns(): void
    {
        $key = config('services.aws.key');
        $secret = config('services.aws.secret');
        $region = config('services.aws.region', 'us-east-1');
        
        if ($key && $secret) {
            try {
                $this->snsClient = new SnsClient([
                    'version' => 'latest',
                    'region' => $region,
                    'credentials' => [
                        'key' => $key,
                        'secret' => $secret,
                    ],
                ]);
            } catch (AwsException $e) {
                Log::error('Failed to initialize AWS SNS client', ['error' => $e->getMessage()]);
            }
        }
    }
    
    /**
     * Send bulk SMS messages
     *
     * @param array $recipients [['phone' => '+1234567890', 'message' => 'text'], ...]
     * @return array ['total' => int, 'successful' => int, 'failed' => int, 'results' => array]
     */
    public function sendBulk(array $recipients): array
    {
        $results = [];
        $successful = 0;
        $failed = 0;
        
        foreach ($recipients as $recipient) {
            $result = $this->send($recipient['phone'], $recipient['message']);
            
            if ($result['success']) {
                $successful++;
            } else {
                $failed++;
            }
            
            $results[] = array_merge($result, ['phone' => $recipient['phone']]);
        }
        
        return [
            'total' => count($recipients),
            'successful' => $successful,
            'failed' => $failed,
            'results' => $results,
        ];
    }
}
