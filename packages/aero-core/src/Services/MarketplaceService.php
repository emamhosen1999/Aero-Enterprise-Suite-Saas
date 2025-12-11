<?php

declare(strict_types=1);

namespace Aero\Core\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * MarketplaceService
 * 
 * Handles integration with CodeCanyon marketplace:
 * - Fetch available modules
 * - Validate purchase codes
 * - Check for updates
 * - Store purchase information
 */
class MarketplaceService
{
    protected string $apiUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->apiUrl = config('marketplace.api_url', 'https://api.marketplace.aerosuite.com');
        $this->apiKey = config('marketplace.api_key', '');
    }

    /**
     * Get available modules from marketplace.
     *
     * @return array
     */
    public function getAvailableModules(): array
    {
        return Cache::remember('marketplace.modules', 3600, function () {
            // Fallback to local configuration if API is unavailable
            return config('marketplace.modules', [
                [
                    'code' => 'hrm',
                    'name' => 'Human Resource Management',
                    'description' => 'Complete HR management with employee, attendance, payroll, and performance tracking',
                    'version' => '1.0.0',
                    'price' => 29.00,
                    'currency' => 'USD',
                    'codecanyon_url' => 'https://codecanyon.net/item/aero-hrm-module/00000000',
                    'preview_url' => 'https://demo.aerosuite.com/hrm',
                    'thumbnail' => asset('images/modules/hrm.png'),
                    'category' => 'Core Business',
                    'features' => [
                        'Employee Management',
                        'Attendance Tracking',
                        'Leave Management',
                        'Payroll Processing',
                        'Performance Reviews',
                        'Recruitment & Onboarding',
                    ],
                    'requirements' => [
                        'aero-core' => '^1.0',
                        'php' => '>=8.2',
                    ],
                ],
                [
                    'code' => 'crm',
                    'name' => 'Customer Relationship Management',
                    'description' => 'Complete CRM with pipeline, deals, customer success, and revenue reporting',
                    'version' => '1.0.0',
                    'price' => 29.00,
                    'currency' => 'USD',
                    'codecanyon_url' => 'https://codecanyon.net/item/aero-crm-module/00000001',
                    'preview_url' => 'https://demo.aerosuite.com/crm',
                    'thumbnail' => asset('images/modules/crm.png'),
                    'category' => 'Sales & Marketing',
                    'features' => [
                        'Lead Management',
                        'Sales Pipeline',
                        'Deal Tracking',
                        'Customer Portal',
                        'Revenue Analytics',
                    ],
                    'requirements' => [
                        'aero-core' => '^1.0',
                        'php' => '>=8.2',
                    ],
                ],
                [
                    'code' => 'finance',
                    'name' => 'Finance & Accounting',
                    'description' => 'Billing, invoicing, expense management, and financial reporting',
                    'version' => '1.0.0',
                    'price' => 39.00,
                    'currency' => 'USD',
                    'codecanyon_url' => 'https://codecanyon.net/item/aero-finance-module/00000002',
                    'preview_url' => 'https://demo.aerosuite.com/finance',
                    'thumbnail' => asset('images/modules/finance.png'),
                    'category' => 'Finance',
                    'features' => [
                        'Invoicing',
                        'Expense Tracking',
                        'Budget Management',
                        'Financial Reports',
                        'Tax Management',
                    ],
                    'requirements' => [
                        'aero-core' => '^1.0',
                        'php' => '>=8.2',
                    ],
                ],
                [
                    'code' => 'project',
                    'name' => 'Project Management',
                    'description' => 'Project planning, task management, sprint execution, and team collaboration',
                    'version' => '1.0.0',
                    'price' => 35.00,
                    'currency' => 'USD',
                    'codecanyon_url' => 'https://codecanyon.net/item/aero-project-module/00000003',
                    'preview_url' => 'https://demo.aerosuite.com/project',
                    'thumbnail' => asset('images/modules/project.png'),
                    'category' => 'Operations',
                    'features' => [
                        'Project Planning',
                        'Task Management',
                        'Gantt Charts',
                        'Time Tracking',
                        'Team Collaboration',
                    ],
                    'requirements' => [
                        'aero-core' => '^1.0',
                        'php' => '>=8.2',
                    ],
                ],
                [
                    'code' => 'pos',
                    'name' => 'Point of Sale',
                    'description' => 'Complete POS system with inventory, sales, and customer management',
                    'version' => '1.0.0',
                    'price' => 49.00,
                    'currency' => 'USD',
                    'codecanyon_url' => 'https://codecanyon.net/item/aero-pos-module/00000004',
                    'preview_url' => 'https://demo.aerosuite.com/pos',
                    'thumbnail' => asset('images/modules/pos.png'),
                    'category' => 'Retail',
                    'features' => [
                        'Sales Management',
                        'Inventory Tracking',
                        'Barcode Scanning',
                        'Customer Management',
                        'Reports & Analytics',
                    ],
                    'requirements' => [
                        'aero-core' => '^1.0',
                        'php' => '>=8.2',
                    ],
                ],
                [
                    'code' => 'scm',
                    'name' => 'Supply Chain Management',
                    'description' => 'Vendor management, procurement, logistics, and supply chain optimization',
                    'version' => '1.0.0',
                    'price' => 59.00,
                    'currency' => 'USD',
                    'codecanyon_url' => 'https://codecanyon.net/item/aero-scm-module/00000005',
                    'preview_url' => 'https://demo.aerosuite.com/scm',
                    'thumbnail' => asset('images/modules/scm.png'),
                    'category' => 'Operations',
                    'features' => [
                        'Vendor Management',
                        'Procurement',
                        'Logistics Tracking',
                        'Demand Planning',
                        'Supply Chain Analytics',
                    ],
                    'requirements' => [
                        'aero-core' => '^1.0',
                        'php' => '>=8.2',
                    ],
                ],
            ]);
        });
    }

    /**
     * Validate Envato purchase code.
     *
     * @param string $purchaseCode
     * @return array
     */
    public function validatePurchaseCode(string $purchaseCode): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => "Bearer {$this->apiKey}",
                'User-Agent' => 'Aero-Suite/1.0',
            ])->get("{$this->apiUrl}/v1/purchase/verify", [
                'code' => $purchaseCode,
            ]);

            if ($response->successful()) {
                return [
                    'valid' => true,
                    'data' => $response->json(),
                ];
            }

            return [
                'valid' => false,
                'message' => 'Invalid purchase code',
            ];
        } catch (\Exception $e) {
            \Log::error('Purchase code validation failed', [
                'code' => $purchaseCode,
                'error' => $e->getMessage(),
            ]);

            return [
                'valid' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Check for module updates.
     *
     * @return array
     */
    public function checkForUpdates(): array
    {
        $installedModules = app('aero.module')->all();
        $updates = [];

        foreach ($installedModules as $module) {
            $moduleCode = $module['short_name'];
            $currentVersion = $module['version'] ?? '1.0.0';

            try {
                $response = Http::get("{$this->apiUrl}/v1/modules/{$moduleCode}/latest");

                if ($response->successful()) {
                    $latestVersion = $response->json('version');

                    if (version_compare($latestVersion, $currentVersion, '>')) {
                        $updates[] = [
                            'code' => $moduleCode,
                            'name' => $module['name'],
                            'current_version' => $currentVersion,
                            'latest_version' => $latestVersion,
                            'download_url' => $response->json('download_url'),
                            'changelog' => $response->json('changelog'),
                        ];
                    }
                }
            } catch (\Exception $e) {
                \Log::warning("Failed to check updates for {$moduleCode}", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $updates;
    }

    /**
     * Get purchased modules for current tenant.
     *
     * @return array
     */
    public function getPurchasedCodes(): array
    {
        // In standalone mode, there's no tenant - return empty array
        if (!function_exists('tenant')) {
            return [];
        }

        $tenantId = tenant('id');
        if (!$tenantId) {
            return [];
        }

        return DB::table('module_purchases')
            ->where('tenant_id', $tenantId)
            ->get()
            ->mapWithKeys(function ($purchase) {
                return [$purchase->module_code => $purchase->purchase_code];
            })
            ->toArray();
    }

    /**
     * Save purchase code for module.
     *
     * @param string $moduleCode
     * @param string $purchaseCode
     * @return void
     */
    public function savePurchaseCode(string $moduleCode, string $purchaseCode): void
    {
        // In standalone mode, there's no tenant - skip saving
        if (!function_exists('tenant')) {
            return;
        }

        $tenantId = tenant('id');
        if (!$tenantId) {
            return;
        }

        DB::table('module_purchases')->updateOrInsert(
            [
                'tenant_id' => $tenantId,
                'module_code' => $moduleCode,
            ],
            [
                'purchase_code' => $purchaseCode,
                'purchased_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
