<?php

declare(strict_types=1);

namespace Aero\Platform\Exceptions;

use Exception;

/**
 * Quota Exceeded Exception
 *
 * Thrown when a tenant operation would exceed quota limits.
 */
class QuotaExceededException extends Exception
{
    protected string $quotaType;
    protected int $limit;
    protected int $current;

    public function __construct(
        string $quotaType,
        int $limit,
        int $current,
        string $message = ''
    ) {
        $this->quotaType = $quotaType;
        $this->limit = $limit;
        $this->current = $current;

        if (empty($message)) {
            $message = "Quota exceeded for {$quotaType}: {$current}/{$limit}";
        }

        parent::__construct($message, 402);
    }

    public function getQuotaType(): string
    {
        return $this->quotaType;
    }

    public function getLimit(): int
    {
        return $this->limit;
    }

    public function getCurrent(): int
    {
        return $this->current;
    }

    public function toArray(): array
    {
        return [
            'error' => 'Quota Exceeded',
            'quota_type' => $this->quotaType,
            'limit' => $this->limit,
            'current' => $this->current,
            'message' => $this->getMessage(),
        ];
    }
}
