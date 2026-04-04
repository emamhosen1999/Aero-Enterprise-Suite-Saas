<?php

declare(strict_types=1);

namespace Aero\Cms\Http\Controllers\Admin;

use Aero\Cms\Models\CmsTemplate;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

class CmsTemplateController extends Controller
{
    public function index()
    {
        $templates = CmsTemplate::all();
        return response()->json($templates);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:cms_templates',
            'slug' => 'required|string|unique:cms_templates',
            'layout' => 'required|array',
            'description' => 'nullable|string',
        ]);

        $template = CmsTemplate::create($validated);

        return response()->json([
            'message' => 'Template created',
            'template' => $template,
        ], 201);
    }

    public function update(CmsTemplate $template, Request $request)
    {
        $validated = $request->validate([
            'name' => 'string|unique:cms_templates,name,' . $template->id,
            'layout' => 'array',
            'description' => 'nullable|string',
        ]);

        $template->update($validated);

        return response()->json([
            'message' => 'Template updated',
            'template' => $template,
        ]);
    }

    public function destroy(CmsTemplate $template)
    {
        $template->delete();
        return response()->json(['message' => 'Template deleted']);
    }
}
