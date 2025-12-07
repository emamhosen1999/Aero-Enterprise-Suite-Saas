<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Base controller with common functionality for HR modules
 * Reduces code duplication across controllers
 */
abstract class BaseController extends Controller
{
    /**
     * Standard success response with redirect back
     */
    protected function successResponse(string $message): RedirectResponse
    {
        return redirect()->back()->with('success', $message);
    }

    /**
     * Standard error response with redirect back
     */
    protected function errorResponse(string $message): RedirectResponse
    {
        return redirect()->back()->with('error', $message);
    }

    /**
     * Standard Inertia render with common data structure
     */
    protected function renderInertia(string $component, array $data = []): Response
    {
        return Inertia::render($component, $data);
    }

    /**
     * Apply common filters to query builder
     */
    protected function applyCommonFilters($query, Request $request, array $searchFields = []): void
    {
        // Search functionality
        if ($request->search && !empty($searchFields)) {
            $query->where(function($q) use ($request, $searchFields) {
                foreach ($searchFields as $field) {
                    $q->orWhere($field, 'like', "%{$request->search}%");
                }
            });
        }

        // Status filter
        if ($request->status) {
            $query->where('status', $request->status);
        }

        // Department filter
        if ($request->department_id) {
            $query->where('department_id', $request->department_id);
        }

        // Date range filter
        if ($request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }
    }

    /**
     * Apply common sorting to query builder
     */
    protected function applyCommonSorting($query, Request $request, string $defaultSort = 'created_at', string $defaultOrder = 'desc'): void
    {
        $sortBy = $request->input('sort_by', $defaultSort);
        $sortOrder = $request->input('sort_order', $defaultOrder);
        
        $query->orderBy($sortBy, $sortOrder);
    }

    /**
     * Get paginated results with query string preservation
     */
    protected function getPaginatedResults($query, Request $request, int $defaultPerPage = 10)
    {
        $perPage = $request->input('perPage', $defaultPerPage);
        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Get common filter data for responses
     */
    protected function getCommonFilters(Request $request): array
    {
        return $request->only([
            'search', 
            'status', 
            'department_id', 
            'start_date', 
            'end_date', 
            'sort_by', 
            'sort_order',
            'perPage'
        ]);
    }
}