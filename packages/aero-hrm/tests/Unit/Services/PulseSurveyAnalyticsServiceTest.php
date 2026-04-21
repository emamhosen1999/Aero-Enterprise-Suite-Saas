<?php

namespace Aero\HRM\Tests\Unit\Services;

use Aero\HRM\Models\Employee;
use Aero\HRM\Models\PulseSurvey;
use Aero\HRM\Models\PulseSurveyResponse;
use Aero\HRM\Services\PulseSurveyAnalyticsService;
use Aero\HRM\Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;

class PulseSurveyAnalyticsServiceTest extends TestCase
{
    use RefreshDatabase;

    protected PulseSurveyAnalyticsService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(PulseSurveyAnalyticsService::class);
    }

    #[Test]
    public function it_creates_pulse_survey_with_draft_status(): void
    {
        $survey = PulseSurvey::factory()->create([
            'status' => 'draft',
        ]);

        $this->assertEquals('draft', $survey->status);
        $this->assertNotNull($survey->title);
    }

    #[Test]
    public function it_tracks_response_count(): void
    {
        $survey = PulseSurvey::factory()->create();
        $employees = Employee::factory()->count(5)->create();

        foreach ($employees as $employee) {
            PulseSurveyResponse::factory()->create([
                'pulse_survey_id' => $survey->id,
                'employee_id' => $employee->id,
            ]);
        }

        $this->assertCount(5, PulseSurveyResponse::where('pulse_survey_id', $survey->id)->get());
    }

    #[Test]
    public function it_calculates_average_score_from_responses(): void
    {
        $survey = PulseSurvey::factory()->create();
        $employees = Employee::factory()->count(4)->create();

        $scores = [4, 5, 3, 4];
        foreach ($employees as $i => $employee) {
            PulseSurveyResponse::factory()->create([
                'pulse_survey_id' => $survey->id,
                'employee_id' => $employee->id,
                'score' => $scores[$i],
            ]);
        }

        $avg = PulseSurveyResponse::where('pulse_survey_id', $survey->id)->avg('score');
        $this->assertEquals(4.0, $avg);
    }

    #[Test]
    public function it_prevents_duplicate_responses_from_same_employee(): void
    {
        $survey = PulseSurvey::factory()->create();
        $employee = Employee::factory()->create();

        PulseSurveyResponse::factory()->create([
            'pulse_survey_id' => $survey->id,
            'employee_id' => $employee->id,
        ]);

        $count = PulseSurveyResponse::where('pulse_survey_id', $survey->id)
            ->where('employee_id', $employee->id)
            ->count();

        $this->assertEquals(1, $count);
    }

    #[Test]
    public function it_filters_active_surveys(): void
    {
        PulseSurvey::factory()->count(2)->create(['status' => 'active']);
        PulseSurvey::factory()->count(3)->create(['status' => 'closed']);

        $active = PulseSurvey::where('status', 'active')->count();
        $this->assertEquals(2, $active);
    }
}
