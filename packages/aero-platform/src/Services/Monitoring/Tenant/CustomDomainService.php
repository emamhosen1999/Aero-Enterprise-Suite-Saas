<?php

namespace Aero\Platform\Services\Monitoring\Tenant;

use Aero\Platform\Models\Domain;
use Aero\Platform\Models\Tenant;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Custom Domain Service
 *
 * Handles custom domain registration, DNS verification, and management.
 * The stancl/tenancy package automatically handles domain lookup via
 * InitializeTenancyByDomain middleware - any domain in the domains table
 * will be resolved to its tenant automatically.
 */
class CustomDomainService
{
    /**
     * Reserved/blocked domain patterns that cannot be used.
     * These are checked against the first segment of the domain.
     */
    protected array $blockedPatterns = [
        'admin',
        'api',
        'app',
        'billing',
        'blog',
        'cdn',
        'docs',
        'help',
        'mail',
        'smtp',
        'pop',
        'imap',
        'ftp',
        'ssh',
        'support',
        'status',
        'www',
        'staging',
        'dev',
        'test',
        'platform',
        'register',
        'login',
        'dashboard',
        'install',
    ];

    /**
     * Blocked subdomain prefixes for custom domains.
     * Custom domains cannot start with these prefixes as they conflict
     * with platform infrastructure (e.g., admin.customerdomain.com would
     * be misidentified as platform admin).
     */
    protected array $blockedSubdomainPrefixes = [
        'admin.',
        'api.',
        'www.',
        'mail.',
        'ftp.',
        'cdn.',
    ];

    /**
     * Add a custom domain for a tenant.
     *
     * @throws ValidationException
     */
    public function addDomain(Tenant $tenant, string $domain): Domain
    {
        // Normalize and validate domain
        $domain = $this->normalizeDomain($domain);
        $this->validateDomain($domain);

        // Check if domain already exists
        if (Domain::where('domain', $domain)->exists()) {
            throw ValidationException::withMessages([
                'domain' => ['This domain is already registered in the system.'],
            ]);
        }

        // Check against central domains
        $centralDomains = config('tenancy.central_domains', []);
        foreach ($centralDomains as $centralDomain) {
            if (str_ends_with($domain, $centralDomain) || $domain === $centralDomain) {
                throw ValidationException::withMessages([
                    'domain' => ['You cannot use a subdomain of the platform domain.'],
                ]);
            }
        }

        // Generate verification code
        $verificationCode = $this->generateVerificationCode();

        // Create the domain record
        return Domain::create([
            'domain' => $domain,
            'tenant_id' => $tenant->id,
            'is_primary' => false,
            'is_custom' => true,
            'status' => Domain::STATUS_PENDING,
            'dns_verification_code' => $verificationCode,
            'ssl_status' => Domain::SSL_PENDING,
        ]);
    }

    /**
     * Verify DNS records for a custom domain.
     *
     * Checks for either:
     * 1. TXT record: _eos365-verification.domain.com = eos365-verify=CODE
     * 2. CNAME record: domain.com → tenant.platform-domain.com
     */
    public function verifyDns(Domain $domain): array
    {
        $errors = [];
        $verified = false;

        // Method 1: Check TXT record
        $txtVerified = $this->verifyTxtRecord($domain);
        if ($txtVerified) {
            $verified = true;
        }

        // Method 2: Check CNAME record (alternative verification)
        if (! $verified) {
            $cnameVerified = $this->verifyCnameRecord($domain);
            if ($cnameVerified) {
                $verified = true;
            }
        }

        // Method 3: Check A record points to our server
        if (! $verified) {
            $aRecordVerified = $this->verifyARecord($domain);
            if ($aRecordVerified) {
                // A record alone isn't enough for ownership verification,
                // but we can note it's pointing to us
                $errors[] = 'A record detected but TXT verification required for ownership proof.';
            }
        }

        if ($verified) {
            $domain->markAsVerified();

            return [
                'success' => true,
                'message' => 'Domain verified successfully! SSL provisioning will begin shortly.',
                'domain' => $domain->fresh(),
            ];
        }

        // Gather detailed error information
        if (empty($errors)) {
            $errors[] = 'No valid DNS records found.';
            $errors[] = 'Please add a TXT record: '.$domain->getVerificationTxtRecordName().' = '.$domain->getExpectedTxtRecordValue();
        }

        $domain->update(['verification_errors' => $errors]);

        return [
            'success' => false,
            'message' => 'DNS verification failed.',
            'errors' => $errors,
            'instructions' => $this->getVerificationInstructions($domain),
        ];
    }

    /**
     * Verify TXT record for domain ownership.
     */
    protected function verifyTxtRecord(Domain $domain): bool
    {
        $txtRecordName = $domain->getVerificationTxtRecordName();
        $expectedValue = $domain->getExpectedTxtRecordValue();

        // Try to get TXT records
        $records = @dns_get_record($txtRecordName, DNS_TXT);

        if ($records === false || empty($records)) {
            // Also try without the subdomain prefix (some DNS providers)
            $records = @dns_get_record($domain->domain, DNS_TXT);
        }

        if (! empty($records)) {
            foreach ($records as $record) {
                $txtValue = $record['txt'] ?? '';
                if (str_contains($txtValue, $domain->dns_verification_code)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Verify CNAME record points to tenant subdomain.
     */
    protected function verifyCnameRecord(Domain $domain): bool
    {
        $records = @dns_get_record($domain->domain, DNS_CNAME);

        if (! empty($records)) {
            $tenant = $domain->tenant;
            $primaryDomain = $tenant->domains()->subdomain()->first();

            if ($primaryDomain) {
                foreach ($records as $record) {
                    $target = rtrim($record['target'] ?? '', '.');
                    if ($target === $primaryDomain->domain) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Verify A record points to our server IP.
     */
    protected function verifyARecord(Domain $domain): bool
    {
        $records = @dns_get_record($domain->domain, DNS_A);
        $serverIps = $this->getServerIps();

        if (! empty($records)) {
            foreach ($records as $record) {
                $ip = $record['ip'] ?? '';
                if (in_array($ip, $serverIps, true)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get server IP addresses for A record verification.
     */
    protected function getServerIps(): array
    {
        // Get IPs from config or environment
        $ips = config('tenancy.server_ips', []);

        if (empty($ips)) {
            // Try to detect server IP
            $serverIp = gethostbyname(gethostname());
            if ($serverIp !== gethostname()) {
                $ips[] = $serverIp;
            }
        }

        return $ips;
    }

    /**
     * Remove a custom domain.
     */
    public function removeDomain(Domain $domain): bool
    {
        if (! $domain->isCustom()) {
            throw ValidationException::withMessages([
                'domain' => ['Cannot remove system-generated subdomain.'],
            ]);
        }

        if ($domain->isPrimary()) {
            throw ValidationException::withMessages([
                'domain' => ['Cannot remove primary domain. Set another domain as primary first.'],
            ]);
        }

        return $domain->delete();
    }

    /**
     * Set a verified custom domain as primary.
     */
    public function setPrimary(Domain $domain): bool
    {
        if (! $domain->isVerified()) {
            throw ValidationException::withMessages([
                'domain' => ['Only verified domains can be set as primary.'],
            ]);
        }

        return $domain->makePrimary();
    }

    /**
     * Normalize domain name.
     */
    protected function normalizeDomain(string $domain): string
    {
        // Remove protocol if present
        $domain = preg_replace('#^https?://#', '', $domain);

        // Remove trailing slash and path
        $domain = preg_replace('#/.*$#', '', $domain);

        // Remove www prefix if present
        $domain = preg_replace('#^www\.#', '', $domain);

        // Convert to lowercase
        $domain = strtolower(trim($domain));

        return $domain;
    }

    /**
     * Validate domain format and check against blocked patterns.
     *
     * @throws ValidationException
     */
    protected function validateDomain(string $domain): void
    {
        // Basic format validation
        if (! preg_match('/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/', $domain)) {
            throw ValidationException::withMessages([
                'domain' => ['Invalid domain format.'],
            ]);
        }

        // Must have at least one dot
        if (! str_contains($domain, '.')) {
            throw ValidationException::withMessages([
                'domain' => ['Domain must include a TLD (e.g., .com, .org).'],
            ]);
        }

        // Check blocked first segment patterns
        $firstPart = explode('.', $domain)[0];
        if (in_array($firstPart, $this->blockedPatterns, true)) {
            throw ValidationException::withMessages([
                'domain' => ['This domain pattern is reserved.'],
            ]);
        }

        // Check blocked subdomain prefixes (e.g., admin.customerdomain.com)
        // These would conflict with platform infrastructure
        foreach ($this->blockedSubdomainPrefixes as $prefix) {
            if (str_starts_with($domain, $prefix)) {
                throw ValidationException::withMessages([
                    'domain' => ["Custom domains cannot start with '{$prefix}' as this conflicts with platform infrastructure."],
                ]);
            }
        }
    }

    /**
     * Generate a unique verification code.
     */
    protected function generateVerificationCode(): string
    {
        return Str::uuid()->toString();
    }

    /**
     * Get human-readable verification instructions.
     */
    public function getVerificationInstructions(Domain $domain): array
    {
        $tenant = $domain->tenant;
        $primaryDomain = $tenant->domains()->subdomain()->first();

        return [
            'method_1' => [
                'title' => 'TXT Record (Recommended)',
                'description' => 'Add a TXT record to verify domain ownership.',
                'record_type' => 'TXT',
                'host' => '_eos365-verification',
                'value' => $domain->getExpectedTxtRecordValue(),
                'ttl' => '3600',
            ],
            'method_2' => [
                'title' => 'CNAME Record',
                'description' => 'Point your domain to your tenant subdomain.',
                'record_type' => 'CNAME',
                'host' => '@',
                'value' => $primaryDomain?->domain ?? 'your-subdomain.platform.com',
                'ttl' => '3600',
            ],
            'note' => 'DNS changes can take up to 48 hours to propagate. You can re-check verification at any time.',
        ];
    }

    /**
     * Check pending domains and verify them (for scheduled job).
     */
    public function verifyPendingDomains(): array
    {
        $results = [];
        $pendingDomains = Domain::pending()->custom()->get();

        foreach ($pendingDomains as $domain) {
            $results[$domain->domain] = $this->verifyDns($domain);
        }

        return $results;
    }

    /**
     * Provision SSL for a verified domain (stub for SSL automation).
     */
    public function provisionSSL(Domain $domain): array
    {
        if (! $domain->isVerified()) {
            return [
                'success' => false,
                'message' => 'Domain must be verified before SSL provisioning.',
            ];
        }

        // Update status to provisioning
        $domain->update(['ssl_status' => Domain::SSL_PROVISIONING]);

        // In production, this would trigger Let's Encrypt or your SSL provider
        // For now, we'll mark it as active (manual SSL setup assumed)
        // TODO: Integrate with Caddy/Traefik/certbot for automatic SSL

        return [
            'success' => true,
            'message' => 'SSL provisioning initiated. This may take a few minutes.',
            'domain' => $domain->fresh(),
        ];
    }
}
