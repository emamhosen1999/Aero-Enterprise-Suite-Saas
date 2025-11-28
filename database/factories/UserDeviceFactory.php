<?php

namespace Database\Factories;

use App\Models\User;
use App\Models\UserDevice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserDevice>
 */
class UserDeviceFactory extends Factory
{
    protected $model = UserDevice::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
        $platforms = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
        $deviceTypes = ['desktop', 'mobile', 'tablet'];

        return [
            'user_id' => User::factory(),
            'device_id' => fake()->uuid(),
            'device_model' => fake()->optional(0.6)->bothify('Model-??-###'),
            'device_serial' => fake()->optional(0.6)->bothify('SN########'),
            'device_mac' => fake()->optional(0.6)->macAddress(),
            'device_name' => fake()->randomElement($browsers).' on '.fake()->randomElement($platforms),
            'browser_name' => fake()->randomElement($browsers),
            'browser_version' => fake()->numerify('##.#.#'),
            'platform' => fake()->randomElement($platforms),
            'device_type' => fake()->randomElement($deviceTypes),
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
            'session_id' => fake()->uuid(),
            'last_activity' => fake()->dateTimeBetween('-1 week', 'now'),
            'is_active' => fake()->boolean(70), // 70% chance of being active
            'is_trusted' => fake()->boolean(30), // 30% chance of being trusted
            'device_fingerprint' => [
                'screen_resolution' => fake()->randomElement(['1920x1080', '1366x768', '1440x900']),
                'timezone' => fake()->timezone(),
                'language' => fake()->randomElement(['en-US', 'en-GB', 'es-ES', 'fr-FR']),
            ],
        ];
    }

    /**
     * Indicate that the device is active.
     */
    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => true,
            'last_activity' => now(),
        ]);
    }

    /**
     * Indicate that the device is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
            'session_id' => null,
        ]);
    }

    /**
     * Indicate that the device is trusted.
     */
    public function trusted(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_trusted' => true,
        ]);
    }

    /**
     * Create a mobile device.
     */
    public function mobile(): static
    {
        return $this->state(fn (array $attributes) => [
            'device_type' => 'mobile',
            'platform' => fake()->randomElement(['iOS', 'Android']),
            'device_name' => fake()->randomElement(['Safari on iOS', 'Chrome on Android']),
        ]);
    }

    /**
     * Create a desktop device.
     */
    public function desktop(): static
    {
        return $this->state(fn (array $attributes) => [
            'device_type' => 'desktop',
            'platform' => fake()->randomElement(['Windows', 'macOS', 'Linux']),
            'device_name' => fake()->randomElement(['Chrome on Windows', 'Safari on macOS', 'Firefox on Linux']),
        ]);
    }
}
