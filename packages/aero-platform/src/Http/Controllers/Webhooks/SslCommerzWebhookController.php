<?php

namespace Aero\Platform\Http\Controllers\Webhooks;

use Aero\Platform\Models\Subscription;
use Aero\Platform\Services\Billing\SslCommerzService;
use Aero\Platform\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SslCommerzWebhookController extends Controller
{
    public function __construct(
        protected SslCommerzService $sslCommerz
    ) {}

    /**
     * Handle IPN (Instant Payment Notification) from SSLCOMMERZ.
     * This is a server-to-server callback.
     */
    public function ipn(Request $request): JsonResponse
    {
        Log::info('SSLCOMMERZ IPN received', ['data' => $request->all()]);

        $ipnData = $request->all();

        // Validate the IPN
        $validation = $this->sslCommerz->validateIpn($ipnData);

        if (! $validation['valid']) {
            Log::error('SSLCOMMERZ IPN validation failed', [
                'validation' => $validation,
                'data' => $ipnData,
            ]);

            return response()->json(['status' => 'failed', 'message' => $validation['message']], 400);
        }

        // Process based on status
        $status = $validation['status'];
        $transactionId = $validation['tran_id'];
        $subscriptionId = $validation['value_c'];

        if (in_array($status, ['VALID', 'VALIDATED'])) {
            $this->processSuccessfulPayment($validation);
        }

        return response()->json(['status' => 'received']);
    }

    /**
     * Handle successful payment callback (customer redirect).
     */
    public function success(Request $request): RedirectResponse
    {
        Log::info('SSLCOMMERZ success callback', ['data' => $request->all()]);

        $validation = $this->sslCommerz->validateIpn($request->all());

        if ($validation['valid']) {
            $this->processSuccessfulPayment($validation);

            // Redirect to success page
            $tenantId = $validation['value_a'];
            $subscriptionId = $validation['value_c'];

            return redirect()->route('platform.register.success', [
                'tenant' => $tenantId,
            ])->with('success', 'Payment completed successfully!');
        }

        return redirect()->route('platform.register.payment')->with('error', 'Payment verification failed.');
    }

    /**
     * Handle failed payment callback (customer redirect).
     */
    public function fail(Request $request): RedirectResponse
    {
        Log::warning('SSLCOMMERZ payment failed', ['data' => $request->all()]);

        return redirect()->route('platform.register.payment')
            ->with('error', 'Payment failed. Please try again or use a different payment method.');
    }

    /**
     * Handle cancelled payment callback (customer redirect).
     */
    public function cancel(Request $request): RedirectResponse
    {
        Log::info('SSLCOMMERZ payment cancelled', ['data' => $request->all()]);

        return redirect()->route('platform.register.payment')
            ->with('info', 'Payment was cancelled. You can try again when ready.');
    }

    /**
     * Process a successful payment.
     */
    protected function processSuccessfulPayment(array $validation): void
    {
        $subscriptionId = $validation['value_c'] ?? null;

        if (! $subscriptionId) {
            Log::warning('SSLCOMMERZ: No subscription ID in payment', ['validation' => $validation]);

            return;
        }

        $subscription = Subscription::find($subscriptionId);

        if (! $subscription) {
            Log::error('SSLCOMMERZ: Subscription not found', ['subscription_id' => $subscriptionId]);

            return;
        }

        // Update subscription status
        $subscription->update([
            'stripe_status' => 'active', // Reusing the stripe_status field for simplicity
            'payment_method' => 'sslcommerz',
            'last_payment_at' => now(),
            'payment_details' => [
                'gateway' => 'sslcommerz',
                'transaction_id' => $validation['tran_id'],
                'bank_tran_id' => $validation['bank_tran_id'],
                'card_type' => $validation['card_type'],
                'card_no' => $validation['card_no'],
                'amount' => $validation['amount'],
                'store_amount' => $validation['store_amount'],
                'currency' => $validation['currency'],
            ],
        ]);

        // Update tenant status if needed
        if ($subscription->tenant) {
            $subscription->tenant->update([
                'status' => 'active',
            ]);
        }

        Log::info('SSLCOMMERZ: Subscription activated', [
            'subscription_id' => $subscriptionId,
            'transaction_id' => $validation['tran_id'],
        ]);
    }
}
