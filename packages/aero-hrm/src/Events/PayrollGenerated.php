<?php

declare(strict_types=1);

namespace Aero\HRM\Events;

use Aero\HRM\Models\Payroll;

/**
 * PayrollGenerated Event
 *
 * Dispatched when a payroll is generated.
 */
class PayrollGenerated extends BaseHrmEvent
{
    public function __construct(
        public readonly Payroll $payroll,
        ?int $generatedByEmployeeId = null,
        array $metadata = []
    ) {
        parent::__construct($generatedByEmployeeId, $metadata);
    }

    public function getSubModuleCode(): string
    {
        return 'payroll';
    }

    public function getComponentCode(): ?string
    {
        return 'payroll-processing';
    }

    public function getActionCode(): string
    {
        return 'generate';
    }

    public function getEntityId(): int
    {
        return $this->payroll->id;
    }

    public function getEntityType(): string
    {
        return 'payroll';
    }

    public function getNotificationContext(): array
    {
        return array_merge(parent::getNotificationContext(), [
            'payroll_id' => $this->payroll->id,
            'user_id' => $this->payroll->user_id,
            'pay_period_start' => $this->payroll->pay_period_start?->toDateString(),
            'pay_period_end' => $this->payroll->pay_period_end?->toDateString(),
            'net_salary' => $this->payroll->net_salary,
        ]);
    }
}
