<?php

namespace Aero\Platform\Services\Billing;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SslCommerzService
{
    protected string $storeId;

    protected string $storePassword;

    protected string $apiUrl;

    protected bool $sandbox;

    public function __construct()
    {
        $this->storeId = config('sslcommerz.store_id') ?? '';
        $this->storePassword = config('sslcommerz.store_password') ?? '';
        $this->sandbox = config('sslcommerz.sandbox', true);
        $this->apiUrl = $this->sandbox
            ? (config('sslcommerz.api_url_sandbox') ?? 'https://sandbox.sslcommerz.com')
            : (config('sslcommerz.api_url_live') ?? 'https://securepay.sslcommerz.com');
    }

    /**
     * Initialize a payment session.
     *
     * @param  array  $paymentData  Payment information
     * @return array Payment session response
     */
    public function initiatePayment(array $paymentData): array
    {
        $postData = $this->buildPaymentPayload($paymentData);

        $response = Http::asForm()->post("{$this->apiUrl}/gwprocess/v4/api.php", $postData);

        return $this->handleInitiateResponse($response);
    }

    /**
     * Build the payment payload for SSLCOMMERZ API.
     */
    protected function buildPaymentPayload(array $data): array
    {
        $transactionId = $data['transaction_id'] ?? 'TXN'.strtoupper(Str::random(16));

        return [
            // Store credentials
            'store_id' => $this->storeId,
            'store_passwd' => $this->storePassword,

            // Transaction info
            'total_amount' => $data['amount'],
            'currency' => $data['currency'] ?? config('sslcommerz.currency', 'BDT'),
            'tran_id' => $transactionId,

            // URLs
            'success_url' => url(config('sslcommerz.success_url')),
            'fail_url' => url(config('sslcommerz.fail_url')),
            'cancel_url' => url(config('sslcommerz.cancel_url')),
            'ipn_url' => url(config('sslcommerz.ipn_url')),

            // Customer info
            'cus_name' => $data['customer_name'] ?? 'Customer',
            'cus_email' => $data['customer_email'],
            'cus_phone' => $data['customer_phone'] ?? '',
            'cus_add1' => $data['customer_address'] ?? '',
            'cus_city' => $data['customer_city'] ?? '',
            'cus_state' => $data['customer_state'] ?? '',
            'cus_postcode' => $data['customer_postcode'] ?? '',
            'cus_country' => $data['customer_country'] ?? 'Bangladesh',

            // Product info
            'product_name' => $data['product_name'] ?? 'Subscription',
            'product_category' => config('sslcommerz.product_category'),
            'product_profile' => config('sslcommerz.product_profile'),

            // Shipping info (if applicable)
            'shipping_method' => config('sslcommerz.shipping.method', 'NO'),
            'num_of_item' => config('sslcommerz.shipping.num_items', 1),

            // EMI options
            'emi_option' => config('sslcommerz.emi_option', 0),

            // Custom fields for reference
            'value_a' => $data['tenant_id'] ?? '',
            'value_b' => $data['plan_id'] ?? '',
            'value_c' => $data['subscription_id'] ?? '',
            'value_d' => $data['custom_data'] ?? '',
        ];
    }

    /**
     * Handle the initiate payment response.
     */
    protected function handleInitiateResponse(Response $response): array
    {
        $data = $response->json();

        Log::info('SSLCOMMERZ initiate response', ['response' => $data]);

        if (! $response->successful() || ($data['status'] ?? '') !== 'SUCCESS') {
            Log::error('SSLCOMMERZ payment initiation failed', [
                'status' => $response->status(),
                'response' => $data,
            ]);

            return [
                'success' => false,
                'message' => $data['failedreason'] ?? 'Payment initiation failed',
                'data' => $data,
            ];
        }

        return [
            'success' => true,
            'session_key' => $data['sessionkey'] ?? null,
            'gateway_url' => $data['GatewayPageURL'] ?? null,
            'redirect_gateway_url' => $data['redirectGatewayURL'] ?? null,
            'redirect_gateway_url_failed' => $data['redirectGatewayURLFailed'] ?? null,
            'store_logo' => $data['storeLogo'] ?? null,
            'store_banner' => $data['storeBanner'] ?? null,
            'desc' => $data['desc'] ?? [],
            'data' => $data,
        ];
    }

    /**
     * Validate an IPN (Instant Payment Notification) callback.
     */
    public function validateIpn(array $ipnData): array
    {
        $validationId = $ipnData['val_id'] ?? null;

        if (! $validationId) {
            return [
                'valid' => false,
                'message' => 'Missing validation ID',
            ];
        }

        $response = Http::get("{$this->apiUrl}/validator/api/validationserverAPI.php", [
            'val_id' => $validationId,
            'store_id' => $this->storeId,
            'store_passwd' => $this->storePassword,
            'format' => 'json',
        ]);

        $data = $response->json();

        Log::info('SSLCOMMERZ IPN validation response', ['response' => $data]);

        if (($data['status'] ?? '') === 'VALID' || ($data['status'] ?? '') === 'VALIDATED') {
            return [
                'valid' => true,
                'status' => $data['status'],
                'tran_id' => $data['tran_id'] ?? null,
                'amount' => $data['amount'] ?? null,
                'currency' => $data['currency'] ?? null,
                'bank_tran_id' => $data['bank_tran_id'] ?? null,
                'card_type' => $data['card_type'] ?? null,
                'card_no' => $data['card_no'] ?? null,
                'card_issuer' => $data['card_issuer'] ?? null,
                'card_brand' => $data['card_brand'] ?? null,
                'card_category' => $data['card_category'] ?? null,
                'card_issuer_country' => $data['card_issuer_country'] ?? null,
                'store_amount' => $data['store_amount'] ?? null,
                'verify_sign' => $data['verify_sign'] ?? null,
                'verify_key' => $data['verify_key'] ?? null,
                'risk_level' => $data['risk_level'] ?? null,
                'risk_title' => $data['risk_title'] ?? null,
                'value_a' => $data['value_a'] ?? null,
                'value_b' => $data['value_b'] ?? null,
                'value_c' => $data['value_c'] ?? null,
                'value_d' => $data['value_d'] ?? null,
                'data' => $data,
            ];
        }

        return [
            'valid' => false,
            'status' => $data['status'] ?? 'FAILED',
            'message' => $data['error'] ?? 'Validation failed',
            'data' => $data,
        ];
    }

    /**
     * Initiate a refund.
     */
    public function initiateRefund(array $refundData): array
    {
        $response = Http::asForm()->post("{$this->apiUrl}/validator/api/merchantTransIDvalidationAPI.php", [
            'store_id' => $this->storeId,
            'store_passwd' => $this->storePassword,
            'bank_tran_id' => $refundData['bank_tran_id'],
            'refund_amount' => $refundData['amount'],
            'refund_remarks' => $refundData['remarks'] ?? 'Customer refund request',
            'refe_id' => $refundData['reference_id'] ?? Str::uuid()->toString(),
            'format' => 'json',
        ]);

        $data = $response->json();

        Log::info('SSLCOMMERZ refund response', ['response' => $data]);

        if (($data['status'] ?? '') === 'success') {
            return [
                'success' => true,
                'refund_ref_id' => $data['refund_ref_id'] ?? null,
                'data' => $data,
            ];
        }

        return [
            'success' => false,
            'message' => $data['errorReason'] ?? 'Refund failed',
            'data' => $data,
        ];
    }

    /**
     * Get transaction status by transaction ID.
     */
    public function getTransactionStatus(string $transactionId): array
    {
        $response = Http::asForm()->post("{$this->apiUrl}/validator/api/merchantTransIDvalidationAPI.php", [
            'tran_id' => $transactionId,
            'store_id' => $this->storeId,
            'store_passwd' => $this->storePassword,
            'format' => 'json',
        ]);

        $data = $response->json();

        Log::info('SSLCOMMERZ transaction status', [
            'transaction_id' => $transactionId,
            'response' => $data,
        ]);

        return [
            'success' => $response->successful(),
            'status' => $data['status'] ?? 'UNKNOWN',
            'data' => $data,
        ];
    }

    /**
     * Verify callback hash to ensure authenticity.
     */
    public function verifyHash(array $data, string $receivedHash): bool
    {
        $hashString = '';
        $keys = [
            'tran_id', 'val_id', 'amount', 'card_type', 'store_amount',
            'card_no', 'bank_tran_id', 'status', 'tran_date', 'currency',
            'card_issuer', 'card_brand', 'card_sub_brand', 'card_issuer_country',
        ];

        foreach ($keys as $key) {
            if (isset($data[$key])) {
                $hashString .= $data[$key];
            }
        }

        $hashString .= $this->storePassword;
        $computedHash = md5($hashString);

        return $computedHash === $receivedHash;
    }

    /**
     * Check if the service is properly configured.
     */
    public function isConfigured(): bool
    {
        return ! empty($this->storeId) && ! empty($this->storePassword);
    }

    /**
     * Get the current environment (sandbox/live).
     */
    public function getEnvironment(): string
    {
        return $this->sandbox ? 'sandbox' : 'live';
    }
}
