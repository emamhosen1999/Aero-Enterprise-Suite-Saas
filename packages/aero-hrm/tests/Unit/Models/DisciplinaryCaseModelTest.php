<?php

namespace Aero\HRM\Tests\Unit\Models;

use Aero\HRM\Models\DisciplinaryActionType;
use Aero\HRM\Models\DisciplinaryCase;
use Aero\HRM\Models\Employee;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DisciplinaryCaseModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_correct_status_workflow_states()
    {
        $validStatuses = ['pending', 'investigating', 'action_taken', 'closed', 'dismissed'];

        foreach ($validStatuses as $status) {
            $case = DisciplinaryCase::factory()->create(['status' => $status]);
            $this->assertEquals($status, $case->status);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_auto_generates_unique_case_number_on_creation()
    {
        $case1 = DisciplinaryCase::factory()->create();
        $case2 = DisciplinaryCase::factory()->create();

        $this->assertNotEquals($case1->case_number, $case2->case_number);
        $this->assertStringStartsWith('DC'.date('Y'), $case1->case_number);
        $this->assertStringStartsWith('DC'.date('Y'), $case2->case_number);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_employee_and_action_type()
    {
        $employee = Employee::factory()->create();
        $actionType = DisciplinaryActionType::factory()->create();

        $case = DisciplinaryCase::factory()->create([
            'employee_id' => $employee->id,
            'disciplinary_action_type_id' => $actionType->id,
        ]);

        $this->assertInstanceOf(Employee::class, $case->employee);
        $this->assertInstanceOf(DisciplinaryActionType::class, $case->actionType);
        $this->assertEquals($employee->id, $case->employee->id);
        $this->assertEquals($actionType->id, $case->actionType->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_check_if_case_can_be_closed()
    {
        $pendingCase = DisciplinaryCase::factory()->create(['status' => 'pending']);
        $investigatingCase = DisciplinaryCase::factory()->investigating()->create();
        $actionTakenCase = DisciplinaryCase::factory()->actionTaken()->create();
        $closedCase = DisciplinaryCase::factory()->closed()->create();

        $this->assertFalse($pendingCase->canBeClosed());
        $this->assertFalse($investigatingCase->canBeClosed());
        $this->assertTrue($actionTakenCase->canBeClosed());
        $this->assertFalse($closedCase->canBeClosed());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_check_if_case_can_be_appealed()
    {
        $pendingCase = DisciplinaryCase::factory()->create(['status' => 'pending']);
        $actionTakenCase = DisciplinaryCase::factory()->actionTaken()->create(['appeal_filed' => false]);
        $appealedCase = DisciplinaryCase::factory()->appealed()->create();

        $this->assertFalse($pendingCase->canBeAppealed());
        $this->assertTrue($actionTakenCase->canBeAppealed());
        $this->assertFalse($appealedCase->canBeAppealed());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_tracks_investigation_dates()
    {
        $case = DisciplinaryCase::factory()->investigating()->create([
            'investigation_start_date' => now(),
        ]);

        $this->assertNotNull($case->investigation_start_date);
        $this->assertInstanceOf(\Carbon\Carbon::class, $case->investigation_start_date);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_soft_deletes_correctly()
    {
        $case = DisciplinaryCase::factory()->create();
        $caseId = $case->id;

        $case->delete();

        $this->assertSoftDeleted('disciplinary_cases', ['id' => $caseId]);
        $this->assertNotNull($case->fresh()->deleted_at);
    }
}
