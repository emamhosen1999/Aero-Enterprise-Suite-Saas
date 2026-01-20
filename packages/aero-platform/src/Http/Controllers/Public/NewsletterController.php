<?php

declare(strict_types=1);

namespace Aero\Platform\Http\Controllers\Public;

use Aero\Platform\Models\NewsletterSubscriber;
use Aero\Platform\Services\Marketing\NewsletterService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

/**
 * Public Newsletter Controller
 *
 * Handles public newsletter subscription endpoints.
 */
class NewsletterController extends Controller
{
    public function __construct(
        protected NewsletterService $newsletterService
    ) {}

    /**
     * Subscribe to newsletter (public endpoint).
     */
    public function subscribe(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'name' => ['nullable', 'string', 'max:255'],
            'preferences' => ['nullable', 'array'],
        ]);

        $source = $request->input('source', NewsletterSubscriber::SOURCE_WEBSITE);

        $subscriber = $this->newsletterService->subscribe(
            $validated['email'],
            $validated['name'] ?? null,
            $source,
            $validated['preferences'] ?? []
        );

        $message = $subscriber->isConfirmed()
            ? 'You have been subscribed to our newsletter!'
            : 'Please check your email to confirm your subscription.';

        return response()->json([
            'success' => true,
            'message' => $message,
            'requires_confirmation' => ! $subscriber->isConfirmed(),
        ]);
    }

    /**
     * Confirm newsletter subscription.
     */
    public function confirm(string $token): \Illuminate\Http\Response|\Inertia\Response
    {
        $subscriber = $this->newsletterService->confirmByToken($token);

        if (! $subscriber) {
            return Inertia::render('Platform/Public/Newsletter/ConfirmFailed', [
                'title' => 'Subscription Confirmation Failed',
                'message' => 'This confirmation link is invalid or has expired.',
            ]);
        }

        return Inertia::render('Platform/Public/Newsletter/ConfirmSuccess', [
            'title' => 'Subscription Confirmed',
            'message' => 'Thank you for confirming your newsletter subscription!',
            'email' => $subscriber->email,
        ]);
    }

    /**
     * Show unsubscribe page.
     */
    public function showUnsubscribe(string $token): \Inertia\Response
    {
        $subscriber = NewsletterSubscriber::findByToken($token);

        if (! $subscriber) {
            return Inertia::render('Platform/Public/Newsletter/UnsubscribeFailed', [
                'title' => 'Unsubscribe Failed',
                'message' => 'This unsubscribe link is invalid.',
            ]);
        }

        if ($subscriber->status === NewsletterSubscriber::STATUS_UNSUBSCRIBED) {
            return Inertia::render('Platform/Public/Newsletter/AlreadyUnsubscribed', [
                'title' => 'Already Unsubscribed',
                'message' => 'You have already been unsubscribed from our newsletter.',
            ]);
        }

        return Inertia::render('Platform/Public/Newsletter/Unsubscribe', [
            'title' => 'Unsubscribe from Newsletter',
            'email' => $subscriber->email,
            'token' => $token,
        ]);
    }

    /**
     * Process unsubscribe request.
     */
    public function unsubscribe(Request $request, string $token): JsonResponse
    {
        $reason = $request->input('reason');
        $subscriber = $this->newsletterService->unsubscribeByToken($token, $reason);

        if (! $subscriber) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid unsubscribe link.',
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'You have been successfully unsubscribed from our newsletter.',
        ]);
    }
}
