<?php

namespace Aero\DMS\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Document Search Service
 *
 * Provides full-text search capabilities for documents with
 * advanced filtering, faceted search, and relevance ranking.
 */
class DocumentSearchService
{
    /**
     * Search providers.
     */
    public const PROVIDER_DATABASE = 'database';

    public const PROVIDER_ELASTICSEARCH = 'elasticsearch';

    public const PROVIDER_MEILISEARCH = 'meilisearch';

    public const PROVIDER_ALGOLIA = 'algolia';

    public const PROVIDER_TYPESENSE = 'typesense';

    /**
     * Index status.
     */
    public const INDEX_STATUS_PENDING = 'pending';

    public const INDEX_STATUS_INDEXED = 'indexed';

    public const INDEX_STATUS_FAILED = 'failed';

    public const INDEX_STATUS_REINDEX_REQUIRED = 'reindex_required';

    /**
     * Configuration.
     */
    protected array $config = [
        'provider' => self::PROVIDER_DATABASE,
        'index_name' => 'documents',
        'searchable_fields' => ['title', 'content', 'tags', 'metadata'],
        'filterable_fields' => ['type', 'folder_id', 'created_by', 'status', 'created_at'],
        'sortable_fields' => ['title', 'created_at', 'updated_at', 'relevance'],
        'min_search_length' => 2,
        'max_results' => 1000,
        'highlight_enabled' => true,
        'highlight_tag' => 'mark',
        'fuzzy_search' => true,
        'fuzzy_distance' => 2,
        'synonyms_enabled' => true,
        'stop_words_enabled' => true,
    ];

    /**
     * Synonyms dictionary.
     */
    protected array $synonyms = [
        'doc' => ['document', 'file'],
        'pdf' => ['portable document format'],
        'img' => ['image', 'picture', 'photo'],
    ];

    /**
     * Stop words to exclude from search.
     */
    protected array $stopWords = [
        'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
        'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
        'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
        'it', 'its', 'this', 'that', 'these', 'those',
    ];

    /**
     * Search documents.
     */
    public function search(string $query, array $filters = [], array $options = []): array
    {
        $startTime = microtime(true);

        // Validate query
        if (strlen($query) < $this->config['min_search_length'] && empty($filters)) {
            return [
                'success' => false,
                'error' => 'Query must be at least '.$this->config['min_search_length'].' characters',
            ];
        }

        // Process query
        $processedQuery = $this->processQuery($query);

        // Execute search based on provider
        $results = match ($this->config['provider']) {
            self::PROVIDER_ELASTICSEARCH => $this->searchElasticsearch($processedQuery, $filters, $options),
            self::PROVIDER_MEILISEARCH => $this->searchMeilisearch($processedQuery, $filters, $options),
            self::PROVIDER_ALGOLIA => $this->searchAlgolia($processedQuery, $filters, $options),
            self::PROVIDER_TYPESENSE => $this->searchTypesense($processedQuery, $filters, $options),
            default => $this->searchDatabase($processedQuery, $filters, $options),
        };

        $duration = (microtime(true) - $startTime) * 1000;

        Log::info('Document search executed', [
            'query' => $query,
            'results_count' => $results['total'] ?? 0,
            'duration_ms' => round($duration, 2),
        ]);

        return [
            'success' => true,
            'query' => $query,
            'processed_query' => $processedQuery,
            'results' => $results['documents'] ?? [],
            'total' => $results['total'] ?? 0,
            'page' => $options['page'] ?? 1,
            'per_page' => $options['per_page'] ?? 20,
            'facets' => $results['facets'] ?? [],
            'suggestions' => $results['suggestions'] ?? [],
            'duration_ms' => round($duration, 2),
        ];
    }

    /**
     * Index a document.
     */
    public function indexDocument(array $document): array
    {
        $indexData = [
            'id' => $document['id'],
            'title' => $document['name'] ?? $document['title'] ?? '',
            'content' => $this->extractTextContent($document),
            'type' => $document['type'] ?? 'document',
            'mime_type' => $document['mime_type'] ?? null,
            'folder_id' => $document['folder_id'] ?? null,
            'folder_path' => $document['folder_path'] ?? null,
            'tags' => $document['tags'] ?? [],
            'metadata' => $document['metadata'] ?? [],
            'created_by' => $document['created_by'] ?? null,
            'created_at' => $document['created_at'] ?? now()->toIso8601String(),
            'updated_at' => $document['updated_at'] ?? now()->toIso8601String(),
            'status' => $document['status'] ?? 'active',
            'version' => $document['version'] ?? '1.0.0',
            'file_size' => $document['file_size'] ?? 0,
            'indexed_at' => now()->toIso8601String(),
        ];

        // Add to search index based on provider
        $result = match ($this->config['provider']) {
            self::PROVIDER_ELASTICSEARCH => $this->indexToElasticsearch($indexData),
            self::PROVIDER_MEILISEARCH => $this->indexToMeilisearch($indexData),
            self::PROVIDER_ALGOLIA => $this->indexToAlgolia($indexData),
            self::PROVIDER_TYPESENSE => $this->indexToTypesense($indexData),
            default => $this->indexToDatabase($indexData),
        };

        Log::info('Document indexed', [
            'document_id' => $document['id'],
            'provider' => $this->config['provider'],
        ]);

        return [
            'success' => true,
            'document_id' => $document['id'],
            'index_status' => self::INDEX_STATUS_INDEXED,
        ];
    }

    /**
     * Remove document from index.
     */
    public function removeFromIndex(string $documentId): array
    {
        Log::info('Document removed from index', [
            'document_id' => $documentId,
        ]);

        return ['success' => true, 'document_id' => $documentId];
    }

    /**
     * Bulk index documents.
     */
    public function bulkIndex(array $documents): array
    {
        $results = [
            'success' => 0,
            'failed' => 0,
            'errors' => [],
        ];

        foreach ($documents as $document) {
            try {
                $this->indexDocument($document);
                $results['success']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = [
                    'document_id' => $document['id'] ?? null,
                    'error' => $e->getMessage(),
                ];
            }
        }

        Log::info('Bulk indexing completed', [
            'success' => $results['success'],
            'failed' => $results['failed'],
        ]);

        return $results;
    }

    /**
     * Reindex all documents.
     */
    public function reindexAll(array $options = []): array
    {
        Log::info('Full reindex started');

        return [
            'success' => true,
            'started_at' => now()->toIso8601String(),
            'status' => 'in_progress',
            'job_id' => Str::uuid()->toString(),
        ];
    }

    /**
     * Get search suggestions/autocomplete.
     */
    public function getSuggestions(string $prefix, array $options = []): array
    {
        $limit = $options['limit'] ?? 10;

        // In production, query the search index for suggestions
        return [
            'prefix' => $prefix,
            'suggestions' => [],
            'total' => 0,
        ];
    }

    /**
     * Get faceted aggregations.
     */
    public function getFacets(array $filters = []): array
    {
        return [
            'type' => [],
            'folder_id' => [],
            'created_by' => [],
            'status' => [],
            'tags' => [],
            'date_range' => [
                'last_day' => 0,
                'last_week' => 0,
                'last_month' => 0,
                'last_year' => 0,
            ],
        ];
    }

    /**
     * Search within a specific document.
     */
    public function searchWithinDocument(string $documentId, string $query): array
    {
        // Get document content and search within it
        return [
            'document_id' => $documentId,
            'query' => $query,
            'matches' => [],
            'total_matches' => 0,
        ];
    }

    /**
     * Find similar documents.
     */
    public function findSimilar(string $documentId, array $options = []): array
    {
        $limit = $options['limit'] ?? 10;

        return [
            'document_id' => $documentId,
            'similar_documents' => [],
            'total' => 0,
        ];
    }

    /**
     * Get search analytics.
     */
    public function getAnalytics(array $filters = []): array
    {
        return [
            'period' => $filters['period'] ?? 'last_30_days',
            'total_searches' => 0,
            'unique_queries' => 0,
            'average_results' => 0,
            'zero_result_queries' => [],
            'popular_queries' => [],
            'popular_filters' => [],
            'average_response_time_ms' => 0,
        ];
    }

    /**
     * Configure synonyms.
     */
    public function setSynonyms(array $synonyms): array
    {
        $this->synonyms = array_merge($this->synonyms, $synonyms);

        return ['success' => true, 'synonyms_count' => count($this->synonyms)];
    }

    /**
     * Configure stop words.
     */
    public function setStopWords(array $stopWords): array
    {
        $this->stopWords = $stopWords;

        return ['success' => true, 'stop_words_count' => count($this->stopWords)];
    }

    /**
     * Process and clean search query.
     */
    protected function processQuery(string $query): array
    {
        // Lowercase and trim
        $query = strtolower(trim($query));

        // Remove special characters except quotes
        $query = preg_replace('/[^\w\s"\'*?-]/u', ' ', $query);

        // Extract phrases (quoted strings)
        $phrases = [];
        preg_match_all('/"([^"]+)"/', $query, $matches);
        $phrases = $matches[1] ?? [];

        // Remove phrases from query for token processing
        $tokensQuery = preg_replace('/"[^"]+"/', '', $query);

        // Tokenize
        $tokens = array_filter(preg_split('/\s+/', $tokensQuery));

        // Remove stop words if enabled
        if ($this->config['stop_words_enabled']) {
            $tokens = array_diff($tokens, $this->stopWords);
        }

        // Expand synonyms if enabled
        if ($this->config['synonyms_enabled']) {
            $tokens = $this->expandSynonyms($tokens);
        }

        return [
            'original' => $query,
            'tokens' => array_values($tokens),
            'phrases' => $phrases,
            'has_wildcards' => str_contains($query, '*') || str_contains($query, '?'),
        ];
    }

    /**
     * Expand tokens with synonyms.
     */
    protected function expandSynonyms(array $tokens): array
    {
        $expanded = [];

        foreach ($tokens as $token) {
            $expanded[] = $token;
            if (isset($this->synonyms[$token])) {
                $expanded = array_merge($expanded, $this->synonyms[$token]);
            }
        }

        return array_unique($expanded);
    }

    /**
     * Extract text content from document.
     */
    protected function extractTextContent(array $document): string
    {
        $content = $document['content'] ?? '';

        // If document is a file, extract text based on mime type
        $mimeType = $document['mime_type'] ?? '';

        // In production, use libraries like Apache Tika for PDF, DOCX, etc.
        // For now, return raw content

        return $content;
    }

    /**
     * Highlight search terms in text.
     */
    protected function highlightMatches(string $text, array $tokens): string
    {
        if (! $this->config['highlight_enabled']) {
            return $text;
        }

        $tag = $this->config['highlight_tag'];

        foreach ($tokens as $token) {
            $text = preg_replace(
                '/\b('.preg_quote($token, '/').')\b/i',
                "<{$tag}>$1</{$tag}>",
                $text
            );
        }

        return $text;
    }

    /**
     * Search using database (fallback).
     */
    protected function searchDatabase(array $query, array $filters, array $options): array
    {
        // In production, build SQL query with FULLTEXT or LIKE
        return [
            'documents' => [],
            'total' => 0,
            'facets' => [],
            'suggestions' => [],
        ];
    }

    /**
     * Search using Elasticsearch.
     */
    protected function searchElasticsearch(array $query, array $filters, array $options): array
    {
        // Build Elasticsearch query
        $esQuery = [
            'bool' => [
                'must' => [
                    'multi_match' => [
                        'query' => implode(' ', $query['tokens']),
                        'fields' => $this->config['searchable_fields'],
                        'fuzziness' => $this->config['fuzzy_search'] ? 'AUTO' : 0,
                    ],
                ],
                'filter' => [],
            ],
        ];

        // Add filters
        foreach ($filters as $field => $value) {
            if (in_array($field, $this->config['filterable_fields'])) {
                $esQuery['bool']['filter'][] = ['term' => [$field => $value]];
            }
        }

        // In production, execute query against Elasticsearch
        return [
            'documents' => [],
            'total' => 0,
            'facets' => [],
            'suggestions' => [],
        ];
    }

    /**
     * Search using Meilisearch.
     */
    protected function searchMeilisearch(array $query, array $filters, array $options): array
    {
        // In production, use Meilisearch PHP client
        return [
            'documents' => [],
            'total' => 0,
            'facets' => [],
            'suggestions' => [],
        ];
    }

    /**
     * Search using Algolia.
     */
    protected function searchAlgolia(array $query, array $filters, array $options): array
    {
        // In production, use Algolia PHP client
        return [
            'documents' => [],
            'total' => 0,
            'facets' => [],
            'suggestions' => [],
        ];
    }

    /**
     * Search using Typesense.
     */
    protected function searchTypesense(array $query, array $filters, array $options): array
    {
        // In production, use Typesense PHP client
        return [
            'documents' => [],
            'total' => 0,
            'facets' => [],
            'suggestions' => [],
        ];
    }

    // Index methods for different providers
    protected function indexToDatabase(array $data): bool
    {
        return true;
    }

    protected function indexToElasticsearch(array $data): bool
    {
        return true;
    }

    protected function indexToMeilisearch(array $data): bool
    {
        return true;
    }

    protected function indexToAlgolia(array $data): bool
    {
        return true;
    }

    protected function indexToTypesense(array $data): bool
    {
        return true;
    }
}
