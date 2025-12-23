<?php

namespace Aero\Assistant\Http\Controllers;

use Aero\Assistant\Services\IndexingService;
use Aero\Assistant\Services\RagService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AssistantPageController extends Controller
{
    protected IndexingService $indexingService;
    protected RagService $ragService;

    public function __construct(IndexingService $indexingService, RagService $ragService)
    {
        $this->indexingService = $indexingService;
        $this->ragService = $ragService;
        $this->middleware('auth');
    }

    /**
     * Show the assistant page.
     */
    public function index(): Response
    {
        return Inertia::render('Assistant/Index', [
            'title' => 'AI Assistant',
        ]);
    }

    /**
     * Get knowledge base statistics (admin only).
     */
    public function stats(): JsonResponse
    {
        // TODO: Add admin permission check
        
        $stats = $this->ragService->getKnowledgeBaseStats();

        return response()->json([
            'success' => true,
            'stats' => $stats,
        ]);
    }

    /**
     * Trigger knowledge base re-indexing (admin only).
     */
    public function reindex(Request $request): JsonResponse
    {
        // TODO: Add admin permission check

        $module = $request->input('module');

        if ($module) {
            $indexed = $this->indexingService->indexModule($module);
            $message = "Indexed {$indexed} chunks from module: {$module}";
        } else {
            $results = $this->indexingService->indexAll();
            $message = "Indexed {$results['documentation']} documentation chunks and {$results['code']} code chunks";
        }

        return response()->json([
            'success' => true,
            'message' => $message,
        ]);
    }
}
