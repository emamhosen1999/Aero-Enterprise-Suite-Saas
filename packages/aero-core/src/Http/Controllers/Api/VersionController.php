<?php

namespace Aero\Core\Http\Controllers\Api;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Services\VersionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VersionController extends Controller
{
    /**
     * Get current application version
     */
    public function current(): JsonResponse
    {
        return response()->json(VersionService::getCachedVersionInfo());
    }

    /**
     * Check if client version matches server version
     */
    public function check(Request $request): JsonResponse
    {
        $clientVersion = $request->input('version');

        if (! $clientVersion) {
            return response()->json([
                'error' => 'Version parameter is required',
            ], 400);
        }

        $isMatch = VersionService::isVersionMatch($clientVersion);

        if (! $isMatch) {
            VersionService::logVersionMismatch(
                $clientVersion,
                $request->header('User-Agent')
            );
        }

        return response()->json([
            'version_match' => $isMatch,
            'server_version' => VersionService::getCurrentVersion(),
            'client_version' => $clientVersion,
            'needs_update' => ! $isMatch,
            'timestamp' => now()->timestamp,
        ]);
    }
}
