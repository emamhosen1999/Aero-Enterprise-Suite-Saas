<?php

namespace Aero\HRM\Database\Seeders;

use Aero\HRM\Models\ExpenseCategory;
use Illuminate\Database\Seeder;

class HrmExpenseCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Travel',
                'code' => 'TRV',
                'description' => 'Business travel expenses including flights, trains, and taxis.',
                'requires_receipt' => true,
                'max_amount' => 5000.00,
            ],
            [
                'name' => 'Meals & Entertainment',
                'code' => 'MNE',
                'description' => 'Business meals, client entertainment, and team events.',
                'requires_receipt' => true,
                'max_amount' => 500.00,
            ],
            [
                'name' => 'Office Supplies',
                'code' => 'OFS',
                'description' => 'Stationery, printing supplies, and general office consumables.',
                'requires_receipt' => true,
                'max_amount' => 300.00,
            ],
            [
                'name' => 'Equipment',
                'code' => 'EQP',
                'description' => 'Hardware, peripherals, and work-related equipment.',
                'requires_receipt' => true,
                'max_amount' => 3000.00,
            ],
            [
                'name' => 'Software & Subscriptions',
                'code' => 'SFT',
                'description' => 'Software licenses, SaaS subscriptions, and digital tools.',
                'requires_receipt' => true,
                'max_amount' => 1000.00,
            ],
            [
                'name' => 'Training',
                'code' => 'TRN',
                'description' => 'Courses, certifications, workshops, and conference fees.',
                'requires_receipt' => true,
                'max_amount' => 2000.00,
            ],
            [
                'name' => 'Communication',
                'code' => 'COM',
                'description' => 'Phone bills, internet charges, and postal expenses.',
                'requires_receipt' => false,
                'max_amount' => 200.00,
            ],
            [
                'name' => 'Transportation',
                'code' => 'TRP',
                'description' => 'Local commute, fuel, parking, and toll charges.',
                'requires_receipt' => false,
                'max_amount' => 500.00,
            ],
            [
                'name' => 'Accommodation',
                'code' => 'ACC',
                'description' => 'Hotel stays and lodging for business trips.',
                'requires_receipt' => true,
                'max_amount' => 3000.00,
            ],
            [
                'name' => 'Miscellaneous',
                'code' => 'MSC',
                'description' => 'Other business-related expenses not covered by specific categories.',
                'requires_receipt' => true,
                'max_amount' => null,
            ],
        ];

        foreach ($categories as $category) {
            ExpenseCategory::firstOrCreate(
                ['code' => $category['code']],
                array_merge($category, [
                    'requires_approval' => true,
                    'is_active' => true,
                ])
            );
        }
    }
}
