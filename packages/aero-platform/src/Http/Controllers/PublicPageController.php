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
            'title' => 'Home',
        ]);
    }

    public function pricing(Request $request): Response
    {
        return Inertia::render('Platform/Public/Pricing', [
            'title' => 'Pricing',
        ]);
    }

    public function features(Request $request): Response
    {
        return Inertia::render('Platform/Public/Features', [
            'title' => 'Features',
        ]);
    }

    public function enterprise(Request $request): Response
    {
        return Inertia::render('Platform/Public/Enterprise', [
            'title' => 'Enterprise',
        ]);
    }

    public function about(Request $request): Response
    {
        return Inertia::render('Platform/Public/About', [
            'title' => 'About',
        ]);
    }

    public function docs(Request $request): Response
    {
        return Inertia::render('Platform/Public/Docs', [
            'title' => 'Documentation',
        ]);
    }

    public function contact(Request $request): Response
    {
        return Inertia::render('Platform/Public/Contact', [
            'title' => 'Contact Us — aeos365',
        ]);
    }

    public function blog(Request $request): Response
    {
        return Inertia::render('Platform/Public/Blog', [
            'title' => 'Blog',
        ]);
    }

    public function privacy(Request $request): Response
    {
        return Inertia::render('Platform/Public/LegalPrivacy', [
            'title' => 'Privacy Policy',
        ]);
    }

    public function terms(Request $request): Response
    {
        return Inertia::render('Platform/Public/LegalTerms', [
            'title' => 'Terms of Service',
        ]);
    }

    public function cookies(Request $request): Response
    {
        return Inertia::render('Platform/Public/LegalCookies', [
            'title' => 'Cookie Policy',
        ]);
    }

    public function security(Request $request): Response
    {
        return Inertia::render('Platform/Public/LegalSecurity', [
            'title' => 'Security Policy',
        ]);
    }

    public function docsApi(Request $request): Response
    {
        return Inertia::render('Platform/Public/DocsApi', [
            'title' => 'API Documentation',
        ]);
    }
}
