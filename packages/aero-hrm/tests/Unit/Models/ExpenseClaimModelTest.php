<?php

namespace AeroHRM\Tests\Unit\Models;

use AeroHRM\Models\Employee;
use AeroHRM\Models\ExpenseCategory;
use AeroHRM\Models\ExpenseClaim;
use AeroHRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ExpenseClaimModelTest extends TestCase
{
    use RefreshDatabase;

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_has_correct_status_workflow_states()
    {
        $validStatuses = ['draft', 'submitted', 'pending', 'approved', 'rejected', 'paid', 'cancelled'];

        foreach ($validStatuses as $status) {
            $claim = ExpenseClaim::factory()->create(['status' => $status]);
            $this->assertEquals($status, $claim->status);
        }
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_auto_generates_unique_claim_number_on_creation()
    {
        $claim1 = ExpenseClaim::factory()->create();
        $claim2 = ExpenseClaim::factory()->create();

        $this->assertNotEquals($claim1->claim_number, $claim2->claim_number);
        $this->assertStringStartsWith('EXP'.date('Y'), $claim1->claim_number);
        $this->assertStringStartsWith('EXP'.date('Y'), $claim2->claim_number);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_belongs_to_employee_and_category()
    {
        $employee = Employee::factory()->create();
        $category = ExpenseCategory::factory()->create();
        $claim = ExpenseClaim::factory()->create([
            'employee_id' => $employee->id,
            'expense_category_id' => $category->id,
        ]);

        $this->assertInstanceOf(Employee::class, $claim->employee);
        $this->assertInstanceOf(ExpenseCategory::class, $claim->category);
        $this->assertEquals($employee->id, $claim->employee->id);
        $this->assertEquals($category->id, $claim->category->id);
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_check_if_claim_can_be_edited()
    {
        $draftClaim = ExpenseClaim::factory()->create(['status' => 'draft']);
        $approvedClaim = ExpenseClaim::factory()->approved()->create();

        $this->assertTrue($draftClaim->canBeEdited());
        $this->assertFalse($approvedClaim->canBeEdited());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_check_if_claim_can_be_cancelled()
    {
        $draftClaim = ExpenseClaim::factory()->create(['status' => 'draft']);
        $submittedClaim = ExpenseClaim::factory()->submitted()->create();
        $approvedClaim = ExpenseClaim::factory()->approved()->create();

        $this->assertTrue($draftClaim->canBeCancelled());
        $this->assertTrue($submittedClaim->canBeCancelled());
        $this->assertFalse($approvedClaim->canBeCancelled());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_can_check_if_claim_can_be_approved()
    {
        $draftClaim = ExpenseClaim::factory()->create(['status' => 'draft']);
        $submittedClaim = ExpenseClaim::factory()->submitted()->create();
        $approvedClaim = ExpenseClaim::factory()->approved()->create();

        $this->assertFalse($draftClaim->canBeApproved());
        $this->assertTrue($submittedClaim->canBeApproved());
        $this->assertFalse($approvedClaim->canBeApproved());
    }

    #[\PHPUnit\Framework\Attributes\Test]
    public function it_soft_deletes_correctly()
    {
        $claim = ExpenseClaim::factory()->create();
        $claimId = $claim->id;

        $claim->delete();

        $this->assertSoftDeleted('expense_claims', ['id' => $claimId]);
        $this->assertNotNull($claim->fresh()->deleted_at);
    }
}
