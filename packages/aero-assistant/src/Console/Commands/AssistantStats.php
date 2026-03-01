<?php

namespace Aero\Assistant\Console\Commands;

use Aero\Assistant\Models\UsageLog;
use Aero\Assistant\Services\RagService;
use Illuminate\Console\Command;

class AssistantStats extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'assistant:stats';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Display AI assistant statistics and knowledge base info';

    /**
     * Execute the console command.
     */
    public function handle(RagService $ragService): int
    {
        $this->info('🤖 AI Assistant Statistics');
        $this->newLine();

        // Knowledge Base Stats
        $kbStats = $ragService->getKnowledgeBaseStats();

        $this->info('📚 Knowledge Base:');
        $this->line("  Total Embeddings: {$kbStats['total_embeddings']}");

        if (! empty($kbStats['by_type'])) {
            $this->line('  By Type:');
            foreach ($kbStats['by_type'] as $type => $count) {
                $this->line("    - {$type}: {$count}");
            }
        }

        if (! empty($kbStats['by_module'])) {
            $this->line('  By Module:');
            foreach ($kbStats['by_module'] as $module => $count) {
                $this->line("    - {$module}: {$count}");
            }
        }

        $this->newLine();

        // Usage Stats
        $this->info('📊 Usage Statistics:');

        $todayUsage = UsageLog::whereDate('created_at', today())->count();
        $weekUsage = UsageLog::where('created_at', '>=', now()->subWeek())->count();
        $monthUsage = UsageLog::where('created_at', '>=', now()->subMonth())->count();

        $this->line("  Today: {$todayUsage} messages");
        $this->line("  This Week: {$weekUsage} messages");
        $this->line("  This Month: {$monthUsage} messages");

        $this->newLine();

        // RAG Usage
        $ragUsage = UsageLog::where('used_rag', true)->count();
        $totalUsage = UsageLog::count();
        $ragPercentage = $totalUsage > 0 ? round(($ragUsage / $totalUsage) * 100, 2) : 0;

        $this->info('🔍 RAG Statistics:');
        $this->line("  RAG-powered responses: {$ragUsage} ({$ragPercentage}%)");

        $this->newLine();

        return Command::SUCCESS;
    }
}
