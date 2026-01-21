<?php

namespace Aero\HRM\Http\Controllers\Asset;

use Aero\HRM\Http\Controllers\Controller;
use Aero\HRM\Models\AssetCategory;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class AssetCategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('HRM/Assets/AssetCategoriesIndex', [
            'title' => 'Asset Categories',
        ]);
    }

    public function list(): JsonResponse
    {
        return response()->json(AssetCategory::orderBy('name')->get());
    }
}
