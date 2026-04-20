<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\TransferHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TransferHistory>
 */
class TransferHistoryFactory extends Factory
{
    protected $model = TransferHistory::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'from_department_id' => null,
            'to_department_id' => null,
            'from_location' => $this->faker->optional()->city(),
            'to_location' => $this->faker->optional()->city(),
            'effective_date' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'reason' => $this->faker->sentence(),
            'status' => $this->faker->randomElement(['pending', 'approved', 'completed']),
        ];
    }
}
