<?php

namespace Aero\Platform\Http\Controllers\Integrations;

use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * API Key Controller
 *
 * Manages API keys for external access to the system
 */
class ApiKeyController extends Controller
{
    /**
     * Display list of API keys
     */
    public function index()
    {
        // TODO: Fetch API keys from database
        $apiKeys = [];

        return Inertia::render('Pages/Shared/Integrations/ApiKeys', [
            'title' => 'API Keys',
            'apiKeys' => $apiKeys,
        ]);
    }

    /**
     * Generate a new API key
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'scopes' => 'required|array',
            'scopes.*' => 'string',
            'expires_at' => 'nullable|date',
        ]);

        // TODO: Generate and store API key
        $apiKey = 'sk_'.bin2hex(random_bytes(32));

        return redirect()->back()->with([
            'success' => 'API key generated successfully',
            'api_key' => $apiKey, // Show once, then hash
        ]);
    }

    /**
     * Revoke an API key
     */
    public function destroy($id)
    {
        // TODO: Revoke API key

        return redirect()->back()->with('success', 'API key revoked successfully');
    }

    /**
     * Update API key scopes
     */
    public function updateScopes(Request $request, $id)
    {
        $validated = $request->validate([
            'scopes' => 'required|array',
            'scopes.*' => 'string',
        ]);

        // TODO: Update API key scopes

        return redirect()->back()->with('success', 'API key scopes updated successfully');
    }
}
