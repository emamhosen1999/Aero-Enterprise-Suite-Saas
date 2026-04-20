<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\PromotionHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PromotionHistory>
 */
class PromotionHistoryFactory extends Factory
{
    protected $model = PromotionHistory::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'from_designation_id' => null,
            'to_designation_id' => null,
            'from_department_id' => null,
            'to_department_id' => null,
            'effective_date' => $this->faker->dateTimeBetween('-2 years', 'now'),
            'reason' => $this->faker->sentence(),
            'salary_change' => $this->faker->optional()->randomFloat(2, 1000, 20000),
        ];
    }
}
