<?php

namespace Aero\Platform\Http\Controllers\Auth;

use Aero\Platform\Services\Shared\Auth\ModernAuthenticationService;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationController extends Controller
{
    protected ModernAuthenticationService $authService;

    public function __construct(ModernAuthenticationService $authService)
    {
        $this->authService = $authService;
    }

    /**
     * Display the email verification prompt.
     */
    public function prompt(Request $request): Response
    {
        return $request->user()->hasVerifiedEmail()
                    ? redirect()->intended(route('dashboard'))
                    : Inertia::render('Pages/Core/Auth/VerifyEmail', ['status' => session('status')]);
    }

    /**
     * Mark the authenticated user's email address as verified.
     */
    public function verify(EmailVerificationRequest $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard').'?verified=1');
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));

            $this->authService->logAuthenticationEvent(
                $request->user(),
                'email_verified',
                'success',
                $request
            );
        }

        return redirect()->intended(route('dashboard').'?verified=1');
    }

    /**
     * Send a new email verification notification.
     */
    public function send(Request $request)
    {
        if ($request->user()->hasVerifiedEmail()) {
            return redirect()->intended(route('dashboard'));
        }

        $request->user()->sendEmailVerificationNotification();

        $this->authService->logAuthenticationEvent(
            $request->user(),
            'verification_email_sent',
            'success',
            $request
        );

        return back()->with('status', 'verification-link-sent');
    }
}
