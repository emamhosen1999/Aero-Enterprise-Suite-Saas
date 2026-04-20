<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\AssetCategory;
use Illuminate\Database\Seeder;

class HrmAssetCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Laptop', 'code' => 'LPT', 'description' => 'Portable computers for work use.', 'icon' => 'ComputerDesktopIcon'],
            ['name' => 'Desktop', 'code' => 'DSK', 'description' => 'Desktop computers and workstations.', 'icon' => 'ComputerDesktopIcon'],
            ['name' => 'Monitor', 'code' => 'MON', 'description' => 'Display screens and monitors.', 'icon' => 'TvIcon'],
            ['name' => 'Mobile Phone', 'code' => 'MOB', 'description' => 'Company-issued mobile phones.', 'icon' => 'DevicePhoneMobileIcon'],
            ['name' => 'Tablet', 'code' => 'TAB', 'description' => 'Tablet devices for work use.', 'icon' => 'DeviceTabletIcon'],
            ['name' => 'Printer', 'code' => 'PRN', 'description' => 'Printers and multifunction devices.', 'icon' => 'PrinterIcon'],
            ['name' => 'Chair', 'code' => 'CHR', 'description' => 'Office chairs and ergonomic seating.', 'icon' => 'CubeIcon'],
            ['name' => 'Desk', 'code' => 'DST', 'description' => 'Office desks and workstations.', 'icon' => 'RectangleGroupIcon'],
            ['name' => 'Vehicle', 'code' => 'VHC', 'description' => 'Company vehicles for business use.', 'icon' => 'TruckIcon'],
            ['name' => 'ID Card', 'code' => 'IDC', 'description' => 'Employee identification cards.', 'icon' => 'IdentificationIcon'],
            ['name' => 'Access Card', 'code' => 'ACS', 'description' => 'Building and facility access cards.', 'icon' => 'KeyIcon'],
        ];

        foreach ($categories as $category) {
            AssetCategory::firstOrCreate(
                ['code' => $category['code']],
                array_merge($category, ['is_active' => true])
            );
        }
    }
}
