<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\EmergencyContact;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmergencyContact>
 */
class EmergencyContactFactory extends Factory
{
    protected $model = EmergencyContact::class;

    public function definition(): array
    {
        return [
            'employee_id' => null,
            'name' => $this->faker->name(),
            'relationship' => $this->faker->randomElement(['spouse', 'parent', 'sibling', 'friend', 'other']),
            'phone' => $this->faker->phoneNumber(),
            'email' => $this->faker->optional()->safeEmail(),
            'address' => $this->faker->optional()->address(),
        ];
    }
}
