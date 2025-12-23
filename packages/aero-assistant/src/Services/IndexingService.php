<?php

namespace Aero\Assistant\Services;

use Aero\Assistant\Models\Embedding;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Knowledge Base Indexing Service
 * Handles indexing of documentation, code, and module content.
 */
class IndexingService
{
    protected AiModelService $aiModelService;
    protected int $chunkSize;
    protected int $chunkOverlap;

    public function __construct(AiModelService $aiModelService)
    {
        $this->aiModelService = $aiModelService;
        $this->chunkSize = config('assistant.knowledge_base.chunk_size', 1000);
        $this->chunkOverlap = config('assistant.knowledge_base.chunk_overlap', 200);
    }

    /**
     * Index all configured knowledge sources.
     */
    public function indexAll(): array
    {
        $results = [
            'documentation' => 0,
            'code' => 0,
            'errors' => [],
        ];

        if (config('assistant.knowledge_base.index_docs')) {
            $results['documentation'] = $this->indexDocumentation();
        }

        if (config('assistant.knowledge_base.index_code')) {
            $results['code'] = $this->indexCode();
        }

        return $results;
    }

    /**
     * Index documentation files.
     */
    public function indexDocumentation(): int
    {
        $indexed = 0;
        $paths = config('assistant.knowledge_base.docs_paths', []);

        foreach ($paths as $path) {
            if (!File::exists($path)) {
                Log::warning("Documentation path not found: {$path}");
                continue;
            }

            $files = File::allFiles($path);

            foreach ($files as $file) {
                if (in_array($file->getExtension(), ['md', 'txt'])) {
                    $indexed += $this->indexFile($file->getPathname(), 'documentation');
                }
            }
        }

        return $indexed;
    }

    /**
     * Index code files.
     */
    public function indexCode(): int
    {
        $indexed = 0;
        $paths = config('assistant.knowledge_base.code_paths', []);

        foreach ($paths as $path) {
            if (!File::exists($path)) {
                Log::warning("Code path not found: {$path}");
                continue;
            }

            $files = File::allFiles($path);

            foreach ($files as $file) {
                if (in_array($file->getExtension(), ['php', 'js', 'jsx'])) {
                    $indexed += $this->indexFile($file->getPathname(), 'code', $this->extractModuleName($file->getPathname()));
                }
            }
        }

        return $indexed;
    }

    /**
     * Index a specific module's content.
     */
    public function indexModule(string $moduleName): int
    {
        $indexed = 0;
        $modulePath = base_path("packages/aero-{$moduleName}");

        if (!File::exists($modulePath)) {
            Log::error("Module path not found: {$modulePath}");
            return 0;
        }

        // Index module documentation
        $docsPath = $modulePath . '/docs';
        if (File::exists($docsPath)) {
            $files = File::allFiles($docsPath);
            foreach ($files as $file) {
                $indexed += $this->indexFile($file->getPathname(), 'documentation', $moduleName);
            }
        }

        // Index module code
        $srcPath = $modulePath . '/src';
        if (File::exists($srcPath)) {
            $files = File::allFiles($srcPath);
            foreach ($files as $file) {
                if ($file->getExtension() === 'php') {
                    $indexed += $this->indexFile($file->getPathname(), 'code', $moduleName);
                }
            }
        }

        // Index module resources (JS/React components)
        $resourcesPath = $modulePath . '/resources/js';
        if (File::exists($resourcesPath)) {
            $files = File::allFiles($resourcesPath);
            foreach ($files as $file) {
                if (in_array($file->getExtension(), ['js', 'jsx'])) {
                    $indexed += $this->indexFile($file->getPathname(), 'code', $moduleName);
                }
            }
        }

        return $indexed;
    }

    /**
     * Index a single file.
     */
    protected function indexFile(string $filePath, string $sourceType, ?string $moduleName = null): int
    {
        try {
            $content = File::get($filePath);
            
            // Extract meaningful content based on file type
            if ($sourceType === 'code') {
                $content = $this->extractCodeDocumentation($content, $filePath);
            }

            if (empty(trim($content))) {
                return 0;
            }

            // Split content into chunks
            $chunks = $this->splitIntoChunks($content);
            $indexed = 0;

            // Generate embeddings for all chunks at once (more efficient)
            $embeddingResult = $this->aiModelService->generateEmbeddings($chunks);

            if (!$embeddingResult['success']) {
                Log::error("Failed to generate embeddings for {$filePath}");
                return 0;
            }

            // Store each chunk with its embedding
            foreach ($chunks as $index => $chunk) {
                Embedding::updateOrCreate(
                    [
                        'source_path' => $filePath,
                        'content_chunk' => $chunk,
                    ],
                    [
                        'source_type' => $sourceType,
                        'module_name' => $moduleName,
                        'content' => $content, // Store full content for reference
                        'embedding' => $embeddingResult['embeddings'][$index] ?? null,
                        'metadata' => [
                            'file_extension' => pathinfo($filePath, PATHINFO_EXTENSION),
                            'chunk_index' => $index,
                            'total_chunks' => count($chunks),
                        ],
                    ]
                );

                $indexed++;
            }

            return $indexed;
        } catch (\Exception $e) {
            Log::error("Error indexing file {$filePath}: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Split content into overlapping chunks.
     */
    protected function splitIntoChunks(string $content): array
    {
        $chunks = [];
        $length = strlen($content);
        $position = 0;

        while ($position < $length) {
            $chunk = substr($content, $position, $this->chunkSize);
            $chunks[] = trim($chunk);
            $position += $this->chunkSize - $this->chunkOverlap;
        }

        return array_filter($chunks, fn($chunk) => !empty($chunk));
    }

    /**
     * Extract documentation from code files (comments, PHPDoc, JSDoc).
     */
    protected function extractCodeDocumentation(string $content, string $filePath): string
    {
        $documentation = [];
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);

        if ($extension === 'php') {
            // Extract PHPDoc comments
            preg_match_all('/\/\*\*(.*?)\*\//s', $content, $matches);
            foreach ($matches[1] as $docBlock) {
                $cleaned = preg_replace('/^\s*\*\s?/m', '', $docBlock);
                $documentation[] = trim($cleaned);
            }

            // Extract class/function names and signatures for context
            preg_match_all('/(class|function|public function|protected function)\s+(\w+)/i', $content, $signatures);
            if (!empty($signatures[0])) {
                $documentation[] = "Code signatures: " . implode(', ', $signatures[0]);
            }
        } elseif (in_array($extension, ['js', 'jsx'])) {
            // Extract JSDoc comments
            preg_match_all('/\/\*\*(.*?)\*\//s', $content, $matches);
            foreach ($matches[1] as $docBlock) {
                $cleaned = preg_replace('/^\s*\*\s?/m', '', $docBlock);
                $documentation[] = trim($cleaned);
            }

            // Extract component/function names
            preg_match_all('/(function|const|export\s+(?:default\s+)?function)\s+(\w+)/i', $content, $signatures);
            if (!empty($signatures[2])) {
                $documentation[] = "Components/Functions: " . implode(', ', $signatures[2]);
            }
        }

        return implode("\n\n", array_filter($documentation));
    }

    /**
     * Extract module name from file path.
     */
    protected function extractModuleName(string $filePath): ?string
    {
        if (preg_match('/packages\/aero-(\w+)\//', $filePath, $matches)) {
            return $matches[1];
        }

        return null;
    }

    /**
     * Clear all embeddings (for re-indexing).
     */
    public function clearAllEmbeddings(): int
    {
        return Embedding::truncate();
    }

    /**
     * Clear embeddings for a specific module.
     */
    public function clearModuleEmbeddings(string $moduleName): int
    {
        return Embedding::where('module_name', $moduleName)->delete();
    }
}
