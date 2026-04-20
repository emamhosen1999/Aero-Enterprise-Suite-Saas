<?php

namespace Aero\Core\Http\Controllers\Navigation;

use Aero\Core\Models\UserNavigationAnalytic;
use Aero\Core\Models\UserNavigationPreference;
use Aero\Core\Services\AINavigationSuggestionService;
use Aero\Core\Services\NavigationRegistry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class UserNavigationController extends Controller
{
    public function __construct(
        protected NavigationRegistry $registry,
        protected AINavigationSuggestionService $suggestionService,
    ) {}

    /**
     * GET /user/navigation/preferences
     */
    public function getPreferences(Request $request): JsonResponse
    {
        $preference = UserNavigationPreference::getOrCreateForUser($request->user()->id);

        return response()->json([
            'data' => $preference,
        ]);
    }

    /**
     * PATCH /user/navigation/preferences
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'pinned_items' => 'sometimes|array',
            'pinned_items.*' => 'string|max:255',
            'hidden_items' => 'sometimes|array',
            'hidden_items.*' => 'string|max:255',
            'custom_order' => 'sometimes|array',
            'custom_order.*' => 'string|max:255',
            'quick_actions' => 'sometimes|array|max:6',
            'quick_actions.*' => 'string|max:255',
            'show_labels' => 'sometimes|boolean',
            'compact_mode' => 'sometimes|boolean',
            'sidebar_position' => 'sometimes|string|in:left,right',
        ]);

        $preference = UserNavigationPreference::getOrCreateForUser($request->user()->id);
        $preference->update($validated);

        return response()->json([
            'data' => $preference->fresh(),
            'message' => 'Preferences saved.',
        ]);
    }

    /**
     * POST /user/navigation/track
     * Records a navigation visit for frequency/recency analytics.
     */
    public function track(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'path' => 'required|string|max:255',
            'name' => 'nullable|string|max:100',
            'module' => 'nullable|string|max:50',
        ]);

        UserNavigationAnalytic::track(
            $request->user()->id,
            $validated['path'],
            $validated['name'] ?? null,
            $validated['module'] ?? null
        );

        return response()->json(['success' => true]);
    }

    /**
     * GET /api/navigation/suggestions
     * Returns AI-powered personalised navigation suggestions.
     */
    public function getSuggestions(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentPath = $request->query('path');

        $allNav = $this->registry->toFrontend(null, $user);
        $suggestions = $this->suggestionService->getSuggestions($user->id, $currentPath, $allNav);

        return response()->json([
            'data' => $suggestions,
        ]);
    }
}
