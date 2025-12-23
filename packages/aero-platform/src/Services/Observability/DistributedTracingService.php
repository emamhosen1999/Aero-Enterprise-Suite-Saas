<?php

namespace Aero\Platform\Services\Observability;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Distributed Tracing Service
 *
 * Provides OpenTelemetry-compatible distributed tracing for
 * request tracking across services and systems.
 */
class DistributedTracingService
{
    /**
     * Span kinds.
     */
    public const SPAN_KIND_INTERNAL = 'internal';
    public const SPAN_KIND_SERVER = 'server';
    public const SPAN_KIND_CLIENT = 'client';
    public const SPAN_KIND_PRODUCER = 'producer';
    public const SPAN_KIND_CONSUMER = 'consumer';

    /**
     * Span statuses.
     */
    public const STATUS_UNSET = 'unset';
    public const STATUS_OK = 'ok';
    public const STATUS_ERROR = 'error';

    /**
     * Sampling strategies.
     */
    public const SAMPLING_ALWAYS = 'always';
    public const SAMPLING_NEVER = 'never';
    public const SAMPLING_PROBABILISTIC = 'probabilistic';
    public const SAMPLING_RATE_LIMITING = 'rate_limiting';
    public const SAMPLING_PARENT_BASED = 'parent_based';

    /**
     * Current trace context.
     */
    protected ?array $currentContext = null;

    /**
     * Active spans stack.
     */
    protected array $spanStack = [];

    /**
     * Configuration.
     */
    protected array $config = [
        'service_name' => 'aero-suite',
        'service_version' => '1.0.0',
        'environment' => 'production',
        'sampling_strategy' => self::SAMPLING_PROBABILISTIC,
        'sampling_probability' => 0.1, // 10% of requests
        'rate_limit_per_second' => 100,
        'max_spans_per_trace' => 1000,
        'span_batch_size' => 100,
        'export_timeout_ms' => 5000,
        'propagation_format' => 'w3c', // w3c, b3, jaeger
        'exporters' => [
            'jaeger' => [
                'enabled' => true,
                'endpoint' => 'http://localhost:14268/api/traces',
            ],
            'zipkin' => [
                'enabled' => false,
                'endpoint' => 'http://localhost:9411/api/v2/spans',
            ],
            'otlp' => [
                'enabled' => false,
                'endpoint' => 'http://localhost:4318/v1/traces',
            ],
        ],
    ];

    /**
     * Collected spans for batch export.
     */
    protected array $collectedSpans = [];

    /**
     * Start a new trace.
     */
    public function startTrace(?string $traceId = null): array
    {
        $traceId = $traceId ?? $this->generateTraceId();

        $this->currentContext = [
            'trace_id' => $traceId,
            'span_id' => null,
            'parent_span_id' => null,
            'sampled' => $this->shouldSample($traceId),
            'baggage' => [],
        ];

        Log::debug('Trace started', [
            'trace_id' => $traceId,
            'sampled' => $this->currentContext['sampled'],
        ]);

        return $this->currentContext;
    }

    /**
     * Start a new span.
     */
    public function startSpan(string $name, array $options = []): array
    {
        if (!$this->currentContext) {
            $this->startTrace();
        }

        $spanId = $this->generateSpanId();
        $parentSpanId = $options['parent_span_id'] ?? $this->currentContext['span_id'];

        $span = [
            'trace_id' => $this->currentContext['trace_id'],
            'span_id' => $spanId,
            'parent_span_id' => $parentSpanId,
            'name' => $name,
            'kind' => $options['kind'] ?? self::SPAN_KIND_INTERNAL,
            'status' => self::STATUS_UNSET,
            'status_message' => null,
            'start_time' => $this->getMicrosecondTimestamp(),
            'end_time' => null,
            'duration_us' => null,
            'attributes' => $options['attributes'] ?? [],
            'events' => [],
            'links' => $options['links'] ?? [],
            'resource' => [
                'service.name' => $this->config['service_name'],
                'service.version' => $this->config['service_version'],
                'deployment.environment' => $this->config['environment'],
            ],
        ];

        // Update current context
        $this->currentContext['span_id'] = $spanId;

        // Push to stack for nested spans
        $this->spanStack[] = $span;

        return $span;
    }

    /**
     * Add an event to the current span.
     */
    public function addEvent(string $name, array $attributes = []): void
    {
        if (empty($this->spanStack)) {
            return;
        }

        $event = [
            'name' => $name,
            'timestamp' => $this->getMicrosecondTimestamp(),
            'attributes' => $attributes,
        ];

        $this->spanStack[count($this->spanStack) - 1]['events'][] = $event;
    }

    /**
     * Set span attribute.
     */
    public function setAttribute(string $key, mixed $value): void
    {
        if (empty($this->spanStack)) {
            return;
        }

        $this->spanStack[count($this->spanStack) - 1]['attributes'][$key] = $value;
    }

    /**
     * Set multiple span attributes.
     */
    public function setAttributes(array $attributes): void
    {
        foreach ($attributes as $key => $value) {
            $this->setAttribute($key, $value);
        }
    }

    /**
     * Set span status.
     */
    public function setStatus(string $status, ?string $message = null): void
    {
        if (empty($this->spanStack)) {
            return;
        }

        $this->spanStack[count($this->spanStack) - 1]['status'] = $status;
        $this->spanStack[count($this->spanStack) - 1]['status_message'] = $message;
    }

    /**
     * Record an exception in the current span.
     */
    public function recordException(\Throwable $exception, array $attributes = []): void
    {
        $this->addEvent('exception', array_merge([
            'exception.type' => get_class($exception),
            'exception.message' => $exception->getMessage(),
            'exception.stacktrace' => $exception->getTraceAsString(),
        ], $attributes));

        $this->setStatus(self::STATUS_ERROR, $exception->getMessage());
    }

    /**
     * End the current span.
     */
    public function endSpan(?array $options = []): ?array
    {
        if (empty($this->spanStack)) {
            return null;
        }

        $span = array_pop($this->spanStack);
        $span['end_time'] = $this->getMicrosecondTimestamp();
        $span['duration_us'] = $span['end_time'] - $span['start_time'];

        // Set status if still unset
        if ($span['status'] === self::STATUS_UNSET) {
            $span['status'] = self::STATUS_OK;
        }

        // Collect for batch export if sampled
        if ($this->currentContext['sampled']) {
            $this->collectedSpans[] = $span;

            // Export if batch is full
            if (count($this->collectedSpans) >= $this->config['span_batch_size']) {
                $this->exportSpans();
            }
        }

        // Update context to parent span
        if (!empty($this->spanStack)) {
            $this->currentContext['span_id'] = $this->spanStack[count($this->spanStack) - 1]['span_id'];
        }

        return $span;
    }

    /**
     * End the current trace.
     */
    public function endTrace(): void
    {
        // End all remaining spans
        while (!empty($this->spanStack)) {
            $this->endSpan();
        }

        // Export remaining spans
        if (!empty($this->collectedSpans)) {
            $this->exportSpans();
        }

        $this->currentContext = null;
    }

    /**
     * Create a child context for propagation.
     */
    public function createChildContext(): array
    {
        if (!$this->currentContext) {
            return [];
        }

        return [
            'trace_id' => $this->currentContext['trace_id'],
            'span_id' => $this->currentContext['span_id'],
            'sampled' => $this->currentContext['sampled'],
            'baggage' => $this->currentContext['baggage'],
        ];
    }

    /**
     * Inject trace context into headers for propagation.
     */
    public function inject(array &$headers): void
    {
        if (!$this->currentContext) {
            return;
        }

        $format = $this->config['propagation_format'];

        if ($format === 'w3c') {
            // W3C Trace Context
            $headers['traceparent'] = sprintf(
                '00-%s-%s-%s',
                $this->currentContext['trace_id'],
                $this->currentContext['span_id'],
                $this->currentContext['sampled'] ? '01' : '00'
            );

            if (!empty($this->currentContext['baggage'])) {
                $headers['tracestate'] = $this->encodeBaggage($this->currentContext['baggage']);
            }
        } elseif ($format === 'b3') {
            // B3 Single Header
            $headers['b3'] = sprintf(
                '%s-%s-%s',
                $this->currentContext['trace_id'],
                $this->currentContext['span_id'],
                $this->currentContext['sampled'] ? '1' : '0'
            );
        } elseif ($format === 'jaeger') {
            // Jaeger format
            $headers['uber-trace-id'] = sprintf(
                '%s:%s:0:%d',
                $this->currentContext['trace_id'],
                $this->currentContext['span_id'],
                $this->currentContext['sampled'] ? 1 : 0
            );
        }
    }

    /**
     * Extract trace context from headers.
     */
    public function extract(array $headers): ?array
    {
        $format = $this->config['propagation_format'];

        if ($format === 'w3c' && isset($headers['traceparent'])) {
            return $this->extractW3C($headers);
        } elseif ($format === 'b3' && isset($headers['b3'])) {
            return $this->extractB3($headers);
        } elseif ($format === 'jaeger' && isset($headers['uber-trace-id'])) {
            return $this->extractJaeger($headers);
        }

        return null;
    }

    /**
     * Continue trace from extracted context.
     */
    public function continueTrace(array $context): void
    {
        $this->currentContext = [
            'trace_id' => $context['trace_id'],
            'span_id' => null,
            'parent_span_id' => $context['span_id'],
            'sampled' => $context['sampled'],
            'baggage' => $context['baggage'] ?? [],
        ];
    }

    /**
     * Set baggage item.
     */
    public function setBaggageItem(string $key, string $value): void
    {
        if ($this->currentContext) {
            $this->currentContext['baggage'][$key] = $value;
        }
    }

    /**
     * Get baggage item.
     */
    public function getBaggageItem(string $key): ?string
    {
        return $this->currentContext['baggage'][$key] ?? null;
    }

    /**
     * Get current trace ID.
     */
    public function getTraceId(): ?string
    {
        return $this->currentContext['trace_id'] ?? null;
    }

    /**
     * Get current span ID.
     */
    public function getSpanId(): ?string
    {
        return $this->currentContext['span_id'] ?? null;
    }

    /**
     * Check if current trace is sampled.
     */
    public function isSampled(): bool
    {
        return $this->currentContext['sampled'] ?? false;
    }

    /**
     * Export collected spans.
     */
    public function exportSpans(): bool
    {
        if (empty($this->collectedSpans)) {
            return true;
        }

        $spans = $this->collectedSpans;
        $this->collectedSpans = [];

        $exported = false;

        foreach ($this->config['exporters'] as $name => $exporter) {
            if (!($exporter['enabled'] ?? false)) {
                continue;
            }

            try {
                $result = match ($name) {
                    'jaeger' => $this->exportToJaeger($spans, $exporter),
                    'zipkin' => $this->exportToZipkin($spans, $exporter),
                    'otlp' => $this->exportToOtlp($spans, $exporter),
                    default => false,
                };

                if ($result) {
                    $exported = true;
                    Log::debug("Spans exported to {$name}", [
                        'count' => count($spans),
                    ]);
                }
            } catch (\Exception $e) {
                Log::error("Failed to export spans to {$name}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $exported;
    }

    /**
     * Get trace statistics.
     */
    public function getStatistics(Carbon $startDate, Carbon $endDate): array
    {
        return [
            'period' => [
                'start' => $startDate->toIso8601String(),
                'end' => $endDate->toIso8601String(),
            ],
            'summary' => [
                'total_traces' => 0,
                'total_spans' => 0,
                'sampled_traces' => 0,
                'error_traces' => 0,
            ],
            'latency_percentiles' => [
                'p50' => 0,
                'p90' => 0,
                'p95' => 0,
                'p99' => 0,
            ],
            'top_endpoints' => [],
            'error_rate' => 0,
        ];
    }

    /**
     * Generate a trace ID (32 hex characters).
     */
    protected function generateTraceId(): string
    {
        return bin2hex(random_bytes(16));
    }

    /**
     * Generate a span ID (16 hex characters).
     */
    protected function generateSpanId(): string
    {
        return bin2hex(random_bytes(8));
    }

    /**
     * Get microsecond timestamp.
     */
    protected function getMicrosecondTimestamp(): int
    {
        return (int) (microtime(true) * 1000000);
    }

    /**
     * Determine if trace should be sampled.
     */
    protected function shouldSample(string $traceId): bool
    {
        $strategy = $this->config['sampling_strategy'];

        return match ($strategy) {
            self::SAMPLING_ALWAYS => true,
            self::SAMPLING_NEVER => false,
            self::SAMPLING_PROBABILISTIC => $this->probabilisticSampling($traceId),
            self::SAMPLING_RATE_LIMITING => $this->rateLimitingSampling(),
            self::SAMPLING_PARENT_BASED => $this->currentContext['sampled'] ?? $this->probabilisticSampling($traceId),
            default => true,
        };
    }

    /**
     * Probabilistic sampling based on trace ID.
     */
    protected function probabilisticSampling(string $traceId): bool
    {
        // Use last 4 chars of trace ID for deterministic sampling
        $hash = hexdec(substr($traceId, -4)) / 0xFFFF;
        return $hash < $this->config['sampling_probability'];
    }

    /**
     * Rate limiting sampling.
     */
    protected function rateLimitingSampling(): bool
    {
        // Implement rate limiting logic with cache
        // For now, use simple probabilistic fallback
        return $this->probabilisticSampling($this->generateTraceId());
    }

    /**
     * Encode baggage for headers.
     */
    protected function encodeBaggage(array $baggage): string
    {
        $items = [];
        foreach ($baggage as $key => $value) {
            $items[] = urlencode($key) . '=' . urlencode($value);
        }
        return implode(',', $items);
    }

    /**
     * Extract W3C trace context.
     */
    protected function extractW3C(array $headers): ?array
    {
        $traceparent = $headers['traceparent'];
        $parts = explode('-', $traceparent);

        if (count($parts) !== 4) {
            return null;
        }

        return [
            'trace_id' => $parts[1],
            'span_id' => $parts[2],
            'sampled' => $parts[3] === '01',
            'baggage' => $this->decodeBaggage($headers['tracestate'] ?? ''),
        ];
    }

    /**
     * Extract B3 trace context.
     */
    protected function extractB3(array $headers): ?array
    {
        $b3 = $headers['b3'];
        $parts = explode('-', $b3);

        if (count($parts) < 2) {
            return null;
        }

        return [
            'trace_id' => $parts[0],
            'span_id' => $parts[1],
            'sampled' => isset($parts[2]) ? $parts[2] === '1' : true,
            'baggage' => [],
        ];
    }

    /**
     * Extract Jaeger trace context.
     */
    protected function extractJaeger(array $headers): ?array
    {
        $traceId = $headers['uber-trace-id'];
        $parts = explode(':', $traceId);

        if (count($parts) !== 4) {
            return null;
        }

        return [
            'trace_id' => $parts[0],
            'span_id' => $parts[1],
            'sampled' => (int) $parts[3] === 1,
            'baggage' => [],
        ];
    }

    /**
     * Decode baggage from header.
     */
    protected function decodeBaggage(string $header): array
    {
        if (empty($header)) {
            return [];
        }

        $baggage = [];
        $items = explode(',', $header);

        foreach ($items as $item) {
            $parts = explode('=', $item, 2);
            if (count($parts) === 2) {
                $baggage[urldecode($parts[0])] = urldecode($parts[1]);
            }
        }

        return $baggage;
    }

    /**
     * Export spans to Jaeger.
     */
    protected function exportToJaeger(array $spans, array $config): bool
    {
        // Convert to Jaeger thrift format and send
        // In production, use Jaeger client library
        Log::debug('Would export to Jaeger', [
            'endpoint' => $config['endpoint'],
            'span_count' => count($spans),
        ]);
        return true;
    }

    /**
     * Export spans to Zipkin.
     */
    protected function exportToZipkin(array $spans, array $config): bool
    {
        // Convert to Zipkin v2 JSON format
        $zipkinSpans = array_map(function ($span) {
            return [
                'traceId' => $span['trace_id'],
                'id' => $span['span_id'],
                'parentId' => $span['parent_span_id'],
                'name' => $span['name'],
                'timestamp' => $span['start_time'],
                'duration' => $span['duration_us'],
                'kind' => strtoupper($span['kind']),
                'localEndpoint' => [
                    'serviceName' => $span['resource']['service.name'],
                ],
                'tags' => array_map('strval', $span['attributes']),
                'annotations' => array_map(function ($event) {
                    return [
                        'timestamp' => $event['timestamp'],
                        'value' => $event['name'],
                    ];
                }, $span['events']),
            ];
        }, $spans);

        Log::debug('Would export to Zipkin', [
            'endpoint' => $config['endpoint'],
            'span_count' => count($spans),
        ]);
        return true;
    }

    /**
     * Export spans to OTLP (OpenTelemetry Protocol).
     */
    protected function exportToOtlp(array $spans, array $config): bool
    {
        // Convert to OTLP proto format
        Log::debug('Would export to OTLP', [
            'endpoint' => $config['endpoint'],
            'span_count' => count($spans),
        ]);
        return true;
    }
}
