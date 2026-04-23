<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicPageController extends Controller
{
    public function home(Request $request): Response
    {
        return Inertia::render('Platform/Public/Home', [
            'title' => 'Modern ERP Platform',
        ]);
    }

    public function pricing(Request $request): Response
    {
        return Inertia::render('Platform/Public/Pricing', [
            'title' => 'Pricing — aeos365',
        ]);
    }

    public function features(Request $request): Response
    {
        return Inertia::render('Platform/Public/Features', [
            'title' => 'Features — aeos365',
        ]);
    }

    public function enterprise(Request $request): Response
    {
        return Inertia::render('Platform/Public/Enterprise', [
            'title' => 'Enterprise — aeos365',
        ]);
    }
}
