<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\Attendance;
use Aero\HRM\Models\AttendanceType;
use Aero\Core\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\Aero\HRM\Models\Attendance>
 */
class AttendanceFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Attendance::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $date = Carbon::now()->subDays($this->faker->numberBetween(0, 30));
        $punchin = $date->copy()->setTime(9, $this->faker->numberBetween(0, 30), 0);
        $punchout = $punchin->copy()->addHours($this->faker->numberBetween(8, 10));
        $workHours = $punchout->diffInHours($punchin);

        return [
            'user_id' => User::factory(),
            'attendance_type_id' => null,
            'date' => $date->format('Y-m-d'),
            'punchin' => $punchin,
            'punchout' => $punchout,
            'punchin_location' => $this->faker->latitude() . ',' . $this->faker->longitude(),
            'punchout_location' => $this->faker->latitude() . ',' . $this->faker->longitude(),
            'punchin_ip' => $this->faker->ipv4(),
            'punchout_ip' => $this->faker->ipv4(),
            'work_hours' => $workHours,
            'overtime_hours' => $workHours > 8 ? $workHours - 8 : 0,
            'is_late' => $punchin->format('H:i') > '09:15',
            'is_early_leave' => $punchout->format('H:i') < '18:00',
            'status' => 'present',
            'is_manual' => false,
            'adjustment_reason' => null,
            'adjusted_by' => null,
            'notes' => null,
        ];
    }

    /**
     * Indicate that the attendance is manual.
     */
    public function manual(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_manual' => true,
            'adjusted_by' => User::factory(),
            'adjustment_reason' => $this->faker->sentence(),
        ]);
    }

    /**
     * Indicate that the employee was late.
     */
    public function late(): static
    {
        $punchin = Carbon::now()->setTime(9, 30, 0);
        return $this->state(fn (array $attributes) => [
            'punchin' => $punchin,
            'is_late' => true,
        ]);
    }

    /**
     * Indicate that the employee left early.
     */
    public function earlyLeave(): static
    {
        $punchout = Carbon::now()->setTime(17, 0, 0);
        return $this->state(fn (array $attributes) => [
            'punchout' => $punchout,
            'is_early_leave' => true,
        ]);
    }

    /**
     * Indicate that the attendance is absent.
     */
    public function absent(): static
    {
        return $this->state(fn (array $attributes) => [
            'punchin' => null,
            'punchout' => null,
            'work_hours' => 0,
            'overtime_hours' => 0,
            'status' => 'absent',
        ]);
    }

    /**
     * Indicate that the employee has no punch out.
     */
    public function noPunchout(): static
    {
        return $this->state(fn (array $attributes) => [
            'punchout' => null,
            'work_hours' => 0,
            'overtime_hours' => 0,
        ]);
    }
}
