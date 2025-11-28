<?php

namespace Tests\Feature\Feature;

use App\Models\DailyWork;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class DailyWorkInspectionDetailsTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    private User $user;

    private DailyWork $dailyWork;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->dailyWork = DailyWork::factory()->create([
            'user_id' => $this->user->id,
            'inspection_details' => null,
        ]);
    }

    /** @test */
    public function it_can_update_inspection_details_successfully()
    {
        $newInspectionDetails = 'Quality check completed. All components meet specifications.';

        $response = $this->actingAs($this->user)
            ->patchJson(route('dailyWorks.updateInspectionDetails', $this->dailyWork), [
                'inspection_details' => $newInspectionDetails,
            ]);

        $response->assertOk();
        $response->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'id',
                'inspection_details',
            ],
        ]);

        $this->dailyWork->refresh();
        $this->assertEquals($newInspectionDetails, $this->dailyWork->inspection_details);
    }

    /** @test */
    public function it_can_clear_inspection_details()
    {
        $this->dailyWork->update(['inspection_details' => 'Existing details']);

        $response = $this->actingAs($this->user)
            ->patchJson(route('dailyWorks.updateInspectionDetails', $this->dailyWork), [
                'inspection_details' => '',
            ]);

        $response->assertOk();

        $this->dailyWork->refresh();
        $this->assertNull($this->dailyWork->inspection_details);
    }

    /** @test */
    public function it_validates_inspection_details_max_length()
    {
        $longText = str_repeat('A', 1001); // 1001 characters, exceeds max 1000

        $response = $this->actingAs($this->user)
            ->patchJson(route('dailyWorks.updateInspectionDetails', $this->dailyWork), [
                'inspection_details' => $longText,
            ]);

        $response->assertUnprocessable();
        $response->assertJsonValidationErrors(['inspection_details']);
    }

    /** @test */
    public function it_accepts_exactly_1000_character_inspection_details()
    {
        $exactlyThousandChars = str_repeat('A', 1000); // Exactly 1000 characters

        $response = $this->actingAs($this->user)
            ->patchJson(route('dailyWorks.updateInspectionDetails', $this->dailyWork), [
                'inspection_details' => $exactlyThousandChars,
            ]);

        $response->assertOk();

        $this->dailyWork->refresh();
        $this->assertEquals($exactlyThousandChars, $this->dailyWork->inspection_details);
    }

    /** @test */
    public function it_requires_authentication()
    {
        $response = $this->patchJson(route('dailyWorks.updateInspectionDetails', $this->dailyWork), [
            'inspection_details' => 'Test details',
        ]);

        $response->assertUnauthorized();
    }

    /** @test */
    public function it_validates_daily_work_exists()
    {
        $response = $this->actingAs($this->user)
            ->patchJson(route('dailyWorks.updateInspectionDetails', 99999), [
                'inspection_details' => 'Test details',
            ]);

        $response->assertNotFound();
    }

    /** @test */
    public function it_accepts_null_inspection_details()
    {
        $response = $this->actingAs($this->user)
            ->patchJson(route('dailyWorks.updateInspectionDetails', $this->dailyWork), [
                'inspection_details' => null,
            ]);

        $response->assertOk();

        $this->dailyWork->refresh();
        $this->assertNull($this->dailyWork->inspection_details);
    }
}
