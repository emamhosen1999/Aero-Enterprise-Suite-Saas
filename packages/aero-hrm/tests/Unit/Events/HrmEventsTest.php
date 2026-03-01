<?php

namespace Aero\HRM\Tests\Unit\Events;

use Aero\HRM\Events\ContractExpiring;
use Aero\HRM\Events\DocumentExpiring;
use Aero\HRM\Events\EmployeeBirthday;
use Aero\HRM\Events\ProbationEnding;
use Aero\HRM\Events\WorkAnniversary;
use Aero\HRM\Models\Employee;
use Aero\HRM\Models\EmployeePersonalDocument;
use Illuminate\Foundation\Events\Dispatchable;
use Mockery;
use PHPUnit\Framework\TestCase;

class HrmEventsTest extends TestCase
{
    protected function tearDown(): void
    {
        parent::tearDown();
        Mockery::close();
    }

    /**
     * Create a mock Employee object.
     */
    protected function createMockEmployee(): Employee
    {
        $employee = Mockery::mock(Employee::class);
        $employee->shouldReceive('getAttribute')->with('id')->andReturn(1);
        $employee->shouldReceive('getAttribute')->with('user_id')->andReturn(1);
        $employee->id = 1;
        $employee->user_id = 1;

        return $employee;
    }

    /**
     * Create a mock EmployeePersonalDocument object.
     */
    protected function createMockDocument(): EmployeePersonalDocument
    {
        $document = Mockery::mock(EmployeePersonalDocument::class);
        $document->shouldReceive('getAttribute')->with('id')->andReturn(1);
        $document->shouldReceive('getAttribute')->with('document_type')->andReturn('Passport');
        $document->id = 1;
        $document->document_type = 'Passport';

        return $document;
    }

    /**
     * Test EmployeeBirthday event stores employee and age.
     */
    public function test_employee_birthday_event_stores_data(): void
    {
        $employee = $this->createMockEmployee();
        $age = 30;

        $event = new EmployeeBirthday($employee, $age);

        $this->assertSame($employee, $event->employee);
        $this->assertEquals(30, $event->age);
    }

    /**
     * Test EmployeeBirthday event uses Dispatchable trait.
     */
    public function test_employee_birthday_uses_dispatchable(): void
    {
        $event = new EmployeeBirthday($this->createMockEmployee(), 25);

        $this->assertContains(
            Dispatchable::class,
            class_uses_recursive($event)
        );
    }

    /**
     * Test WorkAnniversary event stores employee and years of service.
     */
    public function test_work_anniversary_event_stores_data(): void
    {
        $employee = $this->createMockEmployee();
        $years = 5;

        $event = new WorkAnniversary($employee, $years);

        $this->assertSame($employee, $event->employee);
        $this->assertEquals(5, $event->yearsOfService);
    }

    /**
     * Test DocumentExpiring event stores document and days.
     */
    public function test_document_expiring_event_stores_data(): void
    {
        $document = $this->createMockDocument();
        $daysUntilExpiry = 14;

        $event = new DocumentExpiring($document, $daysUntilExpiry);

        $this->assertSame($document, $event->document);
        $this->assertEquals(14, $event->daysUntilExpiry);
    }

    /**
     * Test ProbationEnding event stores employee and days.
     */
    public function test_probation_ending_event_stores_data(): void
    {
        $employee = $this->createMockEmployee();
        $daysRemaining = 7;

        $event = new ProbationEnding($employee, $daysRemaining);

        $this->assertSame($employee, $event->employee);
        $this->assertEquals(7, $event->daysRemaining);
    }

    /**
     * Test ContractExpiring event stores employee and days.
     */
    public function test_contract_expiring_event_stores_data(): void
    {
        $employee = $this->createMockEmployee();
        $daysRemaining = 30;

        $event = new ContractExpiring($employee, $daysRemaining);

        $this->assertSame($employee, $event->employee);
        $this->assertEquals(30, $event->daysRemaining);
    }

    /**
     * Test that all events use SerializesModels trait.
     */
    public function test_events_serialize_models(): void
    {
        $events = [
            new EmployeeBirthday($this->createMockEmployee(), 25),
            new WorkAnniversary($this->createMockEmployee(), 5),
            new DocumentExpiring($this->createMockDocument(), 14),
            new ProbationEnding($this->createMockEmployee(), 7),
            new ContractExpiring($this->createMockEmployee(), 30),
        ];

        foreach ($events as $event) {
            $traits = class_uses_recursive($event);
            $this->assertContains(
                \Illuminate\Queue\SerializesModels::class,
                $traits,
                get_class($event).' should use SerializesModels trait'
            );
        }
    }
}
