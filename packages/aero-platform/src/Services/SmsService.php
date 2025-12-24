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
 * 
 * Enhanced Features:
 * - Template-based messaging with variable substitution
 * - Queue support for background sending
 * - Retry logic with exponential backoff
 * - Rate limiting to prevent API abuse
 * - Bulk sending with progress tracking
 */
class SmsService
{
    protected ?TwilioClient $twilioClient = null;
    protected ?SnsClient $snsClient = null;
    protected string $primaryProvider;
    protected string $fallbackProvider;
    
    protected bool $shouldQueue = false;
    protected ?string $queue = null;
    protected ?int $delay = null;
    protected int $maxRetries = 3;
    protected array $templateVariables = [];
    protected ?string $templateName = null;
    
    // Rate limiting
    protected static array $rateLimitCache = [];
    protected int $maxPerMinute = 30; // Max SMS per minute per number
    
    public function __construct()
    {
        $this->primaryProvider = config('services.sms.primary_provider', 'twilio');
        $this->fallbackProvider = config('services.sms.fallback_provider', 'sns');
        
        $this->initializeTwilio();
        $this->initializeSns();
    }
    
    /**
     * Create a new instance (fluent builder pattern)
     */
    public static function make(): static
    {
        return new static;
    }
    
    /**
     * Queue the SMS for background sending
     */
    public function queue(?string $queueName = null, ?int $delaySeconds = null): static
    {
        $this->shouldQueue = true;
        $this->queue = $queueName;
        $this->delay = $delaySeconds;
        
        return $this;
    }
    
    /**
     * Set maximum retry attempts
     */
    public function retry(int $maxRetries): static
    {
        $this->maxRetries = $maxRetries;
        
        return $this;
    }
    
    /**
     * Use a pre-defined SMS template
     */
    public function template(string $templateName, array $variables = []): static
    {
        $this->templateName = $templateName;
        $this->templateVariables = $variables;
        
        return $this;
    }
    
    /**
     * Set template variables
     */
    public function with(array $variables): static
    {
        $this->templateVariables = array_merge($this->templateVariables, $variables);
        
        return $this;
    }
    
    /**
     * Set rate limit (SMS per minute)
     */
    public function rateLimit(int $maxPerMinute): static
    {
        $this->maxPerMinute = $maxPerMinute;
        
        return $this;
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
        // Render template if specified
        if ($this->templateName) {
            $message = $this->renderTemplate($this->templateName, $this->templateVariables);
        }
        
        // Check rate limit
        if (!$this->checkRateLimit($to)) {
            Log::warning('SMS rate limit exceeded', ['phone' => $to]);
            return [
                'success' => false,
                'provider' => null,
                'error' => 'Rate limit exceeded. Please try again later.',
            ];
        }
        
        // Queue if requested
        if ($this->shouldQueue) {
            return $this->queueSms($to, $message);
        }
        
        // Validate phone number format
        if (!$this->isValidPhoneNumber($to)) {
            Log::error('Invalid phone number format', ['phone' => $to]);
            return [
                'success' => false,
                'provider' => null,
                'error' => 'Invalid phone number format. Must be E.164 format (+1234567890)',
            ];
        }
        
        // Truncate message to 160 characters (SMS standard)
        if (strlen($message) > 160) {
            Log::warning('SMS message truncated', ['length' => strlen($message)]);
            $message = substr($message, 0, 157) . '...';
        }
        
        // Try sending with retry logic
        return $this->sendWithRetry($to, $message);
    }
    
    /**
     * Send SMS with automatic retry and exponential backoff
     */
    protected function sendWithRetry(string $to, string $message, int $attempt = 1): array
    {
        // Try primary provider first
        $result = $this->sendWithProvider($to, $message, $this->primaryProvider);
        
        if ($result['success']) {
            $this->recordSent($to);
            return $result;
        }
        
        // Retry logic for transient failures
        if ($attempt < $this->maxRetries) {
            $delay = pow(2, $attempt); // Exponential backoff: 2, 4, 8 seconds
            sleep($delay);
            
            Log::info("Retrying SMS send (attempt {$attempt}/{$this->maxRetries})", [
                'phone' => $to,
                'delay' => $delay,
            ]);
            
            return $this->sendWithRetry($to, $message, $attempt + 1);
        }
        
        // Fallback to secondary provider after all retries
        Log::warning('Primary SMS provider failed after retries, trying fallback', [
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
        } else {
            $this->recordSent($to);
        }
        
        return $fallbackResult;
    }
    
    /**
     * Queue SMS for background sending
     */
    protected function queueSms(string $to, string $message): array
    {
        try {
            $job = new \Aero\Platform\Jobs\SendSmsJob([
                'to' => $to,
                'message' => $message,
                'maxRetries' => $this->maxRetries,
            ]);
            
            if ($this->delay) {
                $job->delay($this->delay);
            }
            
            if ($this->queue) {
                dispatch($job)->onQueue($this->queue);
            } else {
                dispatch($job);
            }
            
            return [
                'success' => true,
                'provider' => 'queued',
                'message' => 'SMS queued for sending',
            ];
        } catch (\Throwable $e) {
            Log::error('Failed to queue SMS', [
                'phone' => $to,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'provider' => null,
                'error' => 'Failed to queue SMS: ' . $e->getMessage(),
            ];
        }
    }
    
    /**
     * Render SMS template with variables
     */
    protected function renderTemplate(string $templateName, array $variables): string
    {
        // Common SMS templates
        $templates = [
            'quota_warning' => '{app_name}: Your {quota_type} usage is at {percentage}%. Upgrade to continue.',
            'trial_expiry' => '{app_name}: Your trial ends in {days} days. Upgrade now: {upgrade_url}',
            'payment_failed' => '{app_name}: Payment failed. Update payment method: {billing_url}',
            'subscription_cancelled' => '{app_name}: Subscription cancelled. Access ends {date}.',
            'welcome' => 'Welcome to {app_name}! Get started: {login_url}',
            'verification_code' => '{app_name}: Your verification code is {code}',
        ];
        
        $template = $templates[$templateName] ?? '{message}';
        
        // Add default variables
        $defaults = [
            'app_name' => config('app.name'),
            'app_url' => config('app.url'),
        ];
        
        $variables = array_merge($defaults, $variables);
        
        // Replace variables in template
        foreach ($variables as $key => $value) {
            $template = str_replace('{' . $key . '}', $value, $template);
        }
        
        return $template;
    }
    
    /**
     * Check rate limit for phone number
     */
    protected function checkRateLimit(string $phone): bool
    {
        $key = 'sms_rate_' . md5($phone);
        $now = time();
        
        // Clean old entries
        if (!isset(self::$rateLimitCache[$key])) {
            self::$rateLimitCache[$key] = [];
        }
        
        self::$rateLimitCache[$key] = array_filter(
            self::$rateLimitCache[$key],
            fn($timestamp) => $timestamp > $now - 60
        );
        
        // Check if limit exceeded
        if (count(self::$rateLimitCache[$key]) >= $this->maxPerMinute) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Record sent SMS for rate limiting
     */
    protected function recordSent(string $phone): void
    {
        $key = 'sms_rate_' . md5($phone);
        
        if (!isset(self::$rateLimitCache[$key])) {
            self::$rateLimitCache[$key] = [];
        }
        
        self::$rateLimitCache[$key][] = time();
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
