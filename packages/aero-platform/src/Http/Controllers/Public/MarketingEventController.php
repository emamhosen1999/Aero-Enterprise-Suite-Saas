<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Public;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class MarketingEventController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_name' => ['required', 'string', 'max:100'],
            'cta_name' => ['required', 'string', 'max:100'],
            'page' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:100'],
            'destination' => ['nullable', 'string', 'max:255'],
            'experiment_key' => ['nullable', 'string', 'max:100'],
            'experiment_variant' => ['nullable', 'string', 'max:100'],
            'session_id' => ['nullable', 'string', 'max:100'],
            'occurred_at' => ['nullable', 'integer'],
            'metadata' => ['nullable', 'array'],
        ]);

        logger()->info('Public marketing event captured', [
            'event_name' => $validated['event_name'],
            'cta_name' => $validated['cta_name'],
            'page' => $validated['page'] ?? null,
            'location' => $validated['location'] ?? null,
            'destination' => $validated['destination'] ?? null,
            'experiment_key' => $validated['experiment_key'] ?? null,
            'experiment_variant' => $validated['experiment_variant'] ?? null,
            'session_id' => $validated['session_id'] ?? null,
            'occurred_at' => $validated['occurred_at'] ?? null,
            'metadata' => $validated['metadata'] ?? [],
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referer' => $request->headers->get('referer'),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Marketing event received.',
        ], 202);
    }
}