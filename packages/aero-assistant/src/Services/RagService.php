<?php

namespace Aero\Assistant\Services;

use Aero\Assistant\Models\Embedding;
use Illuminate\Support\Facades\Log;

/**
 * Retrieval-Augmented Generation (RAG) Service
 * Handles context retrieval from knowledge base using vector similarity search.
 */
class RagService
{
    protected AiModelService $aiModelService;
    protected int $topK;
    protected float $similarityThreshold;

    public function __construct(AiModelService $aiModelService)
    {
        $this->aiModelService = $aiModelService;
        $this->topK = config('assistant.vector.top_k', 5);
        $this->similarityThreshold = config('assistant.vector.similarity_threshold', 0.7);
    }

    /**
     * Retrieve relevant context for a query using RAG.
     *
     * @param string $query User's query
     * @param array $filters Optional filters (module_name, source_type, etc.)
     * @return array Retrieved context chunks with metadata
     */
    public function retrieveContext(string $query, array $filters = []): array
    {
        if (!config('assistant.vector.enabled')) {
            return [
                'success' => false,
                'contexts' => [],
                'error' => 'Vector search is disabled',
            ];
        }

        // Generate embedding for the query
        $embeddingResult = $this->aiModelService->generateEmbeddings($query);

        if (!$embeddingResult['success'] || empty($embeddingResult['embeddings'])) {
            Log::error('Failed to generate query embedding', [
                'query' => $query,
                'error' => $embeddingResult['error'] ?? 'Unknown error',
            ]);

            return [
                'success' => false,
                'contexts' => [],
                'error' => 'Failed to generate query embedding',
            ];
        }

        $queryEmbedding = $embeddingResult['embeddings'][0];

        // Build query with filters
        $embeddingsQuery = Embedding::query();

        if (isset($filters['module_name'])) {
            $embeddingsQuery->ofModule($filters['module_name']);
        }

        if (isset($filters['source_type'])) {
            $embeddingsQuery->ofType($filters['source_type']);
        }

        // Find similar embeddings
        $similarEmbeddings = Embedding::findSimilar(
            $queryEmbedding,
            $this->topK,
            $this->similarityThreshold
        );

        // Format contexts
        $contexts = $similarEmbeddings->map(function ($embedding) {
            return [
                'content' => $embedding->content_chunk,
                'source' => $embedding->source_path ?? $embedding->module_name ?? 'Unknown',
                'type' => $embedding->source_type,
                'similarity' => $embedding->similarity ?? 0,
                'metadata' => $embedding->metadata ?? [],
            ];
        })->toArray();

        return [
            'success' => true,
            'contexts' => $contexts,
            'count' => count($contexts),
        ];
    }

    /**
     * Generate a response using RAG-enhanced context.
     *
     * @param string $query User's query
     * @param array $conversationHistory Previous messages in the conversation
     * @param array $filters Optional filters for context retrieval
     * @return array Response with content, context used, tokens, etc.
     */
    public function generateRagResponse(string $query, array $conversationHistory = [], array $filters = []): array
    {
        $startTime = microtime(true);

        // Retrieve relevant context
        $contextResult = $this->retrieveContext($query, $filters);

        if (!$contextResult['success']) {
            // Fallback: generate response without RAG
            return $this->aiModelService->generateResponse(
                array_merge($conversationHistory, [
                    ['role' => 'user', 'content' => $query]
                ])
            );
        }

        // Build system prompt with retrieved context
        $systemPrompt = $this->buildSystemPrompt($contextResult['contexts']);

        // Prepare messages for the AI model
        $messages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ...$conversationHistory,
            ['role' => 'user', 'content' => $query],
        ];

        // Generate response
        $response = $this->aiModelService->generateResponse($messages);

        // Add RAG metadata
        $response['used_rag'] = true;
        $response['rag_chunks_retrieved'] = $contextResult['count'];
        $response['contexts'] = $contextResult['contexts'];
        $response['total_processing_time_ms'] = (int) ((microtime(true) - $startTime) * 1000);

        return $response;
    }

    /**
     * Build system prompt with retrieved context.
     */
    protected function buildSystemPrompt(array $contexts): string
    {
        $contextText = '';

        if (!empty($contexts)) {
            $contextText = "Here is relevant information from the knowledge base:\n\n";

            foreach ($contexts as $index => $context) {
                $contextText .= "--- Context " . ($index + 1) . " (from {$context['source']}) ---\n";
                $contextText .= $context['content'] . "\n\n";
            }
        }

        return <<<PROMPT
You are Aero Assistant, an intelligent AI assistant for the aeos365 platform. 
You help users navigate the platform, answer questions, and perform tasks.

{$contextText}

Guidelines:
- Use the provided context to give accurate, specific answers
- If the context doesn't contain the answer, say so and provide general guidance
- Be concise but helpful
- Reference specific features, pages, or actions when relevant
- If asked to perform an action, explain the steps clearly
- Always maintain a professional and friendly tone
PROMPT;
    }

    /**
     * Get statistics about the knowledge base.
     */
    public function getKnowledgeBaseStats(): array
    {
        return [
            'total_embeddings' => Embedding::count(),
            'by_type' => Embedding::selectRaw('source_type, count(*) as count')
                ->groupBy('source_type')
                ->pluck('count', 'source_type')
                ->toArray(),
            'by_module' => Embedding::selectRaw('module_name, count(*) as count')
                ->whereNotNull('module_name')
                ->groupBy('module_name')
                ->pluck('count', 'module_name')
                ->toArray(),
        ];
    }
}
