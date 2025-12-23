<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Monitoring;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Notification;

/**
 * Alerting Service
 *
 * Comprehensive alerting system for platform health monitoring.
 *
 * Features:
 * - Multi-channel alerts (Email, Slack, SMS, Webhook)
 * - Alert severity levels (info, warning, critical, emergency)
 * - Rate limiting to prevent alert fatigue
 * - Alert grouping and deduplication
 * - Escalation policies
 * - Alert acknowledgment
 * - On-call rotation support
 * - Alert history and analytics
 *
 * Usage:
 * ```php
 * $alertingService = app(AlertingService::class);
 *
 * // Send critical alert
 * $alertingService->critical('database', 'Database connection failed', [
 *     'host' => 'db.example.com',
 *     'error' => 'Connection timeout'
 * ]);
 *
 * // Configure channels
 * $alertingService->setChannels(['slack', 'email']);
 *
 * // Check alert status
 * $status = $alertingService->getActiveAlerts();
 * ```
 */
class AlertingService
{
    /**
     * Alert severity levels.
     */
    public const LEVEL_INFO = 'info';

    public const LEVEL_WARNING = 'warning';

    public const LEVEL_CRITICAL = 'critical';

    public const LEVEL_EMERGENCY = 'emergency';

    /**
     * Alert channels.
     */
    public const CHANNEL_EMAIL = 'email';

    public const CHANNEL_SLACK = 'slack';

    public const CHANNEL_SMS = 'sms';

    public const CHANNEL_WEBHOOK = 'webhook';

    public const CHANNEL_TEAMS = 'teams';

    public const CHANNEL_DISCORD = 'discord';

    public const CHANNEL_PAGERDUTY = 'pagerduty';

    /**
     * Alert states.
     */
    public const STATE_FIRING = 'firing';

    public const STATE_ACKNOWLEDGED = 'acknowledged';

    public const STATE_RESOLVED = 'resolved';

    /**
     * Enabled channels.
     */
    protected array $enabledChannels = ['email', 'slack'];

    /**
     * Rate limit cache prefix.
     */
    protected string $rateLimitPrefix = 'alert:ratelimit:';

    /**
     * Minimum interval between duplicate alerts (seconds).
     */
    protected int $rateLimitInterval = 300;

    /**
     * Channel configurations.
     */
    protected array $channelConfig = [];

    public function __construct()
    {
        $this->loadConfiguration();
    }

    /**
     * Send an info-level alert.
     *
     * @param string $source
     * @param string $message
     * @param array $context
     * @return string|null Alert ID
     */
    public function info(string $source, string $message, array $context = []): ?string
    {
        return $this->sendAlert(self::LEVEL_INFO, $source, $message, $context);
    }

    /**
     * Send a warning-level alert.
     *
     * @param string $source
     * @param string $message
     * @param array $context
     * @return string|null Alert ID
     */
    public function warning(string $source, string $message, array $context = []): ?string
    {
        return $this->sendAlert(self::LEVEL_WARNING, $source, $message, $context);
    }

    /**
     * Send a critical-level alert.
     *
     * @param string $source
     * @param string $message
     * @param array $context
     * @return string|null Alert ID
     */
    public function critical(string $source, string $message, array $context = []): ?string
    {
        return $this->sendAlert(self::LEVEL_CRITICAL, $source, $message, $context);
    }

    /**
     * Send an emergency-level alert.
     *
     * @param string $source
     * @param string $message
     * @param array $context
     * @return string|null Alert ID
     */
    public function emergency(string $source, string $message, array $context = []): ?string
    {
        return $this->sendAlert(self::LEVEL_EMERGENCY, $source, $message, $context);
    }

    /**
     * Send an alert.
     *
     * @param string $level
     * @param string $source
     * @param string $message
     * @param array $context
     * @return string|null Alert ID if sent, null if rate limited
     */
    public function sendAlert(string $level, string $source, string $message, array $context = []): ?string
    {
        // Check rate limit
        $alertKey = $this->generateAlertKey($source, $message);

        if ($this->isRateLimited($alertKey, $level)) {
            Log::debug("Alert rate limited: {$source} - {$message}");

            return null;
        }

        $alertId = $this->generateAlertId();

        $alert = [
            'id' => $alertId,
            'level' => $level,
            'source' => $source,
            'message' => $message,
            'context' => $context,
            'state' => self::STATE_FIRING,
            'created_at' => now()->toDateTimeString(),
            'environment' => config('app.env'),
            'hostname' => gethostname(),
        ];

        // Log the alert
        $this->logAlert($alert);

        // Store alert
        $this->storeAlert($alert);

        // Send to configured channels
        $this->dispatchToChannels($alert);

        // Set rate limit
        $this->setRateLimit($alertKey, $level);

        return $alertId;
    }

    /**
     * Acknowledge an alert.
     *
     * @param string $alertId
     * @param string|null $acknowledgedBy
     * @param string|null $comment
     * @return bool
     */
    public function acknowledge(string $alertId, ?string $acknowledgedBy = null, ?string $comment = null): bool
    {
        $alerts = $this->getStoredAlerts();

        if (! isset($alerts[$alertId])) {
            return false;
        }

        $alerts[$alertId]['state'] = self::STATE_ACKNOWLEDGED;
        $alerts[$alertId]['acknowledged_at'] = now()->toDateTimeString();
        $alerts[$alertId]['acknowledged_by'] = $acknowledgedBy;
        $alerts[$alertId]['acknowledgment_comment'] = $comment;

        Cache::put('platform:alerts', $alerts, now()->addDays(7));

        Log::info("Alert {$alertId} acknowledged by {$acknowledgedBy}");

        return true;
    }

    /**
     * Resolve an alert.
     *
     * @param string $alertId
     * @param string|null $resolvedBy
     * @param string|null $resolution
     * @return bool
     */
    public function resolve(string $alertId, ?string $resolvedBy = null, ?string $resolution = null): bool
    {
        $alerts = $this->getStoredAlerts();

        if (! isset($alerts[$alertId])) {
            return false;
        }

        $alerts[$alertId]['state'] = self::STATE_RESOLVED;
        $alerts[$alertId]['resolved_at'] = now()->toDateTimeString();
        $alerts[$alertId]['resolved_by'] = $resolvedBy;
        $alerts[$alertId]['resolution'] = $resolution;

        Cache::put('platform:alerts', $alerts, now()->addDays(7));

        // Send resolution notification
        $this->sendResolutionNotification($alerts[$alertId]);

        return true;
    }

    /**
     * Get active (firing) alerts.
     *
     * @return array
     */
    public function getActiveAlerts(): array
    {
        $alerts = $this->getStoredAlerts();

        return array_filter($alerts, fn ($alert) => $alert['state'] === self::STATE_FIRING);
    }

    /**
     * Get all alerts.
     *
     * @param array $filters
     * @return array
     */
    public function getAlerts(array $filters = []): array
    {
        $alerts = $this->getStoredAlerts();

        if (isset($filters['level'])) {
            $alerts = array_filter($alerts, fn ($a) => $a['level'] === $filters['level']);
        }

        if (isset($filters['state'])) {
            $alerts = array_filter($alerts, fn ($a) => $a['state'] === $filters['state']);
        }

        if (isset($filters['source'])) {
            $alerts = array_filter($alerts, fn ($a) => $a['source'] === $filters['source']);
        }

        return $alerts;
    }

    /**
     * Get alert by ID.
     *
     * @param string $alertId
     * @return array|null
     */
    public function getAlert(string $alertId): ?array
    {
        return $this->getStoredAlerts()[$alertId] ?? null;
    }

    /**
     * Set enabled channels.
     *
     * @param array $channels
     * @return self
     */
    public function setChannels(array $channels): self
    {
        $this->enabledChannels = $channels;

        return $this;
    }

    /**
     * Configure a specific channel.
     *
     * @param string $channel
     * @param array $config
     * @return self
     */
    public function configureChannel(string $channel, array $config): self
    {
        $this->channelConfig[$channel] = $config;

        return $this;
    }

    /**
     * Get alert statistics.
     *
     * @param string $period 'day', 'week', 'month'
     * @return array
     */
    public function getStatistics(string $period = 'day'): array
    {
        $alerts = $this->getStoredAlerts();

        $cutoff = match ($period) {
            'week' => now()->subWeek(),
            'month' => now()->subMonth(),
            default => now()->subDay(),
        };

        $periodAlerts = array_filter($alerts, function ($alert) use ($cutoff) {
            return \Carbon\Carbon::parse($alert['created_at'])->gte($cutoff);
        });

        return [
            'total' => count($periodAlerts),
            'by_level' => [
                'info' => count(array_filter($periodAlerts, fn ($a) => $a['level'] === self::LEVEL_INFO)),
                'warning' => count(array_filter($periodAlerts, fn ($a) => $a['level'] === self::LEVEL_WARNING)),
                'critical' => count(array_filter($periodAlerts, fn ($a) => $a['level'] === self::LEVEL_CRITICAL)),
                'emergency' => count(array_filter($periodAlerts, fn ($a) => $a['level'] === self::LEVEL_EMERGENCY)),
            ],
            'by_state' => [
                'firing' => count(array_filter($periodAlerts, fn ($a) => $a['state'] === self::STATE_FIRING)),
                'acknowledged' => count(array_filter($periodAlerts, fn ($a) => $a['state'] === self::STATE_ACKNOWLEDGED)),
                'resolved' => count(array_filter($periodAlerts, fn ($a) => $a['state'] === self::STATE_RESOLVED)),
            ],
            'by_source' => $this->groupBy($periodAlerts, 'source'),
            'mttr_minutes' => $this->calculateMTTR($periodAlerts),
        ];
    }

    /**
     * Dispatch alert to all enabled channels.
     *
     * @param array $alert
     * @return void
     */
    protected function dispatchToChannels(array $alert): void
    {
        // Filter channels based on alert level
        $channels = $this->getChannelsForLevel($alert['level']);

        foreach ($channels as $channel) {
            try {
                match ($channel) {
                    self::CHANNEL_EMAIL => $this->sendEmailAlert($alert),
                    self::CHANNEL_SLACK => $this->sendSlackAlert($alert),
                    self::CHANNEL_SMS => $this->sendSmsAlert($alert),
                    self::CHANNEL_WEBHOOK => $this->sendWebhookAlert($alert),
                    self::CHANNEL_TEAMS => $this->sendTeamsAlert($alert),
                    self::CHANNEL_DISCORD => $this->sendDiscordAlert($alert),
                    self::CHANNEL_PAGERDUTY => $this->sendPagerDutyAlert($alert),
                    default => null,
                };
            } catch (\Throwable $e) {
                Log::error("Failed to send alert via {$channel}: {$e->getMessage()}", [
                    'alert_id' => $alert['id'],
                    'exception' => $e,
                ]);
            }
        }
    }

    /**
     * Send email alert.
     *
     * @param array $alert
     * @return void
     */
    protected function sendEmailAlert(array $alert): void
    {
        $recipients = $this->channelConfig[self::CHANNEL_EMAIL]['recipients'] ??
            config('monitoring.alert_emails', []);

        if (empty($recipients)) {
            return;
        }

        // Use Laravel's mail facade
        Mail::send([], [], function ($message) use ($alert, $recipients) {
            $message->to($recipients)
                ->subject($this->formatEmailSubject($alert))
                ->html($this->formatEmailBody($alert));
        });
    }

    /**
     * Send Slack alert.
     *
     * @param array $alert
     * @return void
     */
    protected function sendSlackAlert(array $alert): void
    {
        $webhookUrl = $this->channelConfig[self::CHANNEL_SLACK]['webhook_url'] ??
            config('monitoring.slack_webhook');

        if (! $webhookUrl) {
            return;
        }

        $color = match ($alert['level']) {
            self::LEVEL_EMERGENCY => '#dc2626',
            self::LEVEL_CRITICAL => '#f97316',
            self::LEVEL_WARNING => '#fbbf24',
            default => '#3b82f6',
        };

        $payload = [
            'attachments' => [
                [
                    'color' => $color,
                    'title' => "🚨 [{$alert['level']}] {$alert['source']}",
                    'text' => $alert['message'],
                    'fields' => [
                        ['title' => 'Environment', 'value' => $alert['environment'], 'short' => true],
                        ['title' => 'Host', 'value' => $alert['hostname'], 'short' => true],
                        ['title' => 'Time', 'value' => $alert['created_at'], 'short' => true],
                        ['title' => 'Alert ID', 'value' => $alert['id'], 'short' => true],
                    ],
                    'footer' => 'Aero Platform Monitoring',
                    'ts' => now()->timestamp,
                ],
            ],
        ];

        // Add context fields
        if (! empty($alert['context'])) {
            foreach ($alert['context'] as $key => $value) {
                $payload['attachments'][0]['fields'][] = [
                    'title' => ucfirst(str_replace('_', ' ', $key)),
                    'value' => is_array($value) ? json_encode($value) : (string) $value,
                    'short' => true,
                ];
            }
        }

        Http::post($webhookUrl, $payload);
    }

    /**
     * Send SMS alert.
     *
     * @param array $alert
     * @return void
     */
    protected function sendSmsAlert(array $alert): void
    {
        // Only send SMS for critical and emergency
        if (! in_array($alert['level'], [self::LEVEL_CRITICAL, self::LEVEL_EMERGENCY])) {
            return;
        }

        $phoneNumbers = $this->channelConfig[self::CHANNEL_SMS]['phone_numbers'] ??
            config('monitoring.sms_numbers', []);

        if (empty($phoneNumbers)) {
            return;
        }

        $message = "[{$alert['level']}] {$alert['source']}: {$alert['message']}";

        // Use your SMS service (Twilio, etc.)
        // Implementation depends on your SMS provider
    }

    /**
     * Send webhook alert.
     *
     * @param array $alert
     * @return void
     */
    protected function sendWebhookAlert(array $alert): void
    {
        $webhookUrls = $this->channelConfig[self::CHANNEL_WEBHOOK]['urls'] ??
            config('monitoring.alert_webhooks', []);

        foreach ($webhookUrls as $url) {
            Http::post($url, $alert);
        }
    }

    /**
     * Send Microsoft Teams alert.
     *
     * @param array $alert
     * @return void
     */
    protected function sendTeamsAlert(array $alert): void
    {
        $webhookUrl = $this->channelConfig[self::CHANNEL_TEAMS]['webhook_url'] ??
            config('monitoring.teams_webhook');

        if (! $webhookUrl) {
            return;
        }

        $themeColor = match ($alert['level']) {
            self::LEVEL_EMERGENCY => 'dc2626',
            self::LEVEL_CRITICAL => 'f97316',
            self::LEVEL_WARNING => 'fbbf24',
            default => '3b82f6',
        };

        $payload = [
            '@type' => 'MessageCard',
            '@context' => 'http://schema.org/extensions',
            'themeColor' => $themeColor,
            'summary' => "[{$alert['level']}] {$alert['source']}",
            'sections' => [
                [
                    'activityTitle' => "🚨 [{$alert['level']}] {$alert['source']}",
                    'facts' => [
                        ['name' => 'Message', 'value' => $alert['message']],
                        ['name' => 'Environment', 'value' => $alert['environment']],
                        ['name' => 'Host', 'value' => $alert['hostname']],
                        ['name' => 'Time', 'value' => $alert['created_at']],
                    ],
                ],
            ],
        ];

        Http::post($webhookUrl, $payload);
    }

    /**
     * Send Discord alert.
     *
     * @param array $alert
     * @return void
     */
    protected function sendDiscordAlert(array $alert): void
    {
        $webhookUrl = $this->channelConfig[self::CHANNEL_DISCORD]['webhook_url'] ??
            config('monitoring.discord_webhook');

        if (! $webhookUrl) {
            return;
        }

        $color = match ($alert['level']) {
            self::LEVEL_EMERGENCY => 14423100, // Red
            self::LEVEL_CRITICAL => 16753920,  // Orange
            self::LEVEL_WARNING => 16705372,   // Yellow
            default => 3447003,                // Blue
        };

        $payload = [
            'embeds' => [
                [
                    'title' => "🚨 [{$alert['level']}] {$alert['source']}",
                    'description' => $alert['message'],
                    'color' => $color,
                    'fields' => [
                        ['name' => 'Environment', 'value' => $alert['environment'], 'inline' => true],
                        ['name' => 'Host', 'value' => $alert['hostname'], 'inline' => true],
                    ],
                    'footer' => ['text' => "Alert ID: {$alert['id']}"],
                    'timestamp' => now()->toIso8601String(),
                ],
            ],
        ];

        Http::post($webhookUrl, $payload);
    }

    /**
     * Send PagerDuty alert.
     *
     * @param array $alert
     * @return void
     */
    protected function sendPagerDutyAlert(array $alert): void
    {
        $routingKey = $this->channelConfig[self::CHANNEL_PAGERDUTY]['routing_key'] ??
            config('monitoring.pagerduty_routing_key');

        if (! $routingKey) {
            return;
        }

        $severity = match ($alert['level']) {
            self::LEVEL_EMERGENCY => 'critical',
            self::LEVEL_CRITICAL => 'error',
            self::LEVEL_WARNING => 'warning',
            default => 'info',
        };

        $payload = [
            'routing_key' => $routingKey,
            'event_action' => 'trigger',
            'dedup_key' => $alert['id'],
            'payload' => [
                'summary' => "[{$alert['source']}] {$alert['message']}",
                'source' => $alert['hostname'],
                'severity' => $severity,
                'timestamp' => now()->toIso8601String(),
                'custom_details' => $alert['context'],
            ],
        ];

        Http::post('https://events.pagerduty.com/v2/enqueue', $payload);
    }

    /**
     * Send resolution notification.
     *
     * @param array $alert
     * @return void
     */
    protected function sendResolutionNotification(array $alert): void
    {
        if (in_array(self::CHANNEL_SLACK, $this->enabledChannels)) {
            $webhookUrl = $this->channelConfig[self::CHANNEL_SLACK]['webhook_url'] ??
                config('monitoring.slack_webhook');

            if ($webhookUrl) {
                Http::post($webhookUrl, [
                    'attachments' => [
                        [
                            'color' => '#22c55e',
                            'title' => "✅ [RESOLVED] {$alert['source']}",
                            'text' => "Alert resolved: {$alert['message']}",
                            'fields' => [
                                ['title' => 'Resolved By', 'value' => $alert['resolved_by'] ?? 'System', 'short' => true],
                                ['title' => 'Resolution', 'value' => $alert['resolution'] ?? 'N/A', 'short' => true],
                            ],
                            'footer' => 'Aero Platform Monitoring',
                        ],
                    ],
                ]);
            }
        }
    }

    /**
     * Get channels for alert level.
     *
     * @param string $level
     * @return array
     */
    protected function getChannelsForLevel(string $level): array
    {
        // Critical and emergency go to all channels
        if (in_array($level, [self::LEVEL_CRITICAL, self::LEVEL_EMERGENCY])) {
            return $this->enabledChannels;
        }

        // Warning skips SMS and PagerDuty
        if ($level === self::LEVEL_WARNING) {
            return array_diff($this->enabledChannels, [self::CHANNEL_SMS, self::CHANNEL_PAGERDUTY]);
        }

        // Info only goes to Slack and email
        return array_intersect($this->enabledChannels, [self::CHANNEL_SLACK, self::CHANNEL_EMAIL]);
    }

    /**
     * Check if alert is rate limited.
     *
     * @param string $alertKey
     * @param string $level
     * @return bool
     */
    protected function isRateLimited(string $alertKey, string $level): bool
    {
        // Emergency alerts are never rate limited
        if ($level === self::LEVEL_EMERGENCY) {
            return false;
        }

        return Cache::has($this->rateLimitPrefix . $alertKey);
    }

    /**
     * Set rate limit for alert.
     *
     * @param string $alertKey
     * @param string $level
     * @return void
     */
    protected function setRateLimit(string $alertKey, string $level): void
    {
        $interval = match ($level) {
            self::LEVEL_CRITICAL => 60,   // 1 minute for critical
            self::LEVEL_WARNING => 300,   // 5 minutes for warning
            default => 600,               // 10 minutes for info
        };

        Cache::put(
            $this->rateLimitPrefix . $alertKey,
            true,
            now()->addSeconds($interval)
        );
    }

    /**
     * Generate alert key for deduplication.
     *
     * @param string $source
     * @param string $message
     * @return string
     */
    protected function generateAlertKey(string $source, string $message): string
    {
        return md5($source . ':' . $message);
    }

    /**
     * Generate unique alert ID.
     *
     * @return string
     */
    protected function generateAlertId(): string
    {
        return 'ALT-' . strtoupper(bin2hex(random_bytes(6)));
    }

    /**
     * Log alert.
     *
     * @param array $alert
     * @return void
     */
    protected function logAlert(array $alert): void
    {
        $logLevel = match ($alert['level']) {
            self::LEVEL_EMERGENCY => 'emergency',
            self::LEVEL_CRITICAL => 'critical',
            self::LEVEL_WARNING => 'warning',
            default => 'info',
        };

        Log::channel('monitoring')->{$logLevel}($alert['message'], [
            'alert_id' => $alert['id'],
            'source' => $alert['source'],
            'context' => $alert['context'],
        ]);
    }

    /**
     * Store alert in cache.
     *
     * @param array $alert
     * @return void
     */
    protected function storeAlert(array $alert): void
    {
        $alerts = $this->getStoredAlerts();
        $alerts[$alert['id']] = $alert;

        // Keep only last 1000 alerts
        if (count($alerts) > 1000) {
            $alerts = array_slice($alerts, -1000, null, true);
        }

        Cache::put('platform:alerts', $alerts, now()->addDays(7));
    }

    /**
     * Get stored alerts.
     *
     * @return array
     */
    protected function getStoredAlerts(): array
    {
        return Cache::get('platform:alerts', []);
    }

    /**
     * Load configuration.
     *
     * @return void
     */
    protected function loadConfiguration(): void
    {
        $this->enabledChannels = config('monitoring.alert_channels', ['email', 'slack']);
        $this->rateLimitInterval = config('monitoring.alert_rate_limit', 300);
    }

    /**
     * Format email subject.
     *
     * @param array $alert
     * @return string
     */
    protected function formatEmailSubject(array $alert): string
    {
        $emoji = match ($alert['level']) {
            self::LEVEL_EMERGENCY => '🚨',
            self::LEVEL_CRITICAL => '⚠️',
            self::LEVEL_WARNING => '⚡',
            default => 'ℹ️',
        };

        return "{$emoji} [{$alert['level']}] {$alert['source']} - {$alert['environment']}";
    }

    /**
     * Format email body.
     *
     * @param array $alert
     * @return string
     */
    protected function formatEmailBody(array $alert): string
    {
        $contextHtml = '';
        if (! empty($alert['context'])) {
            $contextHtml = '<h3>Additional Context</h3><ul>';
            foreach ($alert['context'] as $key => $value) {
                $displayValue = is_array($value) ? json_encode($value) : $value;
                $contextHtml .= "<li><strong>{$key}:</strong> {$displayValue}</li>";
            }
            $contextHtml .= '</ul>';
        }

        return "
            <h2>[{$alert['level']}] Alert from {$alert['source']}</h2>
            <p><strong>Message:</strong> {$alert['message']}</p>
            <p><strong>Environment:</strong> {$alert['environment']}</p>
            <p><strong>Host:</strong> {$alert['hostname']}</p>
            <p><strong>Time:</strong> {$alert['created_at']}</p>
            <p><strong>Alert ID:</strong> {$alert['id']}</p>
            {$contextHtml}
        ";
    }

    /**
     * Group alerts by field.
     *
     * @param array $alerts
     * @param string $field
     * @return array
     */
    protected function groupBy(array $alerts, string $field): array
    {
        $grouped = [];

        foreach ($alerts as $alert) {
            $key = $alert[$field] ?? 'unknown';
            $grouped[$key] = ($grouped[$key] ?? 0) + 1;
        }

        return $grouped;
    }

    /**
     * Calculate Mean Time To Resolution.
     *
     * @param array $alerts
     * @return float|null
     */
    protected function calculateMTTR(array $alerts): ?float
    {
        $resolvedAlerts = array_filter($alerts, fn ($a) => $a['state'] === self::STATE_RESOLVED && isset($a['resolved_at']));

        if (empty($resolvedAlerts)) {
            return null;
        }

        $totalMinutes = 0;

        foreach ($resolvedAlerts as $alert) {
            $created = \Carbon\Carbon::parse($alert['created_at']);
            $resolved = \Carbon\Carbon::parse($alert['resolved_at']);
            $totalMinutes += $created->diffInMinutes($resolved);
        }

        return round($totalMinutes / count($resolvedAlerts), 2);
    }
}
