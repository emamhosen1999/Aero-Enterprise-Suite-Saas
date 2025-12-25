<?php

namespace Aero\Platform\Http\Controllers\Integrations;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Models\Webhook;
use Aero\Platform\Models\WebhookLog;
use Aero\Platform\Services\WebhookDeliveryService;
use Aero\Platform\Services\WebhookEventDispatcher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Webhook Controller
 *
 * Manages webhooks for incoming and outgoing events
 */
class WebhookController extends Controller
{
    protected WebhookDeliveryService $deliveryService;
    protected WebhookEventDispatcher $eventDispatcher;

    public function __construct(
        WebhookDeliveryService $deliveryService,
        WebhookEventDispatcher $eventDispatcher
    ) {
        $this->deliveryService = $deliveryService;
        $this->eventDispatcher = $eventDispatcher;
    }

    /**
     * Display list of webhooks
     */
    public function index(Request $request)
    {
        $webhooks = Webhook::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('url', 'like', "%{$search}%");
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 10);

        if ($request->expectsJson()) {
            return response()->json([
                'data' => $webhooks->items(),
                'meta' => [
                    'current_page' => $webhooks->currentPage(),
                    'last_page' => $webhooks->lastPage(),
                    'per_page' => $webhooks->perPage(),
                    'total' => $webhooks->total(),
                ],
            ]);
        }

        return Inertia::render('Pages/Platform/Admin/Webhooks/WebhookManager', [
            'title' => 'Webhooks',
            'webhooks' => $webhooks,
        ]);
    }

    /**
     * Store a new webhook
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url|max:500',
            'events' => 'required|array|min:1',
            'events.*' => 'required|string',
            'headers' => 'nullable|array',
            'secret' => 'nullable|string',
            'is_active' => 'boolean',
            'retry_attempts' => 'nullable|integer|min:1|max:10',
            'timeout' => 'nullable|integer|min:5|max:300',
        ]);

        $webhook = Webhook::create([
            'connector_id' => null, // For manual webhooks
            'name' => $validated['name'],
            'url' => $validated['url'],
            'event' => implode(',', $validated['events']), // Store as CSV for now
            'method' => 'POST',
            'headers' => $validated['headers'] ?? [],
            'secret' => $validated['secret'],
            'is_active' => $validated['is_active'] ?? true,
            'retry_attempts' => $validated['retry_attempts'] ?? 3,
            'timeout' => $validated['timeout'] ?? 30,
        ]);

        return response()->json([
            'message' => 'Webhook created successfully',
            'data' => $webhook,
        ], 201);
    }

    /**
     * Update a webhook
     */
    public function update(Request $request, $id)
    {
        $webhook = Webhook::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'url' => 'required|url|max:500',
            'events' => 'required|array|min:1',
            'events.*' => 'required|string',
            'headers' => 'nullable|array',
            'secret' => 'nullable|string',
            'is_active' => 'boolean',
            'retry_attempts' => 'nullable|integer|min:1|max:10',
            'timeout' => 'nullable|integer|min:5|max:300',
        ]);

        $webhook->update([
            'name' => $validated['name'],
            'url' => $validated['url'],
            'event' => implode(',', $validated['events']),
            'headers' => $validated['headers'] ?? [],
            'secret' => $validated['secret'],
            'is_active' => $validated['is_active'] ?? true,
            'retry_attempts' => $validated['retry_attempts'] ?? 3,
            'timeout' => $validated['timeout'] ?? 30,
        ]);

        return response()->json([
            'message' => 'Webhook updated successfully',
            'data' => $webhook,
        ]);
    }

    /**
     * Delete a webhook
     */
    public function destroy($id)
    {
        $webhook = Webhook::findOrFail($id);
        $webhook->delete();

        return response()->json([
            'message' => 'Webhook deleted successfully',
        ]);
    }

    /**
     * Toggle webhook active status
     */
    public function toggle(Request $request, $id)
    {
        $webhook = Webhook::findOrFail($id);
        
        $webhook->update([
            'is_active' => $request->boolean('is_active'),
        ]);

        return response()->json([
            'message' => 'Webhook status updated successfully',
            'data' => $webhook,
        ]);
    }

    /**
     * Test webhook
     */
    public function test($id)
    {
        $webhook = Webhook::findOrFail($id);
        
        $result = $this->deliveryService->test($webhook);

        return response()->json([
            'success' => $result['success'],
            'message' => $result['success'] ? 'Test webhook sent successfully' : 'Test webhook failed',
            'data' => $result,
        ]);
    }

    /**
     * View webhook logs
     */
    public function logs(Request $request, $id)
    {
        $webhook = Webhook::findOrFail($id);

        $logs = WebhookLog::where('webhook_id', $webhook->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }

    /**
     * Get webhook statistics
     */
    public function stats($id)
    {
        $webhook = Webhook::findOrFail($id);

        $stats = [
            'total_deliveries' => $webhook->success_count + $webhook->failure_count,
            'success_count' => $webhook->success_count,
            'failure_count' => $webhook->failure_count,
            'success_rate' => $webhook->success_count + $webhook->failure_count > 0
                ? round(($webhook->success_count / ($webhook->success_count + $webhook->failure_count)) * 100, 2)
                : 0,
            'last_triggered_at' => $webhook->last_triggered_at,
            'recent_logs' => WebhookLog::where('webhook_id', $webhook->id)
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get(),
        ];

        return response()->json(['data' => $stats]);
    }

    /**
     * Get available events
     */
    public function events()
    {
        return response()->json([
            'data' => $this->eventDispatcher->getAvailableEvents(),
        ]);
    }
}
