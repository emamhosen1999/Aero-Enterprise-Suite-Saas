<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Api;

use Aero\Platform\Http\Controllers\Controller;
use Aero\Platform\Http\Requests\CheckRegistrationEmailRequest;
use Aero\Platform\Http\Requests\CheckRegistrationSubdomainRequest;
use Aero\Platform\Services\RegistrationIdentityStatusService;
use Illuminate\Http\JsonResponse;

class RegistrationIdentityController extends Controller
{
    public function __construct(
        private RegistrationIdentityStatusService $identityStatusService,
    ) {}

    public function checkSubdomain(CheckRegistrationSubdomainRequest $request): JsonResponse
    {
        $status = $this->identityStatusService->checkSubdomain($request->validated('subdomain'));

        return response()->json($status);
    }

    public function checkEmail(CheckRegistrationEmailRequest $request): JsonResponse
    {
        $status = $this->identityStatusService->checkEmail($request->validated('email'));

        return response()->json($status);
    }
}
