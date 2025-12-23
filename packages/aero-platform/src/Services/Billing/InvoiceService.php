<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Billing;

use Aero\Platform\Models\Plan;
use Aero\Platform\Models\Subscription;
use Aero\Platform\Models\Tenant;
use Aero\Platform\Models\UsageRecord;
use Aero\Platform\Services\Monitoring\Billing\InvoiceBrandingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Invoice Service
 *
 * Comprehensive invoice generation and management service for SaaS billing.
 *
 * Features:
 * - Generate subscription invoices
 * - Generate usage-based invoices
 * - PDF export with branding
 * - Invoice history tracking
 * - Payment status management
 * - Proration support
 * - Tax calculation
 * - Credit/refund handling
 *
 * Usage:
 * ```php
 * $invoiceService = app(InvoiceService::class);
 *
 * // Generate monthly invoice for tenant
 * $invoice = $invoiceService->generateSubscriptionInvoice($tenant);
 *
 * // Generate PDF
 * $pdf = $invoiceService->generatePdf($invoice);
 *
 * // Send invoice email
 * $invoiceService->sendInvoiceEmail($invoice);
 * ```
 */
class InvoiceService
{
    /**
     * Invoice statuses.
     */
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING = 'pending';

    public const STATUS_PAID = 'paid';

    public const STATUS_OVERDUE = 'overdue';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REFUNDED = 'refunded';

    /**
     * Invoice types.
     */
    public const TYPE_SUBSCRIPTION = 'subscription';

    public const TYPE_USAGE = 'usage';

    public const TYPE_ONE_TIME = 'one_time';

    public const TYPE_CREDIT = 'credit';

    public function __construct(
        protected InvoiceBrandingService $brandingService
    ) {}

    /**
     * Generate a subscription invoice for a tenant.
     *
     * @param Tenant $tenant
     * @param Carbon|null $billingPeriodStart
     * @param Carbon|null $billingPeriodEnd
     * @return array Invoice data
     */
    public function generateSubscriptionInvoice(
        Tenant $tenant,
        ?Carbon $billingPeriodStart = null,
        ?Carbon $billingPeriodEnd = null
    ): array {
        $subscription = $tenant->subscription;

        if (! $subscription) {
            throw new \RuntimeException('Tenant has no active subscription.');
        }

        $plan = $subscription->plan;
        $billingPeriodStart = $billingPeriodStart ?? now()->startOfMonth();
        $billingPeriodEnd = $billingPeriodEnd ?? now()->endOfMonth();

        // Build line items
        $lineItems = [];

        // Add subscription charge
        $lineItems[] = [
            'description' => "{$plan->name} Subscription",
            'quantity' => 1,
            'unit_price' => $plan->price,
            'amount' => $plan->price,
            'type' => 'subscription',
        ];

        // Add any add-ons
        $addOns = $this->getActiveAddOns($tenant);
        foreach ($addOns as $addOn) {
            $lineItems[] = [
                'description' => $addOn['name'],
                'quantity' => $addOn['quantity'],
                'unit_price' => $addOn['price'],
                'amount' => $addOn['quantity'] * $addOn['price'],
                'type' => 'addon',
            ];
        }

        // Calculate totals
        $subtotal = array_sum(array_column($lineItems, 'amount'));
        $taxRate = $this->getTaxRate($tenant);
        $taxAmount = round($subtotal * ($taxRate / 100), 2);
        $total = $subtotal + $taxAmount;

        // Apply credits if any
        $creditsApplied = $this->getAvailableCredits($tenant);
        $creditsUsed = min($creditsApplied, $total);
        $amountDue = $total - $creditsUsed;

        $invoice = [
            'invoice_number' => $this->generateInvoiceNumber($tenant),
            'tenant_id' => $tenant->id,
            'subscription_id' => $subscription->id,
            'type' => self::TYPE_SUBSCRIPTION,
            'status' => self::STATUS_PENDING,
            'currency' => $plan->currency ?? 'USD',
            'billing_period_start' => $billingPeriodStart->toDateString(),
            'billing_period_end' => $billingPeriodEnd->toDateString(),
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(30)->toDateString(),
            'line_items' => $lineItems,
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'credits_applied' => $creditsUsed,
            'total' => $total,
            'amount_due' => $amountDue,
            'notes' => null,
            'metadata' => [
                'plan_id' => $plan->id,
                'plan_name' => $plan->name,
            ],
            'created_at' => now()->toDateTimeString(),
        ];

        // Store the invoice
        $this->storeInvoice($tenant, $invoice);

        // Deduct credits used
        if ($creditsUsed > 0) {
            $this->deductCredits($tenant, $creditsUsed, $invoice['invoice_number']);
        }

        return $invoice;
    }

    /**
     * Generate a usage-based invoice for additional usage charges.
     *
     * @param Tenant $tenant
     * @param Carbon|null $billingPeriodStart
     * @param Carbon|null $billingPeriodEnd
     * @return array|null Invoice data or null if no usage charges
     */
    public function generateUsageInvoice(
        Tenant $tenant,
        ?Carbon $billingPeriodStart = null,
        ?Carbon $billingPeriodEnd = null
    ): ?array {
        $billingPeriodStart = $billingPeriodStart ?? now()->startOfMonth();
        $billingPeriodEnd = $billingPeriodEnd ?? now()->endOfMonth();

        // Get usage records for the period
        $usageRecords = UsageRecord::where('tenant_id', $tenant->id)
            ->whereBetween('recorded_at', [$billingPeriodStart, $billingPeriodEnd])
            ->where('billable', true)
            ->where('billed', false)
            ->get();

        if ($usageRecords->isEmpty()) {
            return null;
        }

        $lineItems = [];

        // Group by usage type
        $groupedUsage = $usageRecords->groupBy('usage_type');

        foreach ($groupedUsage as $type => $records) {
            $totalQuantity = $records->sum('quantity');
            $unitPrice = $this->getUsageUnitPrice($type);
            $amount = $totalQuantity * $unitPrice;

            $lineItems[] = [
                'description' => $this->getUsageDescription($type),
                'quantity' => $totalQuantity,
                'unit_price' => $unitPrice,
                'amount' => $amount,
                'type' => 'usage',
                'usage_type' => $type,
            ];
        }

        if (empty($lineItems)) {
            return null;
        }

        $subtotal = array_sum(array_column($lineItems, 'amount'));
        $taxRate = $this->getTaxRate($tenant);
        $taxAmount = round($subtotal * ($taxRate / 100), 2);
        $total = $subtotal + $taxAmount;

        $invoice = [
            'invoice_number' => $this->generateInvoiceNumber($tenant, 'USG'),
            'tenant_id' => $tenant->id,
            'type' => self::TYPE_USAGE,
            'status' => self::STATUS_PENDING,
            'currency' => 'USD',
            'billing_period_start' => $billingPeriodStart->toDateString(),
            'billing_period_end' => $billingPeriodEnd->toDateString(),
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(15)->toDateString(),
            'line_items' => $lineItems,
            'subtotal' => $subtotal,
            'tax_rate' => $taxRate,
            'tax_amount' => $taxAmount,
            'credits_applied' => 0,
            'total' => $total,
            'amount_due' => $total,
            'notes' => 'Usage-based charges for additional consumption beyond plan limits.',
            'created_at' => now()->toDateTimeString(),
        ];

        // Store the invoice
        $this->storeInvoice($tenant, $invoice);

        // Mark usage records as billed
        UsageRecord::whereIn('id', $usageRecords->pluck('id'))
            ->update(['billed' => true, 'billed_at' => now()]);

        return $invoice;
    }

    /**
     * Generate PDF for an invoice.
     *
     * @param array $invoice
     * @param Tenant|null $tenant
     * @return \Barryvdh\DomPDF\PDF
     */
    public function generatePdf(array $invoice, ?Tenant $tenant = null): \Barryvdh\DomPDF\PDF
    {
        if (! $tenant && isset($invoice['tenant_id'])) {
            $tenant = Tenant::find($invoice['tenant_id']);
        }

        $branding = $this->brandingService->getTenantBranding($tenant);
        $orgInfo = $this->brandingService->getOrganizationInfo($tenant);
        $customerInfo = $this->getCustomerInfo($tenant);

        $data = [
            'invoice' => $invoice,
            'branding' => $branding,
            'organization' => $orgInfo,
            'customer' => $customerInfo,
            'logoUrl' => $this->brandingService->getTenantLogo($tenant),
        ];

        $pdf = Pdf::loadView('platform::invoices.template', $data);
        $pdf->setPaper('a4');

        return $pdf;
    }

    /**
     * Download invoice as PDF.
     *
     * @param array $invoice
     * @param Tenant|null $tenant
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function downloadPdf(array $invoice, ?Tenant $tenant = null)
    {
        $pdf = $this->generatePdf($invoice, $tenant);
        $filename = "invoice-{$invoice['invoice_number']}.pdf";

        return $pdf->download($filename);
    }

    /**
     * Store PDF to storage.
     *
     * @param array $invoice
     * @param Tenant|null $tenant
     * @return string Path to stored PDF
     */
    public function storePdf(array $invoice, ?Tenant $tenant = null): string
    {
        $pdf = $this->generatePdf($invoice, $tenant);
        $tenantId = $invoice['tenant_id'];
        $filename = "invoices/{$tenantId}/{$invoice['invoice_number']}.pdf";

        Storage::disk('private')->put($filename, $pdf->output());

        return $filename;
    }

    /**
     * Get invoice by number.
     *
     * @param Tenant $tenant
     * @param string $invoiceNumber
     * @return array|null
     */
    public function getInvoice(Tenant $tenant, string $invoiceNumber): ?array
    {
        $invoices = $tenant->data['invoices'] ?? [];

        return $invoices[$invoiceNumber] ?? null;
    }

    /**
     * Get all invoices for a tenant.
     *
     * @param Tenant $tenant
     * @param array $filters
     * @return Collection
     */
    public function getInvoices(Tenant $tenant, array $filters = []): Collection
    {
        $invoices = collect($tenant->data['invoices'] ?? []);

        // Apply filters
        if (isset($filters['status'])) {
            $invoices = $invoices->where('status', $filters['status']);
        }

        if (isset($filters['type'])) {
            $invoices = $invoices->where('type', $filters['type']);
        }

        if (isset($filters['from_date'])) {
            $invoices = $invoices->filter(function ($invoice) use ($filters) {
                return Carbon::parse($invoice['issue_date'])->gte($filters['from_date']);
            });
        }

        if (isset($filters['to_date'])) {
            $invoices = $invoices->filter(function ($invoice) use ($filters) {
                return Carbon::parse($invoice['issue_date'])->lte($filters['to_date']);
            });
        }

        return $invoices->sortByDesc('issue_date')->values();
    }

    /**
     * Mark invoice as paid.
     *
     * @param Tenant $tenant
     * @param string $invoiceNumber
     * @param array $paymentDetails
     * @return array Updated invoice
     */
    public function markAsPaid(
        Tenant $tenant,
        string $invoiceNumber,
        array $paymentDetails = []
    ): array {
        $invoices = $tenant->data['invoices'] ?? [];

        if (! isset($invoices[$invoiceNumber])) {
            throw new \RuntimeException("Invoice {$invoiceNumber} not found.");
        }

        $invoices[$invoiceNumber]['status'] = self::STATUS_PAID;
        $invoices[$invoiceNumber]['paid_at'] = now()->toDateTimeString();
        $invoices[$invoiceNumber]['payment_method'] = $paymentDetails['method'] ?? null;
        $invoices[$invoiceNumber]['payment_reference'] = $paymentDetails['reference'] ?? null;
        $invoices[$invoiceNumber]['amount_paid'] = $paymentDetails['amount'] ?? $invoices[$invoiceNumber]['amount_due'];

        $data = $tenant->data;
        $data['invoices'] = $invoices;
        $tenant->update(['data' => $data]);

        Log::info("Invoice {$invoiceNumber} marked as paid for tenant {$tenant->id}");

        return $invoices[$invoiceNumber];
    }

    /**
     * Cancel an invoice.
     *
     * @param Tenant $tenant
     * @param string $invoiceNumber
     * @param string $reason
     * @return array
     */
    public function cancelInvoice(Tenant $tenant, string $invoiceNumber, string $reason = ''): array
    {
        $invoices = $tenant->data['invoices'] ?? [];

        if (! isset($invoices[$invoiceNumber])) {
            throw new \RuntimeException("Invoice {$invoiceNumber} not found.");
        }

        if ($invoices[$invoiceNumber]['status'] === self::STATUS_PAID) {
            throw new \RuntimeException('Cannot cancel a paid invoice. Use refund instead.');
        }

        $invoices[$invoiceNumber]['status'] = self::STATUS_CANCELLED;
        $invoices[$invoiceNumber]['cancelled_at'] = now()->toDateTimeString();
        $invoices[$invoiceNumber]['cancellation_reason'] = $reason;

        // Restore credits if any were applied
        if (($invoices[$invoiceNumber]['credits_applied'] ?? 0) > 0) {
            $this->addCredits(
                $tenant,
                $invoices[$invoiceNumber]['credits_applied'],
                "Credits restored from cancelled invoice {$invoiceNumber}"
            );
        }

        $data = $tenant->data;
        $data['invoices'] = $invoices;
        $tenant->update(['data' => $data]);

        return $invoices[$invoiceNumber];
    }

    /**
     * Issue a refund/credit note.
     *
     * @param Tenant $tenant
     * @param string $originalInvoiceNumber
     * @param float $amount
     * @param string $reason
     * @return array Credit note invoice
     */
    public function issueRefund(
        Tenant $tenant,
        string $originalInvoiceNumber,
        float $amount,
        string $reason
    ): array {
        $originalInvoice = $this->getInvoice($tenant, $originalInvoiceNumber);

        if (! $originalInvoice) {
            throw new \RuntimeException("Original invoice {$originalInvoiceNumber} not found.");
        }

        if ($amount > $originalInvoice['amount_paid']) {
            throw new \RuntimeException('Refund amount exceeds paid amount.');
        }

        $creditNote = [
            'invoice_number' => $this->generateInvoiceNumber($tenant, 'CR'),
            'tenant_id' => $tenant->id,
            'type' => self::TYPE_CREDIT,
            'status' => self::STATUS_PAID,
            'currency' => $originalInvoice['currency'],
            'issue_date' => now()->toDateString(),
            'line_items' => [
                [
                    'description' => "Refund for Invoice {$originalInvoiceNumber}",
                    'quantity' => 1,
                    'unit_price' => -$amount,
                    'amount' => -$amount,
                    'type' => 'refund',
                ],
            ],
            'subtotal' => -$amount,
            'tax_rate' => 0,
            'tax_amount' => 0,
            'total' => -$amount,
            'amount_due' => 0,
            'notes' => $reason,
            'metadata' => [
                'original_invoice' => $originalInvoiceNumber,
                'refund_reason' => $reason,
            ],
            'created_at' => now()->toDateTimeString(),
        ];

        $this->storeInvoice($tenant, $creditNote);

        // Add the refund amount as credit
        $this->addCredits($tenant, $amount, "Refund from invoice {$originalInvoiceNumber}");

        // Update original invoice
        $invoices = $tenant->data['invoices'] ?? [];
        $invoices[$originalInvoiceNumber]['refunded_amount'] =
            ($invoices[$originalInvoiceNumber]['refunded_amount'] ?? 0) + $amount;

        if ($invoices[$originalInvoiceNumber]['refunded_amount'] >= $invoices[$originalInvoiceNumber]['amount_paid']) {
            $invoices[$originalInvoiceNumber]['status'] = self::STATUS_REFUNDED;
        }

        $data = $tenant->data;
        $data['invoices'] = $invoices;
        $tenant->update(['data' => $data]);

        return $creditNote;
    }

    /**
     * Check and mark overdue invoices.
     *
     * @return int Number of invoices marked as overdue
     */
    public function processOverdueInvoices(): int
    {
        $count = 0;

        Tenant::chunk(100, function ($tenants) use (&$count) {
            foreach ($tenants as $tenant) {
                $invoices = $tenant->data['invoices'] ?? [];
                $updated = false;

                foreach ($invoices as $number => &$invoice) {
                    if (
                        $invoice['status'] === self::STATUS_PENDING &&
                        Carbon::parse($invoice['due_date'])->isPast()
                    ) {
                        $invoice['status'] = self::STATUS_OVERDUE;
                        $updated = true;
                        $count++;
                    }
                }

                if ($updated) {
                    $data = $tenant->data;
                    $data['invoices'] = $invoices;
                    $tenant->update(['data' => $data]);
                }
            }
        });

        return $count;
    }

    /**
     * Get invoice summary/statistics for a tenant.
     *
     * @param Tenant $tenant
     * @return array
     */
    public function getInvoiceSummary(Tenant $tenant): array
    {
        $invoices = collect($tenant->data['invoices'] ?? []);

        return [
            'total_invoices' => $invoices->count(),
            'total_revenue' => $invoices->where('status', self::STATUS_PAID)->sum('amount_paid'),
            'pending_amount' => $invoices->where('status', self::STATUS_PENDING)->sum('amount_due'),
            'overdue_amount' => $invoices->where('status', self::STATUS_OVERDUE)->sum('amount_due'),
            'by_status' => [
                'paid' => $invoices->where('status', self::STATUS_PAID)->count(),
                'pending' => $invoices->where('status', self::STATUS_PENDING)->count(),
                'overdue' => $invoices->where('status', self::STATUS_OVERDUE)->count(),
                'cancelled' => $invoices->where('status', self::STATUS_CANCELLED)->count(),
            ],
            'available_credits' => $this->getAvailableCredits($tenant),
        ];
    }

    /**
     * Generate a unique invoice number.
     *
     * @param Tenant $tenant
     * @param string $prefix
     * @return string
     */
    protected function generateInvoiceNumber(Tenant $tenant, string $prefix = 'INV'): string
    {
        $year = now()->format('Y');
        $month = now()->format('m');
        $tenantCode = strtoupper(substr($tenant->id, 0, 4));

        // Get next sequence number
        $invoices = $tenant->data['invoices'] ?? [];
        $sequence = count($invoices) + 1;

        return sprintf('%s-%s%s-%s-%04d', $prefix, $year, $month, $tenantCode, $sequence);
    }

    /**
     * Store invoice in tenant data.
     *
     * @param Tenant $tenant
     * @param array $invoice
     * @return void
     */
    protected function storeInvoice(Tenant $tenant, array $invoice): void
    {
        $data = $tenant->data ?? [];
        $data['invoices'] = $data['invoices'] ?? [];
        $data['invoices'][$invoice['invoice_number']] = $invoice;

        $tenant->update(['data' => $data]);

        Log::info("Invoice {$invoice['invoice_number']} created for tenant {$tenant->id}");
    }

    /**
     * Get active add-ons for a tenant.
     *
     * @param Tenant $tenant
     * @return array
     */
    protected function getActiveAddOns(Tenant $tenant): array
    {
        return $tenant->data['active_addons'] ?? [];
    }

    /**
     * Get tax rate for a tenant.
     *
     * @param Tenant $tenant
     * @return float
     */
    protected function getTaxRate(Tenant $tenant): float
    {
        // Check tenant billing address for tax rate
        $billingAddress = $tenant->billingAddress;

        if ($billingAddress && isset($billingAddress->tax_rate)) {
            return (float) $billingAddress->tax_rate;
        }

        // Default tax rates by country (simplified)
        $country = $billingAddress->country ?? null;

        $taxRates = [
            'US' => 0,      // Varies by state, default 0
            'GB' => 20,     // UK VAT
            'DE' => 19,     // Germany VAT
            'FR' => 20,     // France VAT
            'CA' => 5,      // Canada GST
            'AU' => 10,     // Australia GST
            'IN' => 18,     // India GST
            'BD' => 15,     // Bangladesh VAT
        ];

        return $taxRates[$country] ?? 0;
    }

    /**
     * Get available credits for a tenant.
     *
     * @param Tenant $tenant
     * @return float
     */
    protected function getAvailableCredits(Tenant $tenant): float
    {
        return (float) ($tenant->data['available_credits'] ?? 0);
    }

    /**
     * Deduct credits from tenant.
     *
     * @param Tenant $tenant
     * @param float $amount
     * @param string $reference
     * @return void
     */
    protected function deductCredits(Tenant $tenant, float $amount, string $reference): void
    {
        $data = $tenant->data ?? [];
        $data['available_credits'] = max(0, ($data['available_credits'] ?? 0) - $amount);

        $data['credit_history'] = $data['credit_history'] ?? [];
        $data['credit_history'][] = [
            'type' => 'debit',
            'amount' => $amount,
            'reference' => $reference,
            'date' => now()->toDateTimeString(),
        ];

        $tenant->update(['data' => $data]);
    }

    /**
     * Add credits to tenant.
     *
     * @param Tenant $tenant
     * @param float $amount
     * @param string $reason
     * @return void
     */
    public function addCredits(Tenant $tenant, float $amount, string $reason): void
    {
        $data = $tenant->data ?? [];
        $data['available_credits'] = ($data['available_credits'] ?? 0) + $amount;

        $data['credit_history'] = $data['credit_history'] ?? [];
        $data['credit_history'][] = [
            'type' => 'credit',
            'amount' => $amount,
            'reason' => $reason,
            'date' => now()->toDateTimeString(),
        ];

        $tenant->update(['data' => $data]);
    }

    /**
     * Get customer info for invoice.
     *
     * @param Tenant|null $tenant
     * @return array
     */
    protected function getCustomerInfo(?Tenant $tenant): array
    {
        if (! $tenant) {
            return [];
        }

        $billing = $tenant->billingAddress;

        return [
            'name' => $billing->company_name ?? $tenant->name,
            'email' => $billing->email ?? null,
            'address' => $billing->address ?? null,
            'city' => $billing->city ?? null,
            'state' => $billing->state ?? null,
            'postal_code' => $billing->postal_code ?? null,
            'country' => $billing->country ?? null,
            'tax_id' => $billing->tax_id ?? null,
        ];
    }

    /**
     * Get usage unit price.
     *
     * @param string $usageType
     * @return float
     */
    protected function getUsageUnitPrice(string $usageType): float
    {
        $prices = [
            'api_calls' => 0.0001,      // $0.0001 per API call
            'storage_gb' => 0.10,       // $0.10 per GB
            'bandwidth_gb' => 0.05,     // $0.05 per GB
            'sms' => 0.05,              // $0.05 per SMS
            'email' => 0.001,           // $0.001 per email
            'users' => 5.00,            // $5 per additional user
        ];

        return $prices[$usageType] ?? 0.01;
    }

    /**
     * Get human-readable description for usage type.
     *
     * @param string $usageType
     * @return string
     */
    protected function getUsageDescription(string $usageType): string
    {
        $descriptions = [
            'api_calls' => 'Additional API Calls',
            'storage_gb' => 'Additional Storage (GB)',
            'bandwidth_gb' => 'Data Transfer (GB)',
            'sms' => 'SMS Messages',
            'email' => 'Email Messages',
            'users' => 'Additional Users',
        ];

        return $descriptions[$usageType] ?? ucwords(str_replace('_', ' ', $usageType));
    }
}
