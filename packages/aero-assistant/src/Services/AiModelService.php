<?php

namespace Aero\Assistant\Services;

use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

/**
 * Service for interacting with the self-hosted AI model.
 */
class AiModelService
{
    protected Client $client;
    protected string $endpoint;
    protected string $modelName;
    protected int $timeout;

    public function __construct()
    {
        $this->endpoint = config('assistant.model.endpoint');
        $this->modelName = config('assistant.model.name');
        $this->timeout = config('assistant.model.timeout');

        $this->client = new Client([
            'base_uri' => $this->endpoint,
            'timeout' => $this->timeout,
            'headers' => [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ],
        ]);
    }

    /**
     * Generate a response from the AI model.
     *
     * @param array $messages Conversation messages in OpenAI format
     * @param array $options Additional generation options
     * @return array Response with 'content', 'tokens_used', etc.
     */
    public function generateResponse(array $messages, array $options = []): array
    {
        $startTime = microtime(true);

        try {
            $payload = [
                'model' => $this->modelName,
                'messages' => $messages,
                'max_tokens' => $options['max_tokens'] ?? config('assistant.model.max_tokens'),
                'temperature' => $options['temperature'] ?? config('assistant.model.temperature'),
            ];

            $response = $this->client->post('/chat/completions', [
                'json' => $payload,
            ]);

            $data = json_decode($response->getBody()->getContents(), true);
            $processingTime = (int) ((microtime(true) - $startTime) * 1000);

            return [
                'success' => true,
                'content' => $data['choices'][0]['message']['content'] ?? '',
                'tokens_used' => $data['usage']['total_tokens'] ?? 0,
                'processing_time_ms' => $processingTime,
                'model' => $data['model'] ?? $this->modelName,
            ];
        } catch (GuzzleException $e) {
            Log::error('AI Model API Error', [
                'error' => $e->getMessage(),
                'messages_count' => count($messages),
            ]);

            return [
                'success' => false,
                'content' => '',
                'error' => $e->getMessage(),
                'tokens_used' => 0,
                'processing_time_ms' => (int) ((microtime(true) - $startTime) * 1000),
            ];
        }
    }

    /**
     * Generate embeddings for text content.
     *
     * @param string|array $input Text or array of texts to embed
     * @return array Array of embedding vectors
     */
    public function generateEmbeddings($input): array
    {
        try {
            $texts = is_array($input) ? $input : [$input];

            $response = $this->client->post('/embeddings', [
                'json' => [
                    'model' => $this->modelName,
                    'input' => $texts,
                ],
            ]);

            $data = json_decode($response->getBody()->getContents(), true);

            return [
                'success' => true,
                'embeddings' => array_map(fn($item) => $item['embedding'], $data['data']),
                'tokens_used' => $data['usage']['total_tokens'] ?? 0,
            ];
        } catch (GuzzleException $e) {
            Log::error('Embedding Generation Error', [
                'error' => $e->getMessage(),
                'input_count' => is_array($input) ? count($input) : 1,
            ]);

            return [
                'success' => false,
                'embeddings' => [],
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check if the AI model service is available.
     */
    public function isAvailable(): bool
    {
        try {
            $response = $this->client->get('/health', ['timeout' => 5]);
            return $response->getStatusCode() === 200;
        } catch (GuzzleException $e) {
            return false;
        }
    }

    /**
     * Get model information.
     */
    public function getModelInfo(): array
    {
        try {
            $response = $this->client->get('/models/' . $this->modelName);
            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            return [
                'error' => $e->getMessage(),
            ];
        }
    }
}
