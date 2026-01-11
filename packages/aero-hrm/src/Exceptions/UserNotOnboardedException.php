<?php

declare(strict_types=1);

namespace Aero\HRM\Exceptions;

use Exception;

/**
 * Exception thrown when a User attempts to access HRM features
 * without being onboarded as an Employee.
 *
 * This enforces the domain rule: HRM operates exclusively on Employees.
 */
class UserNotOnboardedException extends Exception
{
    public function __construct(
        string $message = 'User must be onboarded as an Employee to access HRM features',
        int $code = 403,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Get the HTTP status code for this exception
     */
    public function getStatusCode(): int
    {
        return 403;
    }

    /**
     * Get structured error response data
     */
    public function getErrorData(): array
    {
        return [
            'message' => $this->getMessage(),
            'error_code' => 'user_not_onboarded',
            'action_required' => 'employee_onboarding',
            'hint' => 'Contact your administrator to complete employee onboarding',
        ];
    }

    /**
     * Render exception for JSON response
     */
    public function render($request)
    {
        if ($request->expectsJson()) {
            return response()->json($this->getErrorData(), $this->getStatusCode());
        }

        return response()->view('errors.user-not-onboarded', $this->getErrorData(), $this->getStatusCode());
    }
}
