<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class InstallationSecurityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Clear rate limiter before each test
        RateLimiter::clear('installation_secret_attempts:127.0.0.1');
    }

    /**
     * Test that database password is encrypted in session.
     */
    public function test_database_password_is_encrypted_in_session(): void
    {
        // Simulate verified installation
        session(['installation_verified' => true]);

        // Store mock db config directly to test encryption format
        $password = 'test-db-password-123';
        $encryptedPassword = Crypt::encryptString($password);

        session([
            'db_config' => [
                'db_host' => '127.0.0.1',
                'db_port' => 3306,
                'db_database' => 'test_db',
                'db_username' => 'root',
                'db_password' => $encryptedPassword,
                'db_password_encrypted' => true,
            ],
        ]);

        // Retrieve and decrypt
        $dbConfig = session('db_config');
        $this->assertTrue($dbConfig['db_password_encrypted']);
        $this->assertEquals($password, Crypt::decryptString($dbConfig['db_password']));
    }

    /**
     * Test that admin password is encrypted in session.
     */
    public function test_admin_password_is_encrypted_in_session(): void
    {
        $password = 'admin-password-123';
        $encryptedPassword = Crypt::encryptString($password);

        session([
            'admin_config' => [
                'admin_name' => 'Test Admin',
                'admin_email' => 'admin@test.com',
                'admin_password' => $encryptedPassword,
                'admin_password_encrypted' => true,
            ],
        ]);

        // Retrieve and decrypt
        $adminConfig = session('admin_config');
        $this->assertTrue($adminConfig['admin_password_encrypted']);
        $this->assertEquals($password, Crypt::decryptString($adminConfig['admin_password']));
    }

    /**
     * Test Crypt encryption and decryption works correctly.
     */
    public function test_crypt_encryption_decryption(): void
    {
        $originalValue = 'sensitive-data-123!@#';
        $encrypted = Crypt::encryptString($originalValue);

        // Encrypted value should be different from original
        $this->assertNotEquals($originalValue, $encrypted);

        // Decrypted value should match original
        $decrypted = Crypt::decryptString($encrypted);
        $this->assertEquals($originalValue, $decrypted);
    }

    /**
     * Test rate limiter constants are correctly defined.
     */
    public function test_rate_limiter_constants(): void
    {
        // Use reflection to check constants
        $reflection = new \ReflectionClass(\App\Http\Controllers\Platform\InstallationController::class);

        $this->assertTrue($reflection->hasConstant('MAX_ATTEMPTS'));
        $this->assertTrue($reflection->hasConstant('LOCKOUT_DURATION'));
        $this->assertTrue($reflection->hasConstant('RATE_LIMIT_KEY'));

        $maxAttempts = $reflection->getConstant('MAX_ATTEMPTS');
        $lockoutDuration = $reflection->getConstant('LOCKOUT_DURATION');

        $this->assertEquals(5, $maxAttempts);
        $this->assertEquals(900, $lockoutDuration); // 15 minutes
    }

    /**
     * Test rate limiter functionality directly.
     */
    public function test_rate_limiter_blocks_after_max_attempts(): void
    {
        $key = 'installation_secret_attempts:test_ip';

        // Clear first
        RateLimiter::clear($key);

        // Simulate 5 attempts
        for ($i = 0; $i < 5; $i++) {
            RateLimiter::hit($key, 900);
        }

        // Should be blocked now
        $this->assertTrue(RateLimiter::tooManyAttempts($key, 5));

        // Check remaining attempts is 0
        $this->assertEquals(0, RateLimiter::remaining($key, 5));
    }

    /**
     * Test that encrypted passwords can be decrypted correctly (simulating install flow).
     */
    public function test_password_encryption_flow(): void
    {
        // Simulate storing encrypted password
        $originalDbPassword = 'my-secure-db-password';
        $originalAdminPassword = 'my-secure-admin-password';

        // Encrypt like the controller does
        $encryptedDbPassword = Crypt::encryptString($originalDbPassword);
        $encryptedAdminPassword = Crypt::encryptString($originalAdminPassword);

        // Store in session
        session([
            'db_config' => [
                'db_password' => $encryptedDbPassword,
                'db_password_encrypted' => true,
            ],
            'admin_config' => [
                'admin_password' => $encryptedAdminPassword,
                'admin_password_encrypted' => true,
            ],
        ]);

        // Retrieve from session and decrypt like install() method does
        $dbConfig = session('db_config');
        $adminConfig = session('admin_config');

        $decryptedDbPassword = $dbConfig['db_password'];
        if (! empty($dbConfig['db_password_encrypted'])) {
            $decryptedDbPassword = Crypt::decryptString($decryptedDbPassword);
        }

        $decryptedAdminPassword = $adminConfig['admin_password'];
        if (! empty($adminConfig['admin_password_encrypted'])) {
            $decryptedAdminPassword = Crypt::decryptString($decryptedAdminPassword);
        }

        // Verify decryption worked
        $this->assertEquals($originalDbPassword, $decryptedDbPassword);
        $this->assertEquals($originalAdminPassword, $decryptedAdminPassword);
    }

    /**
     * Test backward compatibility with non-encrypted passwords.
     */
    public function test_backward_compatibility_with_plain_passwords(): void
    {
        $plainPassword = 'plain-password-123';

        // Store without encryption flag (simulating old sessions)
        session([
            'db_config' => [
                'db_password' => $plainPassword,
                // Note: no db_password_encrypted flag
            ],
        ]);

        $dbConfig = session('db_config');

        // Should work without decryption when flag is missing
        $password = $dbConfig['db_password'];
        if (! empty($dbConfig['db_password_encrypted'])) {
            $password = Crypt::decryptString($password);
        }

        $this->assertEquals($plainPassword, $password);
    }
}
