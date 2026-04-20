<?php

namespace Aero\HRM\Services;

use Aero\HRM\Models\Asset;
use Aero\HRM\Models\AssetAllocation;
use Aero\HRM\Models\Employee;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AssetLifecycleService
{
    public const STATUS_AVAILABLE = 'available';

    public const STATUS_ALLOCATED = 'allocated';

    public const STATUS_MAINTENANCE = 'maintenance';

    public const STATUS_DISPOSED = 'disposed';

    /**
     * Register a new asset in the system.
     */
    public function registerAsset(array $data): Asset
    {
        $asset = Asset::create(array_merge($data, [
            'status' => self::STATUS_AVAILABLE,
            'registered_at' => now(),
        ]));

        Log::info('Asset registered', [
            'asset_id' => $asset->id,
            'name' => $asset->name,
            'category_id' => $asset->asset_category_id ?? null,
        ]);

        return $asset;
    }

    /**
     * Allocate an asset to an employee.
     */
    public function allocateAsset(Asset $asset, Employee $employee, array $data = []): AssetAllocation
    {
        return DB::transaction(function () use ($asset, $employee, $data) {
            if ($asset->status !== self::STATUS_AVAILABLE) {
                throw new \RuntimeException("Asset is not available for allocation. Current status: {$asset->status}");
            }

            $allocation = AssetAllocation::create([
                'asset_id' => $asset->id,
                'employee_id' => $employee->id,
                'allocated_by' => auth()->id(),
                'allocated_at' => now(),
                'expected_return_date' => $data['expected_return_date'] ?? null,
                'condition_at_allocation' => $data['condition'] ?? 'good',
                'notes' => $data['notes'] ?? null,
            ]);

            $asset->update(['status' => self::STATUS_ALLOCATED]);

            Log::info('Asset allocated', [
                'asset_id' => $asset->id,
                'employee_id' => $employee->id,
                'allocation_id' => $allocation->id,
            ]);

            return $allocation;
        });
    }

    /**
     * Return an allocated asset.
     */
    public function returnAsset(AssetAllocation $allocation, array $data = []): Asset
    {
        return DB::transaction(function () use ($allocation, $data) {
            $allocation->update([
                'returned_at' => now(),
                'condition_at_return' => $data['condition'] ?? 'good',
                'return_notes' => $data['notes'] ?? null,
            ]);

            $asset = $allocation->asset;
            $newStatus = ($data['condition'] ?? 'good') === 'damaged'
                ? self::STATUS_MAINTENANCE
                : self::STATUS_AVAILABLE;

            $asset->update(['status' => $newStatus]);

            Log::info('Asset returned', [
                'asset_id' => $asset->id,
                'allocation_id' => $allocation->id,
                'condition' => $data['condition'] ?? 'good',
            ]);

            return $asset->fresh();
        });
    }

    /**
     * Send asset for maintenance.
     */
    public function sendForMaintenance(Asset $asset, array $data): Asset
    {
        $asset->update([
            'status' => self::STATUS_MAINTENANCE,
            'maintenance_notes' => $data['notes'] ?? null,
            'last_maintenance_date' => now(),
        ]);

        Log::info('Asset sent for maintenance', [
            'asset_id' => $asset->id,
            'reason' => $data['notes'] ?? 'Scheduled maintenance',
        ]);

        return $asset->fresh();
    }

    /**
     * Dispose of an asset.
     */
    public function disposeAsset(Asset $asset, array $data): Asset
    {
        return DB::transaction(function () use ($asset, $data) {
            $activeAllocations = $asset->allocations()
                ->whereNull('returned_at')
                ->count();

            if ($activeAllocations > 0) {
                throw new \RuntimeException('Cannot dispose asset with active allocations. Please return the asset first.');
            }

            $asset->update([
                'status' => self::STATUS_DISPOSED,
                'disposed_at' => now(),
                'disposal_reason' => $data['reason'] ?? null,
                'disposal_method' => $data['method'] ?? null,
                'disposal_value' => $data['value'] ?? 0,
                'disposed_by' => auth()->id(),
            ]);

            Log::info('Asset disposed', [
                'asset_id' => $asset->id,
                'reason' => $data['reason'] ?? null,
            ]);

            return $asset->fresh();
        });
    }

    /**
     * Calculate depreciation value of an asset.
     */
    public function calculateDepreciation(Asset $asset): array
    {
        $purchasePrice = $asset->purchase_price ?? 0;
        $purchaseDate = $asset->purchase_date ?? $asset->created_at;
        $usefulLifeYears = $asset->useful_life_years ?? 5;

        if ($purchasePrice <= 0 || ! $purchaseDate) {
            return [
                'purchase_price' => $purchasePrice,
                'current_value' => $purchasePrice,
                'total_depreciation' => 0,
                'annual_depreciation' => 0,
                'age_years' => 0,
            ];
        }

        $ageYears = now()->diffInYears($purchaseDate);
        $annualDepreciation = $purchasePrice / $usefulLifeYears;
        $totalDepreciation = min($annualDepreciation * $ageYears, $purchasePrice);
        $currentValue = max($purchasePrice - $totalDepreciation, 0);

        return [
            'purchase_price' => $purchasePrice,
            'current_value' => round($currentValue, 2),
            'total_depreciation' => round($totalDepreciation, 2),
            'annual_depreciation' => round($annualDepreciation, 2),
            'age_years' => $ageYears,
            'useful_life_years' => $usefulLifeYears,
            'fully_depreciated' => $ageYears >= $usefulLifeYears,
        ];
    }

    /**
     * Get assets due for maintenance.
     */
    public function getAssetsDueForMaintenance(int $daysThreshold = 90): Collection
    {
        return Asset::where('status', '!=', self::STATUS_DISPOSED)
            ->where(function ($q) use ($daysThreshold) {
                $q->whereNull('last_maintenance_date')
                    ->orWhere('last_maintenance_date', '<=', now()->subDays($daysThreshold));
            })
            ->orderBy('last_maintenance_date')
            ->get();
    }

    /**
     * Get allocation history for an employee.
     */
    public function getEmployeeAssets(Employee $employee): array
    {
        $allocations = AssetAllocation::where('employee_id', $employee->id)
            ->with('asset')
            ->orderByDesc('allocated_at')
            ->get();

        return [
            'current_assets' => $allocations->whereNull('returned_at')->values(),
            'returned_assets' => $allocations->whereNotNull('returned_at')->values(),
            'total_allocated' => $allocations->count(),
        ];
    }
}
