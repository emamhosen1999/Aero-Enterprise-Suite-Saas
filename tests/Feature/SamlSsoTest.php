<?php

namespace Tests\Feature;

use App\Http\Controllers\Auth\SamlController;
use App\Services\Auth\SamlService;
use Mockery;
use Tests\TestCase;

class SamlSsoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'saml2.enabled' => true,
            'saml2.auto_provision' => true,
            'saml2.default_role' => 'user',
            'saml2.idps.test' => [
                'entityId' => 'https://idp.example.com/metadata',
                'singleSignOnService' => [
                    'url' => 'https://idp.example.com/sso',
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                ],
                'singleLogoutService' => [
                    'url' => 'https://idp.example.com/slo',
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                ],
                'x509cert' => 'MIICrjCCAZagAwIBAgIJAKO',
            ],
        ]);
    }

    public function test_saml_service_can_be_instantiated(): void
    {
        $service = app(SamlService::class);

        $this->assertInstanceOf(SamlService::class, $service);
    }

    public function test_saml_service_is_enabled_returns_config_value(): void
    {
        // Create a fresh instance each time to pick up new config
        config(['saml2.enabled' => true]);
        $service = new SamlService;
        $this->assertTrue($service->isEnabled());

        config(['saml2.enabled' => false]);
        $service2 = new SamlService;
        $this->assertFalse($service2->isEnabled());
    }

    public function test_saml_service_validates_idp_config(): void
    {
        $service = app(SamlService::class);

        // Invalid config missing required fields
        $errors = $service->validateIdpConfig([]);
        $this->assertNotEmpty($errors);
        $this->assertContains('Entity ID is required', $errors);

        // Valid config
        $validConfig = [
            'entityId' => 'https://idp.example.com',
            'singleSignOnService' => [
                'url' => 'https://idp.example.com/sso',
            ],
            'x509cert' => 'MIICrjCCAZag...',
        ];
        $errors = $service->validateIdpConfig($validConfig);
        $this->assertEmpty($errors);
    }

    public function test_saml_service_get_available_idps(): void
    {
        $service = app(SamlService::class);

        $idps = $service->getAvailableIdps(null);

        $this->assertIsArray($idps);
        $this->assertArrayHasKey('test', $idps);
        $this->assertEquals('test', $idps['test']['name']);
    }

    public function test_saml_attribute_mapping_config(): void
    {
        config([
            'saml2.attribute_mapping' => [
                'email' => ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', 'email'],
                'name' => ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name', 'displayName'],
                'first_name' => ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname', 'firstName'],
                'last_name' => ['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname', 'lastName'],
            ],
        ]);

        $mapping = config('saml2.attribute_mapping');

        $this->assertArrayHasKey('email', $mapping);
        $this->assertContains('email', $mapping['email']);
    }

    public function test_saml_controller_can_be_instantiated(): void
    {
        $service = app(SamlService::class);
        $controller = new SamlController($service);

        $this->assertInstanceOf(SamlController::class, $controller);
    }

    public function test_saml_service_validates_missing_sso_url(): void
    {
        $service = app(SamlService::class);

        $invalidConfig = [
            'entityId' => 'https://idp.example.com',
            'singleSignOnService' => [],
            'x509cert' => 'cert',
        ];

        $errors = $service->validateIdpConfig($invalidConfig);
        $this->assertContains('SSO URL is required', $errors);
    }

    public function test_saml_service_validates_missing_certificate(): void
    {
        $service = app(SamlService::class);

        $invalidConfig = [
            'entityId' => 'https://idp.example.com',
            'singleSignOnService' => [
                'url' => 'https://idp.example.com/sso',
            ],
        ];

        $errors = $service->validateIdpConfig($invalidConfig);
        $this->assertContains('Either X.509 certificate or certificate fingerprint is required', $errors);
    }

    public function test_saml_service_accepts_fingerprint_instead_of_cert(): void
    {
        $service = app(SamlService::class);

        $validConfig = [
            'entityId' => 'https://idp.example.com',
            'singleSignOnService' => [
                'url' => 'https://idp.example.com/sso',
            ],
            'certFingerprint' => 'AB:CD:EF:12:34:56',
        ];

        $errors = $service->validateIdpConfig($validConfig);
        $this->assertEmpty($errors);
    }

    public function test_saml_config_has_required_keys(): void
    {
        $config = config('saml2');

        $this->assertArrayHasKey('enabled', $config);
        $this->assertArrayHasKey('debug', $config);
        $this->assertArrayHasKey('sp', $config);
        $this->assertArrayHasKey('idps', $config);
        $this->assertArrayHasKey('security', $config);
    }

    public function test_saml_sp_config_has_entity_id(): void
    {
        $sp = config('saml2.sp');

        $this->assertArrayHasKey('entityId', $sp);
        $this->assertArrayHasKey('assertionConsumerService', $sp);
    }

    public function test_saml_get_last_errors_returns_empty_when_no_auth(): void
    {
        $service = app(SamlService::class);

        $errors = $service->getLastErrors();
        $this->assertEmpty($errors);
    }

    public function test_saml_get_last_error_reason_returns_null_when_no_auth(): void
    {
        $service = app(SamlService::class);

        $reason = $service->getLastErrorReason();
        $this->assertNull($reason);
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}
