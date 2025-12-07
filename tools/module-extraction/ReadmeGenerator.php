<?php

namespace Tools\ModuleExtraction;

/**
 * README Generator
 * 
 * Generates comprehensive README.md for the package
 */
class ReadmeGenerator
{
    protected ModuleExtractor $extractor;

    public function __construct(ModuleExtractor $extractor)
    {
        $this->extractor = $extractor;
    }

    public function generate(): void
    {
        $variants = $this->getModuleNameVariants();
        $content = $this->buildReadme();
        
        $readmePath = $this->extractor->getOutputPath() . "/README.md";
        file_put_contents($readmePath, $content);
    }

    protected function buildReadme(): string
    {
        $variants = $this->getModuleNameVariants();
        $packageName = $this->extractor->getPackageName();
        $moduleName = $variants['studly'];
        $moduleLower = $variants['lower'];

        return <<<MD
# {$moduleName} Module for Aero Enterprise Suite

{$moduleName} module provides comprehensive functionality for managing {$moduleLower} operations in your Laravel application.

## Features

- 🚀 Easy installation via Composer
- 🔄 Works in standalone or multi-tenant environments
- 🎨 Pre-built React/Inertia.js components
- 🔐 Flexible authentication integration
- 📊 Database migrations included
- 🧪 PHPUnit tests included

## Requirements

- PHP 8.2 or higher
- Laravel 11.0 or higher
- Inertia.js 2.0 (for frontend components)

## Installation

### Via Composer

```bash
composer require {$packageName}
```

### Publish Configuration

```bash
php artisan vendor:publish --tag=aero-{$moduleLower}-config
```

### Run Migrations

```bash
php artisan migrate
```

### Publish Frontend Assets (Optional)

```bash
php artisan vendor:publish --tag=aero-{$moduleLower}-assets
npm run build
```

## Configuration

After publishing the configuration file, you can customize the module behavior in `config/aero-{$moduleLower}.php`:

```php
return [
    'mode' => 'auto', // auto, standalone, or tenant
    
    'auth' => [
        'guard' => 'web',
        'user_model' => \App\Models\User::class,
    ],
    
    'routes' => [
        'prefix' => '{$moduleLower}',
        'middleware' => ['web', 'auth'],
    ],
];
```

## Usage

### Standalone Mode

When installed in a standard Laravel application, the module works out of the box:

```bash
# Access the module
http://your-domain.com/{$moduleLower}
```

### Multi-Tenant Mode

When installed in a multi-tenant platform (using stancl/tenancy), the module automatically detects tenant context:

```bash
# Each tenant has isolated data
http://tenant1.your-platform.com/{$moduleLower}
http://tenant2.your-platform.com/{$moduleLower}
```

## Frontend Integration

### Importing Components

```jsx
import EmployeeList from '@/vendor/aero-{$moduleLower}/Pages/EmployeeList';

export default function MyPage() {
    return <EmployeeList />;
}
```

### Vite Configuration

Add the module's frontend entry point to your `vite.config.js`:

```javascript
export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/app.jsx',
                'resources/js/vendor/aero-{$moduleLower}/app.jsx',
            ],
        }),
    ],
});
```

## Testing

Run the package tests:

```bash
cd vendor/{$packageName}
composer install
./vendor/bin/phpunit
```

## API Documentation

[Add API documentation here]

## Changelog

Please see [CHANGELOG](CHANGELOG.md) for more information on what has changed recently.

## Contributing

Contributions are welcome! Please submit pull requests or open issues on GitHub.

## Security

If you discover any security-related issues, please email security@aero.com instead of using the issue tracker.

## Credits

- Aero Development Team
- All Contributors

## License

This package is proprietary software. See [LICENSE](LICENSE.md) for more information.

## Support

For support, please contact:
- Email: support@aero.com
- Documentation: https://docs.aero.com
- GitHub Issues: https://github.com/aero-modules/{$moduleLower}

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
