<?php

namespace Tests\Feature;

use App\Http\Controllers\Settings\InvoiceBrandingController;
use App\Services\Billing\InvoiceBrandingService;
use Tests\TestCase;

class InvoiceBrandingTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    public function test_invoice_branding_service_can_be_instantiated(): void
    {
        $service = app(InvoiceBrandingService::class);

        $this->assertInstanceOf(InvoiceBrandingService::class, $service);
    }

    public function test_invoice_branding_service_returns_default_branding(): void
    {
        $service = app(InvoiceBrandingService::class);

        $branding = $service->getTenantBranding();

        $this->assertIsArray($branding);
        $this->assertArrayHasKey('primary_color', $branding);
        $this->assertArrayHasKey('thank_you_message', $branding);
        $this->assertEquals('#2563eb', $branding['primary_color']);
        $this->assertEquals('Thank you for your business!', $branding['thank_you_message']);
    }

    public function test_invoice_branding_service_get_tenant_branding_has_required_keys(): void
    {
        $service = app(InvoiceBrandingService::class);

        $branding = $service->getTenantBranding();

        // Check default keys are present
        $requiredKeys = [
            'company_name',
            'logo_url',
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

        foreach ($requiredKeys as $key) {
            $this->assertArrayHasKey($key, $branding, "Missing key: {$key}");
        }
    }

    public function test_invoice_branding_controller_can_be_instantiated(): void
    {
        $service = app(InvoiceBrandingService::class);
        $controller = new InvoiceBrandingController($service);

        $this->assertInstanceOf(InvoiceBrandingController::class, $controller);
    }

    public function test_invoice_template_exists(): void
    {
        $this->assertFileExists(
            resource_path('views/invoices/branded.blade.php'),
            'Branded invoice template should exist'
        );
    }

    public function test_receipt_template_exists(): void
    {
        $this->assertFileExists(
            resource_path('views/invoices/receipt.blade.php'),
            'Receipt template should exist'
        );
    }

    public function test_invoice_template_has_required_placeholders(): void
    {
        $template = file_get_contents(resource_path('views/invoices/branded.blade.php'));

        // Check for essential Blade variables
        $this->assertStringContainsString('$invoice', $template, 'Template should use $invoice variable');
        $this->assertStringContainsString('$branding', $template, 'Template should use $branding variable');
        $this->assertStringContainsString('invoice_number', $template, 'Template should display invoice number');
        $this->assertStringContainsString('issue_date', $template, 'Template should display issue date');
        $this->assertStringContainsString('due_date', $template, 'Template should display due date');
    }

    public function test_receipt_template_has_required_placeholders(): void
    {
        $template = file_get_contents(resource_path('views/invoices/receipt.blade.php'));

        // Check for essential Blade variables
        $this->assertStringContainsString('$receipt', $template, 'Template should use $receipt variable');
        $this->assertStringContainsString('$branding', $template, 'Template should use $branding variable');
        $this->assertStringContainsString('Payment Receipt', $template, 'Template should have receipt title');
    }

    public function test_invoice_branding_service_generates_pdf(): void
    {
        $service = app(InvoiceBrandingService::class);

        $sampleInvoice = [
            'invoice_number' => 'INV-TEST-001',
            'issue_date' => now()->format('Y-m-d'),
            'due_date' => now()->addDays(30)->format('Y-m-d'),
            'status' => 'pending',
            'currency_symbol' => '$',
            'customer' => [
                'name' => 'Test Customer',
                'email' => 'test@example.com',
            ],
            'items' => [
                [
                    'name' => 'Test Service',
                    'quantity' => 1,
                    'unit_price' => 100.00,
                ],
            ],
            'subtotal' => 100.00,
            'tax' => 10.00,
            'total' => 110.00,
        ];

        $pdf = $service->generateBrandedInvoice($sampleInvoice);

        $this->assertNotEmpty($pdf, 'PDF should be generated');
        // PDF files start with %PDF-
        $this->assertStringStartsWith('%PDF-', $pdf, 'Output should be a valid PDF');
    }

    public function test_invoice_branding_service_generates_receipt_pdf(): void
    {
        $service = app(InvoiceBrandingService::class);

        $sampleReceipt = [
            'receipt_number' => 'REC-TEST-001',
            'payment_date' => now()->format('Y-m-d'),
            'amount' => 110.00,
            'currency_symbol' => '$',
            'customer' => [
                'name' => 'Test Customer',
                'email' => 'test@example.com',
            ],
            'payment_method' => 'Credit Card',
            'transaction_id' => 'txn_test123',
        ];

        $pdf = $service->generateBrandedReceipt($sampleReceipt);

        $this->assertNotEmpty($pdf, 'Receipt PDF should be generated');
        $this->assertStringStartsWith('%PDF-', $pdf, 'Output should be a valid PDF');
    }

    public function test_invoice_branding_color_validation_regex(): void
    {
        // Test valid colors
        $validColors = ['#2563eb', '#FFFFFF', '#000000', '#abc123', '#ABC123'];

        foreach ($validColors as $color) {
            $this->assertMatchesRegularExpression(
                '/^#[0-9A-Fa-f]{6}$/',
                $color,
                "Color {$color} should be valid"
            );
        }

        // Test invalid colors
        $invalidColors = ['2563eb', '#fff', '#GGGGGG', 'rgb(0,0,0)', ''];

        foreach ($invalidColors as $color) {
            $this->assertDoesNotMatchRegularExpression(
                '/^#[0-9A-Fa-f]{6}$/',
                $color,
                "Color {$color} should be invalid"
            );
        }
    }
}
