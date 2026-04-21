<?php

declare(strict_types=1);

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\Payroll;
use Aero\HRM\Models\PayrollAllowance;
use Aero\HRM\Models\PayrollDeduction;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PayrollModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_creates_payroll_via_factory(): void
    {
        $payroll = Payroll::factory()->create();

        $this->assertInstanceOf(Payroll::class, $payroll);
        $this->assertNotNull($payroll->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_employee(): void
    {
        $employee = Employee::factory()->create();
        $payroll = Payroll::factory()->create(['employee_id' => $employee->id]);

        $this->assertInstanceOf(Employee::class, $payroll->employee);
        $this->assertEquals($employee->id, $payroll->employee->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_allowances_relationship(): void
    {
        $payroll = Payroll::factory()->create();
        PayrollAllowance::factory()->count(3)->create(['payroll_id' => $payroll->id]);

        $this->assertCount(3, $payroll->allowances);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_deductions_relationship(): void
    {
        $payroll = Payroll::factory()->create();
        PayrollDeduction::factory()->count(2)->create(['payroll_id' => $payroll->id]);

        $this->assertCount(2, $payroll->deductions);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_draft_and_processed_statuses(): void
    {
        $draft = Payroll::factory()->create(['status' => 'draft']);
        $processed = Payroll::factory()->create(['status' => 'processed']);

        $this->assertTrue($draft->isDraft());
        $this->assertTrue($processed->isProcessed());
        $this->assertFalse($draft->isProcessed());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_calculates_net_salary(): void
    {
        $payroll = Payroll::factory()->create([
            'basic_salary' => 5000.00,
            'gross_salary' => 6000.00,
            'total_deductions' => 1000.00,
            'net_salary' => 5000.00,
        ]);

        $this->assertEquals(5000.00, $payroll->net_salary);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_scope_by_status(): void
    {
        Payroll::factory()->count(3)->create(['status' => 'draft']);
        Payroll::factory()->count(2)->create(['status' => 'processed']);

        $this->assertEquals(3, Payroll::byStatus('draft')->count());
        $this->assertEquals(2, Payroll::byStatus('processed')->count());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_stores_pay_period_dates(): void
    {
        $payroll = Payroll::factory()->create([
            'pay_period_start' => '2026-04-01',
            'pay_period_end' => '2026-04-30',
        ]);

        $this->assertNotNull($payroll->pay_period_start);
        $this->assertNotNull($payroll->pay_period_end);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_filters_payroll_by_pay_period(): void
    {
        $payroll = Payroll::factory()->create([
            'pay_period_start' => '2026-04-01',
            'pay_period_end' => '2026-04-30',
        ]);

        $results = Payroll::byPayPeriod('2026-04-01', '2026-04-30')->get();
        $this->assertGreaterThan(0, $results->count());
    }
}
