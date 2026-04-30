<?php

namespace Aero\Core\Services;

use Aero\Core\Models\UserNavigationAnalytic;
use Aero\Core\Models\UserNavigationPreference;

/**
 * AI Navigation Suggestion Service
 *
 * Produces personalised navigation suggestions for each user based on:
 *   1. Frequency — most-visited items
 *   2. Recency  — items visited in the last 7 days
 *   3. Context  — items in the same module as the current route
 *   4. Pinned   — user-pinned shortcuts (always surfaced first)
 *
 * No external AI API is required; the "AI" layer is a weighted scoring
 * algorithm over usage analytics that can later be replaced with an
 * LLM call without changing the public interface.
 */
class AINavigationSuggestionService
{
    /**
     * Get personalised navigation suggestions for a user.
     *
     * @param  string|null  $currentPath  The path the user is currently on
     * @param  array  $allNavItems  Flat list of all available nav items for the user
     * @return array{pinned: array, frequent: array, recent: array, contextual: array}
     */
    public function getSuggestions(int $userId, ?string $currentPath = null, array $allNavItems = []): array
    {
        $preference = UserNavigationPreference::getOrCreateForUser($userId);
        $topItems = UserNavigationAnalytic::getTopForUser($userId, 20);
        $recentItems = UserNavigationAnalytic::getRecentForUser($userId, 10);

        // Build a lookup: path → nav item metadata
        $navLookup = $this->buildNavLookup($allNavItems);

        // Pinned items (user-curated, always first)
        $pinned = collect($preference->pinned_items ?? [])
            ->map(fn ($path) => $navLookup[$path] ?? ['path' => $path])
            ->values()
            ->toArray();

        // Frequent — top visited, excluding already-pinned and hidden
        $hidden = collect($preference->hidden_items ?? []);
        $frequent = $topItems
            ->filter(fn ($r) => ! $hidden->contains($r->nav_path) && ! collect($preference->pinned_items ?? [])->contains($r->nav_path))
            ->take(8)
            ->map(fn ($r) => array_merge(
                $navLookup[$r->nav_path] ?? ['path' => $r->nav_path, 'name' => $r->nav_name],
                ['visit_count' => $r->visit_count, 'last_visited_at' => $r->last_visited_at?->toIso8601String()]
            ))
            ->values()
            ->toArray();

        // Recent — last visited, deduplicated from frequent
        $frequentPaths = collect($frequent)->pluck('path');
        $recent = $recentItems
            ->filter(fn ($r) => ! $hidden->contains($r->nav_path) && ! $frequentPaths->contains($r->nav_path))
            ->take(5)
            ->map(fn ($r) => array_merge(
                $navLookup[$r->nav_path] ?? ['path' => $r->nav_path, 'name' => $r->nav_name],
                ['last_visited_at' => $r->last_visited_at?->toIso8601String()]
            ))
            ->values()
            ->toArray();

        // Contextual — items in the same module as $currentPath
        $contextual = [];
        if ($currentPath !== null) {
            $currentModule = $this->detectModule($currentPath, $allNavItems);
            if ($currentModule !== null) {
                $contextual = collect($allNavItems)
                    ->filter(fn ($item) => ($item['module'] ?? null) === $currentModule && ($item['path'] ?? null) !== $currentPath)
                    ->filter(fn ($item) => ! $hidden->contains($item['path'] ?? ''))
                    ->take(5)
                    ->values()
                    ->toArray();
            }
        }

        return compact('pinned', 'frequent', 'recent', 'contextual');
    }

    /**
     * Get the metadata payload that should be passed to the frontend with every page load.
     *
     * @return array{topPaths: array, recentPaths: array, quickActions: array}
     */
    public function getUserMetadata(int $userId): array
    {
        $preference = UserNavigationPreference::getOrCreateForUser($userId);
        $topItems = UserNavigationAnalytic::getTopForUser($userId, 10);
        $recentItems = UserNavigationAnalytic::getRecentForUser($userId, 5);

        return [
            'topPaths' => $topItems->pluck('nav_path')->toArray(),
            'recentPaths' => $recentItems->pluck('nav_path')->toArray(),
            'quickActions' => $preference->quick_actions ?? [],
            'pinnedItems' => $preference->pinned_items ?? [],
            'hiddenItems' => $preference->hidden_items ?? [],
            'compactMode' => $preference->compact_mode,
            'showLabels' => $preference->show_labels,
        ];
    }

    /**
     * Build a path-keyed lookup from a nested nav tree.
     *
     * @return array<string, array>
     */
    protected function buildNavLookup(array $navItems): array
    {
        $lookup = [];

        foreach ($navItems as $item) {
            $path = $item['path'] ?? null;
            if ($path) {
                $lookup[$path] = $item;
            }

            foreach ($item['children'] ?? [] as $child) {
                $childPath = $child['path'] ?? null;
                if ($childPath) {
                    $lookup[$childPath] = $child;
                }
            }
        }

        return $lookup;
    }

    /**
     * Detect the module for the current path by matching against nav items.
     */
    protected function detectModule(string $currentPath, array $navItems): ?string
    {
        foreach ($navItems as $item) {
            if (($item['path'] ?? '') === $currentPath) {
                return $item['module'] ?? null;
            }

            foreach ($item['children'] ?? [] as $child) {
                if (($child['path'] ?? '') === $currentPath) {
                    return $child['module'] ?? $item['module'] ?? null;
                }
            }
        }

        // Fallback: extract first path segment, e.g. /hrm/employees → hrm
        $segment = explode('/', ltrim($currentPath, '/'))[0] ?? null;

        return $segment ?: null;
    }
}
