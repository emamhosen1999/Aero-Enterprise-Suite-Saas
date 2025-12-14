<?php

namespace Aero\Core\Http\Controllers\Settings;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Services\Billing\InvoiceBrandingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * Invoice Branding Controller
 *
 * Handles tenant-specific invoice branding settings including logo,
 * colors, company info, and payment details.
 */
class InvoiceBrandingController extends Controller
{
    public function __construct(
        protected InvoiceBrandingService $brandingService
    ) {}

    /**
     * Display the invoice branding settings page.
     */
    public function index(): InertiaResponse
    {
        $branding = $this->brandingService->getTenantBranding();

        return Inertia::render('Pages/Core/Settings/InvoiceBrandingSettings', [
            'branding' => $branding,
            'previewUrl' => route('settings.invoice-branding.preview'),
        ]);
    }

    /**
     * Save invoice branding settings.
     */
    public function save(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'company_name' => ['nullable', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'max:2048', 'mimes:jpeg,png,gif,svg'],
            'remove_logo' => ['nullable', 'boolean'],
            'primary_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:50'],
            'email' => ['nullable', 'email', 'max:255'],
            'website' => ['nullable', 'url', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:100'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'account_number' => ['nullable', 'string', 'max:50'],
            'routing_number' => ['nullable', 'string', 'max:50'],
            'swift_code' => ['nullable', 'string', 'max:20'],
            'payment_instructions' => ['nullable', 'string', 'max:1000'],
            'thank_you_message' => ['nullable', 'string', 'max:255'],
            'footer_text' => ['nullable', 'string', 'max:500'],
            'terms' => ['nullable', 'string', 'max:2000'],
        ]);

        $tenant = tenant();

        // Get existing settings
        $settings = $tenant->settings ?? [];
        $invoiceBranding = $settings['invoice_branding'] ?? [];

        // Handle logo upload
        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if (! empty($invoiceBranding['logo_path'])) {
                Storage::disk('public')->delete($invoiceBranding['logo_path']);
            }

            $path = $request->file('logo')->store(
                "tenants/{$tenant->id}/branding",
                'public'
            );

            $invoiceBranding['logo_path'] = $path;
            $invoiceBranding['logo_url'] = Storage::disk('public')->url($path);
        } elseif ($request->boolean('remove_logo')) {
            // Remove existing logo
            if (! empty($invoiceBranding['logo_path'])) {
                Storage::disk('public')->delete($invoiceBranding['logo_path']);
            }
            $invoiceBranding['logo_path'] = null;
            $invoiceBranding['logo_url'] = null;
        }

        // Update branding settings
        $fieldsToUpdate = [
            'company_name',
            'primary_color',
            'secondary_color',
            'address',
            'phone',
            'email',
            'website',
            'tax_id',
            'bank_name',
            'account_number',
            'routing_number',
            'swift_code',
            'payment_instructions',
            'thank_you_message',
            'footer_text',
            'terms',
        ];

        foreach ($fieldsToUpdate as $field) {
            if (array_key_exists($field, $validated)) {
                $invoiceBranding[$field] = $validated[$field];
            }
        }

        // Save to tenant settings
        $settings['invoice_branding'] = $invoiceBranding;
        $tenant->settings = $settings;
        $tenant->save();

        return response()->json([
            'success' => true,
            'message' => 'Invoice branding settings saved successfully.',
            'branding' => $invoiceBranding,
        ]);
    }

    /**
     * Preview invoice with current branding.
     */
    public function preview(): \Illuminate\Http\Response
    {
        $branding = $this->brandingService->getTenantBranding();

        // Generate sample invoice data
        $sampleInvoice = [
            'invoice_number' => 'INV-PREVIEW-001',
            'issue_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'status' => 'pending',
            'currency_symbol' => '$',
            'customer' => [
                'name' => 'John Doe',
                'company' => 'Acme Corporation',
                'email' => 'john@acme.com',
                'address' => "456 Customer Ave\nSuite 789\nNew York, NY 10001",
            ],
            'items' => [
                [
                    'name' => 'Professional Services',
                    'description' => 'Monthly subscription - Enterprise Plan',
                    'quantity' => 1,
                    'unit_price' => 299.00,
                ],
                [
                    'name' => 'Additional Users',
                    'description' => '10 additional user seats',
                    'quantity' => 10,
                    'unit_price' => 15.00,
                ],
                [
                    'name' => 'Premium Support',
                    'description' => 'Priority support package',
                    'quantity' => 1,
                    'unit_price' => 99.00,
                ],
            ],
            'subtotal' => 548.00,
            'tax_rate' => 8.25,
            'tax' => 45.21,
            'discount' => 0,
            'total' => 593.21,
            'amount_paid' => 0,
            'notes' => 'This is a preview invoice with sample data.',
            'terms' => $branding['terms'] ?? 'Payment is due within 30 days of invoice date.',
        ];

        $pdf = $this->brandingService->generateBrandedInvoice($sampleInvoice);

        return response($pdf)
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="invoice-preview.pdf"');
    }

    /**
     * Download a branded invoice PDF.
     */
    public function download(string $invoiceId): \Illuminate\Http\Response
    {
        // This would typically fetch the invoice from database
        // For now, return a placeholder response
        return response()->json([
            'success' => false,
            'message' => 'Invoice download endpoint - integration required.',
        ], 501);
    }
}
