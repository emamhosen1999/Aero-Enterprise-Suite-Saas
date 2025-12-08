<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Monitoring\Tenant;

use Illuminate\Contracts\Session\Session;

class TenantRegistrationSession
{
    private const SESSION_KEY = 'tenant_registration';

    private const SUCCESS_KEY = 'tenant_registration_success';

    public function __construct(private Session $session) {}

    public function putStep(string $step, array $payload): array
    {
        $data = $this->get();
        $data[$step] = $payload;

        $this->session->put(self::SESSION_KEY, $data);

        return $data;
    }

    public function get(): array
    {
        return $this->session->get(self::SESSION_KEY, []);
    }

    /**
     * Get a specific step's data.
     */
    public function getStep(string $step): ?array
    {
        $data = $this->get();

        return $data[$step] ?? null;
    }

    public function hasStep(string $step): bool
    {
        return array_key_exists($step, $this->get());
    }

    public function ensureSteps(array $steps): bool
    {
        $data = $this->get();

        foreach ($steps as $step) {
            if (! array_key_exists($step, $data)) {
                return false;
            }
        }

        return true;
    }

    public function clear(): void
    {
        $this->session->forget(self::SESSION_KEY);
    }

    public function rememberSuccess(array $payload): void
    {
        $this->session->put(self::SUCCESS_KEY, $payload);
    }

    public function pullSuccess(): ?array
    {
        /** @var array|null $payload */
        $payload = $this->session->pull(self::SUCCESS_KEY);

        return $payload;
    }
}
