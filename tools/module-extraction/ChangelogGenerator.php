<?php

namespace Tools\ModuleExtraction;

/**
 * Changelog Generator
 */
class ChangelogGenerator
{
    protected ModuleExtractor $extractor;

    public function __construct(ModuleExtractor $extractor)
    {
        $this->extractor = $extractor;
    }

    public function generate(): void
    {
        $content = $this->buildChangelog();
        
        $changelogPath = $this->extractor->getOutputPath() . "/CHANGELOG.md";
        file_put_contents($changelogPath, $content);
    }

    protected function buildChangelog(): string
    {
        $variants = $this->getModuleNameVariants();
        $date = date('Y-m-d');

        return <<<MD
# Changelog

All notable changes to the {$variants['studly']} module will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial features and functionality

### Changed
- Nothing yet

### Deprecated
- Nothing yet

### Removed
- Nothing yet

### Fixed
- Nothing yet

### Security
- Nothing yet

## [1.0.0] - {$date}

### Added
- Initial release
- Core {$variants['studly']} functionality
- Database migrations
- Frontend components (React/Inertia.js)
- API endpoints
- PHPUnit test suite
- Comprehensive documentation

MD;
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
