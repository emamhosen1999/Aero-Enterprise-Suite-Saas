<?php

namespace App\Models\HRM;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxSlab extends Model
{
    use HasFactory;

    protected $table = 'tax_slabs';

    protected $fillable = [
        'name',
        'min_income',
        'max_income',
        'tax_rate',
        'is_active',
        'country',
        'state',
        'financial_year',
        'description',
    ];

    protected $casts = [
        'min_income' => 'decimal:2',
        'max_income' => 'decimal:2',
        'tax_rate' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Get tax slabs for a specific financial year
     */
    public static function getActiveSlabs($financialYear = null)
    {
        $query = self::where('is_active', true);

        if ($financialYear) {
            $query->where('financial_year', $financialYear);
        }

        return $query->orderBy('min_income')->get();
    }

    /**
     * Calculate tax for a given income
     */
    public static function calculateTax($income, $financialYear = null)
    {
        $slabs = self::getActiveSlabs($financialYear);
        $totalTax = 0;
        $remainingIncome = $income;

        foreach ($slabs as $slab) {
            if ($remainingIncome <= 0) {
                break;
            }

            $slabIncome = $slab->max_income - $slab->min_income;
            $taxableInThisSlab = min($remainingIncome, $slabIncome);
            $tax = $taxableInThisSlab * ($slab->tax_rate / 100);

            $totalTax += $tax;
            $remainingIncome -= $taxableInThisSlab;
        }

        return $totalTax;
    }

    /**
     * Get default tax slabs (Indian tax structure)
     */
    public static function getDefaultSlabs()
    {
        return [
            [
                'name' => '0-2.5 Lakh',
                'min_income' => 0,
                'max_income' => 250000,
                'tax_rate' => 0,
                'is_active' => true,
                'country' => 'India',
                'financial_year' => '2024-25',
                'description' => 'No tax for income up to 2.5 lakh',
            ],
            [
                'name' => '2.5-5 Lakh',
                'min_income' => 250001,
                'max_income' => 500000,
                'tax_rate' => 5,
                'is_active' => true,
                'country' => 'India',
                'financial_year' => '2024-25',
                'description' => '5% tax for income 2.5-5 lakh',
            ],
            [
                'name' => '5-10 Lakh',
                'min_income' => 500001,
                'max_income' => 1000000,
                'tax_rate' => 20,
                'is_active' => true,
                'country' => 'India',
                'financial_year' => '2024-25',
                'description' => '20% tax for income 5-10 lakh',
            ],
            [
                'name' => 'Above 10 Lakh',
                'min_income' => 1000001,
                'max_income' => 99999999,
                'tax_rate' => 30,
                'is_active' => true,
                'country' => 'India',
                'financial_year' => '2024-25',
                'description' => '30% tax for income above 10 lakh',
            ],
        ];
    }
}
