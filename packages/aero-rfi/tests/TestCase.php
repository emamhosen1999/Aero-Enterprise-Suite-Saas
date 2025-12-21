<?php

namespace Aero\Rfi\Tests;

use Aero\Core\AeroCoreServiceProvider;
use Aero\Rfi\AeroRfiServiceProvider;
use Orchestra\Testbench\TestCase as BaseTestCase;

/**
 * Base TestCase for RFI package tests.
 *
 * All RFI tests should extend this class for proper package setup.
 */
abstract class TestCase extends BaseTestCase
{
    /**
     * Get package providers.
     *
     * @param  \Illuminate\Foundation\Application  $app
     * @return array<int, class-string>
     */
    protected function getPackageProviders($app): array
    {
        return [
            AeroCoreServiceProvider::class,
            AeroRfiServiceProvider::class,
        ];
    }

    /**
     * Define environment setup.
     *
     * @param  \Illuminate\Foundation\Application  $app
     */
    protected function defineEnvironment($app): void
    {
        // Use SQLite in-memory database for testing
        $app['config']->set('database.default', 'testing');
        $app['config']->set('database.connections.testing', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
        ]);

        // Set standalone mode for testing
        $app['config']->set('aero.mode', 'standalone');
    }

    /**
     * Setup the test environment.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Run migrations
        $this->loadMigrationsFrom(__DIR__.'/../database/migrations');
    }
}
