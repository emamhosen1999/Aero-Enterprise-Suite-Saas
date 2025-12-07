<?php

namespace Tools\ModuleExtraction;

/**
 * Route Extractor
 * 
 * Extracts routes from routes/{module}.php and transforms them for package use
 */
class RouteExtractor extends BaseExtractor
{
    public function extract(): void
    {
        $this->log("🛣️ Extracting routes...");

        $variants = $this->getModuleNameVariants();
        $possibleRouteFiles = [
            $variants['lower'] . '.php',
            $variants['upper'] . '.php',
            strtolower($this->moduleName) . '.php',
        ];

        $sourceFile = null;
        foreach ($possibleRouteFiles as $filename) {
            $path = $this->extractor->getBasePath() . "/routes/{$filename}";
            if (file_exists($path)) {
                $sourceFile = $path;
                break;
            }
        }

        if (!$sourceFile) {
            $this->log("   ⚠ No route file found for this module");
            $this->createDefaultRouteFile();
            return;
        }

        $destinationPath = $this->outputPath . "/routes/" . $variants['lower'] . ".php";
        
        if ($this->copyAndTransformRoutes($sourceFile, $destinationPath)) {
            $this->log("   ✓ Copied: " . basename($sourceFile));
        }

        $this->log("");
    }

    /**
     * Copy and transform route file
     */
    protected function copyAndTransformRoutes(string $sourcePath, string $destinationPath): bool
    {
        if (!file_exists($sourcePath)) {
            return false;
        }

        $content = file_get_contents($sourcePath);

        // Transform controller references
        $content = $this->transformControllerReferences($content);

        // Transform middleware references (remove tenant-specific if needed)
        $content = $this->transformMiddlewareReferences($content);

        // Add package route header
        $content = $this->addRouteHeader($content);

        file_put_contents($destinationPath, $content);

        $this->extractor->recordExtractedFile($sourcePath, $destinationPath);

        return true;
    }

    /**
     * Transform controller references to use new namespace
     */
    protected function transformControllerReferences(string $content): string
    {
        $variants = $this->getModuleNameVariants();
        
        // Transform: App\Http\Controllers\HR\* -> AeroModules\Hrm\Http\Controllers\*
        $patterns = [
            "/App\\\\Http\\\\Controllers\\\\{$variants['studly']}\\\\/" => "{$this->namespace}\\Http\\Controllers\\",
            "/App\\\\Http\\\\Controllers\\\\{$variants['upper']}\\\\/" => "{$this->namespace}\\Http\\Controllers\\",
        ];

        foreach ($patterns as $pattern => $replacement) {
            $content = preg_replace($pattern, $replacement, $content);
        }

        // Also transform use statements
        $content = preg_replace(
            "/use App\\\\Http\\\\Controllers\\\\{$variants['studly']}\\\\([^;]+);/",
            "use {$this->namespace}\\Http\\Controllers\\$1;",
            $content
        );

        return $content;
    }

    /**
     * Transform middleware references
     */
    protected function transformMiddlewareReferences(string $content): string
    {
        // Note: Module-specific middleware in routes will be kept as-is
        // The ServiceProvider will handle adding tenant middleware when needed
        
        // Remove explicit tenant middleware from routes (ServiceProvider handles this)
        $content = str_replace(", 'tenant'", "", $content);
        $content = str_replace("'tenant', ", "", $content);
        
        return $content;
    }

    /**
     * Add package route header
     */
    protected function addRouteHeader(string $content): string
    {
        $header = "/**\n";
        $header .= " * Routes for {$this->extractor->getPackageName()}\n";
        $header .= " * \n";
        $header .= " * These routes are automatically registered by the ServiceProvider.\n";
        $header .= " * Middleware is applied based on the installation mode (standalone/tenant).\n";
        $header .= " */\n\n";

        // Insert header after <?php tag
        $content = preg_replace(
            '/^<\?php\s+/',
            "<?php\n\n{$header}",
            $content
        );

        return $content;
    }

    /**
     * Create default route file if none exists
     */
    protected function createDefaultRouteFile(): void
    {
        $variants = $this->getModuleNameVariants();
        $moduleName = $variants['studly'];

        $content = <<<PHP
<?php

/**
 * Routes for {$this->extractor->getPackageName()}
 * 
 * These routes are automatically registered by the ServiceProvider.
 * Middleware is applied based on the installation mode (standalone/tenant).
 */

use Illuminate\Support\Facades\Route;
use {$this->namespace}\Http\Controllers;

// {$moduleName} Module Routes
// Add your routes here

// Example:
// Route::get('/', [Controllers\{$moduleName}Controller::class, 'index'])->name('{$variants['lower']}.index');
// Route::get('/dashboard', [Controllers\{$moduleName}Controller::class, 'dashboard'])->name('{$variants['lower']}.dashboard');

PHP;

        $destinationPath = $this->outputPath . "/routes/" . $variants['lower'] . ".php";
        file_put_contents($destinationPath, $content);

        $this->log("   ✓ Created default route file: " . $variants['lower'] . ".php");
    }
}
