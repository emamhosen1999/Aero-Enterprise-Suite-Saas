<?php

namespace Aero\Assistant\Console\Commands;

use Aero\Assistant\Services\IndexingService;
use Illuminate\Console\Command;

class IndexKnowledgeBase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'assistant:index 
                            {--module= : Index a specific module}
                            {--fresh : Clear existing embeddings before indexing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Index knowledge base for AI assistant RAG system';

    /**
     * Execute the console command.
     */
    public function handle(IndexingService $indexingService): int
    {
        $this->info('Starting knowledge base indexing...');

        // Clear existing embeddings if --fresh flag is set
        if ($this->option('fresh')) {
            $this->warn('Clearing existing embeddings...');
            $module = $this->option('module');
            
            if ($module) {
                $count = $indexingService->clearModuleEmbeddings($module);
                $this->info("Cleared {$count} embeddings for module: {$module}");
            } else {
                $count = $indexingService->clearAllEmbeddings();
                $this->info("Cleared {$count} embeddings");
            }
        }

        // Index specific module or all sources
        if ($module = $this->option('module')) {
            $this->info("Indexing module: {$module}");
            $indexed = $indexingService->indexModule($module);
            $this->info("Indexed {$indexed} chunks from module: {$module}");
        } else {
            $this->info('Indexing all sources...');
            $results = $indexingService->indexAll();
            
            $this->info("Indexed {$results['documentation']} documentation chunks");
            $this->info("Indexed {$results['code']} code chunks");
            
            if (!empty($results['errors'])) {
                $this->warn('Errors encountered:');
                foreach ($results['errors'] as $error) {
                    $this->error("  - {$error}");
                }
            }
        }

        $this->info('✅ Knowledge base indexing completed!');
        
        return Command::SUCCESS;
    }
}
