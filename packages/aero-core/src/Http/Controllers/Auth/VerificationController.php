<?php

namespace Aero\Core\Http\Controllers\Auth;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Support\SafeRedirect;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VerificationController extends Controller
{
    /**
     * Display the email verification notice.
     */
    public function notice(Request $request): Response|RedirectResponse
    {
        return $request->user()->hasVerifiedEmail()
            ? SafeRedirect::intended('dashboard')
            : Inertia::render('Shared/Auth/VerifyEmail', ['status' => session('status')]);
    }

    /**
     * Mark the authenticated user's email address as verified.
     */
    public function verify(EmailVerificationRequest $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            // Use SafeRedirect with intended URL and append query parameter
            $dashboardUrl = SafeRedirect::routeExists('dashboard') 
                ? route('dashboard').'?verified=1' 
                : '/?verified=1';
            return redirect($dashboardUrl);
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
        }

        $dashboardUrl = SafeRedirect::routeExists('dashboard') 
            ? route('dashboard').'?verified=1' 
            : '/?verified=1';
        return redirect($dashboardUrl);
    }

    /**
     * Send a new email verification notification.
     */
    public function resend(Request $request): RedirectResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return SafeRedirect::intended('dashboard');
        }

        $request->user()->sendEmailVerificationNotification();

        return SafeRedirect::back('dashboard')->with('status', 'verification-link-sent');
    }
}
