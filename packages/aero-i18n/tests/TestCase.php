<?php

namespace Aero\I18n\Tests;

use Orchestra\Testbench\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function getPackageProviders($app): array
    {
        return [
            \Aero\I18n\AeroI18nServiceProvider::class,
        ];
    }
}
