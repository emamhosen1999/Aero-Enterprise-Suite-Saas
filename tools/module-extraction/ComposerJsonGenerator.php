<?php

namespace Tools\ModuleExtraction;

/**
 * Composer JSON Generator
 * 
 * Generates composer.json for the extracted package
 */
class ComposerJsonGenerator
{
    protected ModuleExtractor $extractor;

    public function __construct(ModuleExtractor $extractor)
    {
        $this->extractor = $extractor;
    }

    public function generate(): void
    {
        $this->extractor->log("📦 Generating composer.json...");

        $composerData = $this->buildComposerData();
        $composerJson = json_encode($composerData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

        $composerPath = $this->extractor->getOutputPath() . "/composer.json";
        file_put_contents($composerPath, $composerJson . "\n");

        $this->extractor->log("   ✓ Created composer.json");
        $this->extractor->log("");
    }

    protected function buildComposerData(): array
    {
        $config = $this->extractor->getConfig();
        $variants = $this->getModuleNameVariants();

        return [
            'name' => $this->extractor->getPackageName(),
            'description' => "{$variants['studly']} module for Aero Enterprise Suite",
            'keywords' => [
                'laravel',
                'aero',
                'module',
                strtolower($variants['studly']),
                'enterprise',
            ],
            'type' => 'library',
            'license' => $config['license'],
            'authors' => [
                [
                    'name' => $config['author_name'],
                    'email' => $config['author_email'],
                ],
            ],
            'require' => [
                'php' => $config['php_version'],
                'laravel/framework' => $config['laravel_version'],
                'inertiajs/inertia-laravel' => '^2.0',
            ],
            'require-dev' => [
                'orchestra/testbench' => '^9.0',
                'phpunit/phpunit' => '^11.0',
            ],
            'autoload' => [
                'psr-4' => [
                    $this->extractor->getNamespace() . '\\' => 'src/',
                ],
            ],
            'autoload-dev' => [
                'psr-4' => [
                    $this->extractor->getNamespace() . '\\Tests\\' => 'tests/',
                ],
            ],
            'extra' => [
                'laravel' => [
                    'providers' => [
                        $this->extractor->getNamespace() . '\\' . $variants['studly'] . 'ServiceProvider',
                    ],
                ],
            ],
            'minimum-stability' => 'dev',
            'prefer-stable' => true,
        ];
    }

    protected function getModuleNameVariants(): array
    {
        $moduleName = $this->extractor->getModuleName();
        return [
            'lower' => strtolower($moduleName),
            'upper' => strtoupper($moduleName),
            'ucfirst' => ucfirst(strtolower($moduleName)),
            'studly' => str_replace(['-', '_'], '', ucwords($moduleName, '-_')),
        ];
    }
}
