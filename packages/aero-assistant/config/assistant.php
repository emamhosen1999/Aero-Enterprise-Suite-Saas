<?php

return [
    /*
    |--------------------------------------------------------------------------
    | AI Model Configuration
    |--------------------------------------------------------------------------
    |
    | Configure the self-hosted AI model endpoint and settings.
    |
    */

    'model' => [
        // Base URL for the self-hosted AI model API
        'endpoint' => env('ASSISTANT_MODEL_ENDPOINT', 'https://ai.aeos365.com/api'),

        // Model name/version to use
        'name' => env('ASSISTANT_MODEL_NAME', 'aero-assistant-v1'),

        // Request timeout in seconds
        'timeout' => env('ASSISTANT_MODEL_TIMEOUT', 30),

        // Max tokens for response
        'max_tokens' => env('ASSISTANT_MODEL_MAX_TOKENS', 1000),

        // Temperature for response generation (0.0 to 1.0)
        'temperature' => env('ASSISTANT_MODEL_TEMPERATURE', 0.7),
    ],

    /*
    |--------------------------------------------------------------------------
    | Vector Database Configuration
    |--------------------------------------------------------------------------
    |
    | Configure vector search using pgvector extension.
    |
    */

    'vector' => [
        // Enable vector search (requires pgvector extension)
        'enabled' => env('ASSISTANT_VECTOR_ENABLED', true),

        // Embedding dimensions (must match model output)
        'dimensions' => env('ASSISTANT_VECTOR_DIMENSIONS', 1536),

        // Number of similar documents to retrieve
        'top_k' => env('ASSISTANT_VECTOR_TOP_K', 5),

        // Similarity threshold (0.0 to 1.0)
        'similarity_threshold' => env('ASSISTANT_VECTOR_SIMILARITY_THRESHOLD', 0.7),
    ],

    /*
    |--------------------------------------------------------------------------
    | Knowledge Base Configuration
    |--------------------------------------------------------------------------
    |
    | Configure what sources to index for RAG.
    |
    */

    'knowledge_base' => [
        // Index documentation files
        'index_docs' => env('ASSISTANT_INDEX_DOCS', true),

        // Documentation paths to index
        'docs_paths' => [
            base_path('docs'),
        ],

        // Index code comments and PHPDoc
        'index_code' => env('ASSISTANT_INDEX_CODE', true),

        // Code paths to index
        'code_paths' => [
            base_path('packages'),
        ],

        // Dynamically index installed modules
        'dynamic_indexing' => env('ASSISTANT_DYNAMIC_INDEXING', true),

        // Chunk size for document splitting (characters)
        'chunk_size' => env('ASSISTANT_CHUNK_SIZE', 1000),

        // Chunk overlap (characters)
        'chunk_overlap' => env('ASSISTANT_CHUNK_OVERLAP', 200),
    ],

    /*
    |--------------------------------------------------------------------------
    | Chat Interface Configuration
    |--------------------------------------------------------------------------
    |
    */

    'interface' => [
        // Enable floating assistant button
        'floating_button' => env('ASSISTANT_FLOATING_BUTTON', true),

        // Enable dedicated assistant page
        'dedicated_page' => env('ASSISTANT_DEDICATED_PAGE', true),

        // Show on all pages
        'show_on_all_pages' => env('ASSISTANT_SHOW_ALL_PAGES', true),

        // Max conversation history to load
        'max_history' => env('ASSISTANT_MAX_HISTORY', 50),
    ],

    /*
    |--------------------------------------------------------------------------
    | Conversation Configuration
    |--------------------------------------------------------------------------
    |
    */

    'conversation' => [
        // Store conversations per user
        'per_user' => true,

        // Enable conversation history
        'enable_history' => true,

        // Enable conversation export
        'enable_export' => false,

        // Auto-delete conversations after X days (0 = never)
        'auto_delete_days' => env('ASSISTANT_AUTO_DELETE_DAYS', 0),
    ],

    /*
    |--------------------------------------------------------------------------
    | Feature Flags by Plan Tier
    |--------------------------------------------------------------------------
    |
    */

    'features' => [
        'basic' => [
            'basic_chat' => true,
            'conversation_history' => false,
            'rag_powered' => false,
            'perform_actions' => false,
            'max_messages_per_day' => 50,
        ],
        'professional' => [
            'basic_chat' => true,
            'conversation_history' => true,
            'rag_powered' => true,
            'perform_actions' => false,
            'max_messages_per_day' => 200,
        ],
        'enterprise' => [
            'basic_chat' => true,
            'conversation_history' => true,
            'rag_powered' => true,
            'perform_actions' => true,
            'max_messages_per_day' => -1, // unlimited
        ],
        'standalone' => [
            'basic_chat' => true,
            'conversation_history' => true,
            'rag_powered' => true,
            'perform_actions' => true,
            'max_messages_per_day' => -1, // unlimited
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Action Capabilities
    |--------------------------------------------------------------------------
    |
    | Define what actions the assistant can perform.
    |
    */

    'actions' => [
        'read_data' => true,
        'create_records' => true,
        'update_records' => true,
        'delete_records' => false, // Safety: require manual confirmation
        'generate_reports' => true,
        'send_notifications' => true,
    ],
];
