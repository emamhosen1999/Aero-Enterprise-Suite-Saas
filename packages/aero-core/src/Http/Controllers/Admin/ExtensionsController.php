<?php

declare(strict_types=1);

namespace Aero\Core\Http\Controllers\Admin;

use Aero\Core\Http\Controllers\Controller;
use Aero\Core\Services\ModuleManager;
use Aero\Core\Services\MarketplaceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;
use ZipArchive;

/**
 * ExtensionsController
 * 
 * Manages the Extensions Marketplace page where users can:
 * - View installed modules
 * - Activate/Deactivate modules
 * - Browse available modules from marketplace
 * - Upload new modules
 * - Check for updates
 */
class ExtensionsController extends Controller
{
    public function __construct(
        protected ModuleManager $moduleManager,
        protected MarketplaceService $marketplaceService
    ) {}

    /**
     * Display the extensions marketplace page.
     */
    public function index(): Response
    {
        // Get installed modules
        $installedModules = collect($this->moduleManager->all())->map(function ($module) {
            return [
                'code' => $module['short_name'],
                'name' => $module['name'],
                'version' => $module['version'] ?? '1.0.0',
                'description' => $module['description'] ?? '',
                'enabled' => $module['config']['enabled'] ?? true,
                'auto_register' => $module['config']['auto_register'] ?? true,
                'has_settings' => file_exists(base_path("packages/aero-{$module['short_name']}/config")),
                'thumbnail' => $this->getModuleThumbnail($module['short_name']),
                'installed_at' => $this->getModuleInstallDate($module['short_name']),
            ];
        })->values()->all();

        // Get available marketplace modules
        $marketplaceModules = $this->marketplaceService->getAvailableModules();

        // Get purchased but not installed modules
        $purchasedCodes = $this->marketplaceService->getPurchasedCodes();

        return Inertia::render('Pages/Core/Admin/Extensions/Index', [
            'installedModules' => $installedModules,
            'marketplaceModules' => $marketplaceModules,
            'purchasedCodes' => $purchasedCodes,
        ]);
    }

    /**
     * Toggle module activation status.
     */
    public function toggle(Request $request, string $moduleCode): JsonResponse
    {
        try {
            $module = $this->moduleManager->get("aero-{$moduleCode}");
            
            if (!$module) {
                return response()->json([
                    'success' => false,
                    'message' => 'Module not found',
                ], 404);
            }

            // Get current status and toggle it
            $currentStatus = $module['config']['enabled'] ?? true;
            $newStatus = !$currentStatus;

            // Update module.json
            $modulePath = base_path("packages/aero-{$moduleCode}");
            $moduleJsonPath = "{$modulePath}/module.json";
            
            if (file_exists($moduleJsonPath)) {
                $moduleJson = json_decode(file_get_contents($moduleJsonPath), true);
                $moduleJson['config']['enabled'] = $newStatus;
                file_put_contents($moduleJsonPath, json_encode($moduleJson, JSON_PRETTY_PRINT));
            }

            // Clear caches
            Artisan::call('config:clear');
            Artisan::call('cache:clear');
            $this->moduleManager->clearCache();

            return response()->json([
                'success' => true,
                'message' => $newStatus 
                    ? 'Module activated successfully' 
                    : 'Module deactivated successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload and install a module.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'module' => 'required|file|mimes:zip|max:51200', // 50MB max
            'purchase_code' => 'nullable|string',
        ]);

        try {
            $file = $request->file('module');
            $purchaseCode = $request->input('purchase_code');

            // Validate purchase code if provided
            if ($purchaseCode) {
                $validation = $this->marketplaceService->validatePurchaseCode($purchaseCode);
                if (!$validation['valid']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid purchase code',
                    ], 422);
                }
            }

            // Create temp directory
            $tempPath = storage_path('app/temp/' . uniqid('module_'));
            if (!file_exists($tempPath)) {
                mkdir($tempPath, 0755, true);
            }

            // Extract ZIP
            $zip = new ZipArchive;
            if ($zip->open($file->getRealPath()) === TRUE) {
                $zip->extractTo($tempPath);
                $zip->close();
            } else {
                throw new \Exception('Failed to extract module archive');
            }

            // Find module.json
            $moduleJson = $this->findModuleJson($tempPath);
            if (!$moduleJson) {
                throw new \Exception('Invalid module: module.json not found');
            }

            $moduleData = json_decode(file_get_contents($moduleJson), true);
            $moduleName = $moduleData['name'] ?? null;

            if (!$moduleName) {
                throw new \Exception('Invalid module: name not specified in module.json');
            }

            // Copy to modules directory
            $modulesPath = base_path('modules');
            if (!file_exists($modulesPath)) {
                mkdir($modulesPath, 0755, true);
            }

            $targetPath = "{$modulesPath}/{$moduleName}";
            $moduleSourcePath = dirname($moduleJson);

            // Copy module files
            $this->recursiveCopy($moduleSourcePath, $targetPath);

            // Install Composer dependencies if composer.json exists
            if (file_exists("{$targetPath}/composer.json")) {
                exec("cd {$targetPath} && composer install --no-dev --optimize-autoloader 2>&1", $output, $returnCode);
                
                if ($returnCode !== 0) {
                    \Log::warning("Composer install failed for {$moduleName}", ['output' => $output]);
                }
            }

            // Run migrations
            Artisan::call('migrate');

            // Register module
            Artisan::call('module:register', ['module' => $moduleName]);

            // Clear caches
            Artisan::call('config:clear');
            Artisan::call('cache:clear');
            $this->moduleManager->clearCache();

            // Save purchase code
            if ($purchaseCode) {
                $this->marketplaceService->savePurchaseCode($moduleName, $purchaseCode);
            }

            // Cleanup temp directory
            $this->recursiveRemove($tempPath);

            return response()->json([
                'success' => true,
                'message' => 'Module installed successfully',
                'module' => $moduleData,
            ]);
        } catch (\Exception $e) {
            \Log::error('Module upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check for module updates.
     */
    public function checkUpdates(): JsonResponse
    {
        try {
            $updates = $this->marketplaceService->checkForUpdates();

            return response()->json([
                'success' => true,
                'updates' => $updates,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get module settings page.
     */
    public function settings(string $moduleCode): Response
    {
        $module = $this->moduleManager->get("aero-{$moduleCode}");

        if (!$module) {
            abort(404, 'Module not found');
        }

        return Inertia::render('Pages/Core/Admin/Extensions/Settings', [
            'module' => $module,
        ]);
    }

    /**
     * Find module.json in extracted directory.
     */
    protected function findModuleJson(string $path): ?string
    {
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getFilename() === 'module.json') {
                return $file->getPathname();
            }
        }

        return null;
    }

    /**
     * Recursively copy directory.
     */
    protected function recursiveCopy(string $source, string $dest): void
    {
        if (!file_exists($dest)) {
            mkdir($dest, 0755, true);
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            $target = $dest . DIRECTORY_SEPARATOR . $iterator->getSubPathName();
            
            if ($item->isDir()) {
                if (!file_exists($target)) {
                    mkdir($target, 0755, true);
                }
            } else {
                copy($item->getPathname(), $target);
            }
        }
    }

    /**
     * Recursively remove directory.
     */
    protected function recursiveRemove(string $path): void
    {
        if (is_dir($path)) {
            $files = array_diff(scandir($path), ['.', '..']);
            
            foreach ($files as $file) {
                $filePath = $path . DIRECTORY_SEPARATOR . $file;
                is_dir($filePath) ? $this->recursiveRemove($filePath) : unlink($filePath);
            }
            
            rmdir($path);
        }
    }

    /**
     * Get module thumbnail URL.
     */
    protected function getModuleThumbnail(string $moduleCode): string
    {
        $thumbnailPath = "modules/aero-{$moduleCode}/thumbnail.png";
        
        if (file_exists(public_path($thumbnailPath))) {
            return asset($thumbnailPath);
        }

        return asset('images/module-placeholder.png');
    }

    /**
     * Get module installation date.
     */
    protected function getModuleInstallDate(string $moduleCode): ?string
    {
        $modulePath = base_path("packages/aero-{$moduleCode}");
        
        if (file_exists($modulePath)) {
            return date('Y-m-d H:i:s', filectime($modulePath));
        }

        return null;
    }
}
