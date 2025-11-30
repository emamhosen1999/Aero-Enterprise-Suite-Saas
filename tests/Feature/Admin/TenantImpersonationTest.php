<?php

namespace Tests\Feature\Admin;

use App\Models\TenantImpersonationToken;
use Tests\TestCase;

/**
 * Tests for the Tenant Impersonation functionality.
 *
 * Note: Full integration tests require a multi-tenant database setup.
 * These tests focus on the TenantImpersonationToken model logic.
 */
class TenantImpersonationTest extends TestCase
{
    public function test_impersonation_token_model_generates_secure_token(): void
    {
        $token = TenantImpersonationToken::generateToken();

        $this->assertIsString($token);
        $this->assertEquals(64, strlen($token)); // SHA256 produces 64 hex characters
    }

    public function test_impersonation_token_is_unique_each_time(): void
    {
        $token1 = TenantImpersonationToken::generateToken();
        $token2 = TenantImpersonationToken::generateToken();

        $this->assertNotEquals($token1, $token2);
    }

    public function test_impersonation_token_expiration_minutes_is_reasonable(): void
    {
        // Token should expire in a reasonable time frame (1-15 minutes)
        $this->assertGreaterThanOrEqual(1, TenantImpersonationToken::EXPIRATION_MINUTES);
        $this->assertLessThanOrEqual(15, TenantImpersonationToken::EXPIRATION_MINUTES);
    }

    public function test_token_is_expired_based_on_created_at(): void
    {
        $token = new TenantImpersonationToken;
        $token->created_at = now()->subMinutes(TenantImpersonationToken::EXPIRATION_MINUTES + 1);

        $this->assertTrue($token->isExpired());
    }

    public function test_fresh_token_is_not_expired(): void
    {
        $token = new TenantImpersonationToken;
        $token->created_at = now();

        $this->assertFalse($token->isExpired());
    }

    public function test_token_just_before_expiration_threshold_is_not_expired(): void
    {
        $token = new TenantImpersonationToken;
        // One second before expiration
        $token->created_at = now()->subMinutes(TenantImpersonationToken::EXPIRATION_MINUTES)->addSecond();

        $this->assertFalse($token->isExpired());
    }

    public function test_token_one_second_past_threshold_is_expired(): void
    {
        $token = new TenantImpersonationToken;
        $token->created_at = now()->subMinutes(TenantImpersonationToken::EXPIRATION_MINUTES)->subSecond();

        $this->assertTrue($token->isExpired());
    }
}
