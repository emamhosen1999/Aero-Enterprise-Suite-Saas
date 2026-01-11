<?php

namespace Aero\HRM\Database\Factories;

use Aero\HRM\Models\EmployeePersonalDocument;
use Aero\Core\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<EmployeePersonalDocument>
 */
class EmployeePersonalDocumentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var class-string<EmployeePersonalDocument>
     */
    protected $model = EmployeePersonalDocument::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $issueDate = $this->faker->dateTimeBetween('-3 years', '-1 year');
        $expiryDate = $this->faker->dateTimeBetween('+1 month', '+2 years');

        return [
            'user_id' => User::factory(),
            'name' => $this->faker->randomElement([
                'Passport',
                'Emirates ID',
                'Visa',
                'Employment Contract',
                'Work Permit',
                'Educational Certificate',
            ]),
            'document_type' => $this->faker->randomElement(['passport', 'identity', 'contract', 'certificate', 'visa']),
            'document_number' => strtoupper($this->faker->bothify('??######')),
            'file_path' => 'documents/' . $this->faker->uuid() . '.pdf',
            'file_name' => $this->faker->words(3, true) . '.pdf',
            'mime_type' => 'application/pdf',
            'file_size_kb' => $this->faker->numberBetween(100, 5000),
            'issue_date' => $issueDate,
            'expiry_date' => $expiryDate,
            'issued_by' => $this->faker->company(),
            'issued_country' => $this->faker->randomElement(['UAE', 'USA', 'GBR', 'IND', 'PAK']),
            'status' => 'verified',
            'is_confidential' => $this->faker->boolean(20),
        ];
    }

    /**
     * Indicate that the document is expiring soon (within 30 days).
     */
    public function expiringSoon(): static
    {
        return $this->state(fn (array $attributes) => [
            'expiry_date' => now()->addDays($this->faker->numberBetween(1, 30)),
        ]);
    }

    /**
     * Indicate that the document is expiring in 7 days.
     */
    public function expiringIn7Days(): static
    {
        return $this->state(fn (array $attributes) => [
            'expiry_date' => now()->addDays(7),
        ]);
    }

    /**
     * Indicate that the document is expiring today.
     */
    public function expiringToday(): static
    {
        return $this->state(fn (array $attributes) => [
            'expiry_date' => now(),
        ]);
    }

    /**
     * Indicate that the document has expired.
     */
    public function expired(): static
    {
        return $this->state(fn (array $attributes) => [
            'expiry_date' => $this->faker->dateTimeBetween('-1 year', '-1 day'),
            'status' => 'expired',
        ]);
    }

    /**
     * Indicate that the document is pending verification.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
            'verified_by' => null,
            'verified_at' => null,
        ]);
    }

    /**
     * Indicate that the document is of a specific type.
     */
    public function ofType(string $type): static
    {
        return $this->state(fn (array $attributes) => [
            'document_type' => $type,
        ]);
    }
}
