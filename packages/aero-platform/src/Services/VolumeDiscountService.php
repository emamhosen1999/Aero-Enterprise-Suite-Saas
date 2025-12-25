<?php

namespace Aero\Platform\Services;

/**
 * Volume Discount Service
 * 
 * Calculates tiered pricing discounts based on user/seat count.
 * Supports: 10% @ 50 users, 15% @ 100 users, 20% @ 200+ users
 */
class VolumeDiscountService
{
    /**
     * Discount tiers: [min_quantity => discount_percentage]
     */
    protected array $discountTiers = [
        1 => 0,      // 0% discount for 1-49 users
        50 => 10,    // 10% discount for 50-99 users
        100 => 15,   // 15% discount for 100-199 users
        200 => 20,   // 20% discount for 200+ users
    ];
    
    /**
     * Calculate discount percentage for given quantity
     *
     * @param int $quantity Number of users/seats
     * @return float Discount percentage (0-20)
     */
    public function getDiscountPercentage(int $quantity): float
    {
        if ($quantity < 1) {
            return 0;
        }
        
        $applicableDiscount = 0;
        
        foreach ($this->discountTiers as $minQuantity => $discount) {
            if ($quantity >= $minQuantity) {
                $applicableDiscount = $discount;
            } else {
                break;
            }
        }
        
        return (float) $applicableDiscount;
    }
    
    /**
     * Calculate discounted price
     *
     * @param float $basePrice Per-user price
     * @param int $quantity Number of users
     * @return array ['total' => float, 'discount_percentage' => float, 'discount_amount' => float]
     */
    public function calculatePrice(float $basePrice, int $quantity): array
    {
        $discountPercentage = $this->getDiscountPercentage($quantity);
        $subtotal = $basePrice * $quantity;
        $discountAmount = $subtotal * ($discountPercentage / 100);
        $total = $subtotal - $discountAmount;
        
        return [
            'base_price' => round($basePrice, 2),
            'quantity' => $quantity,
            'subtotal' => round($subtotal, 2),
            'discount_percentage' => $discountPercentage,
            'discount_amount' => round($discountAmount, 2),
            'total' => round($total, 2),
            'per_user_cost' => round($total / $quantity, 2),
        ];
    }
    
    /**
     * Calculate savings compared to no discount
     *
     * @param float $basePrice
     * @param int $quantity
     * @return array
     */
    public function calculateSavings(float $basePrice, int $quantity): array
    {
        $withoutDiscount = $basePrice * $quantity;
        $withDiscount = $this->calculatePrice($basePrice, $quantity)['total'];
        $savings = $withoutDiscount - $withDiscount;
        
        return [
            'without_discount' => round($withoutDiscount, 2),
            'with_discount' => round($withDiscount, 2),
            'savings' => round($savings, 2),
            'savings_percentage' => round(($savings / $withoutDiscount) * 100, 1),
        ];
    }
    
    /**
     * Get next discount tier information
     *
     * @param int $currentQuantity
     * @return array|null ['next_tier' => int, 'discount' => float, 'users_needed' => int]
     */
    public function getNextTier(int $currentQuantity): ?array
    {
        foreach ($this->discountTiers as $minQuantity => $discount) {
            if ($currentQuantity < $minQuantity) {
                return [
                    'next_tier' => $minQuantity,
                    'discount' => $discount,
                    'users_needed' => $minQuantity - $currentQuantity,
                    'message' => "Add {$this->usersNeeded($currentQuantity, $minQuantity)} more users to unlock {$discount}% discount",
                ];
            }
        }
        
        // Already at highest tier
        return null;
    }
    
    /**
     * Format users needed message
     */
    protected function usersNeeded(int $current, int $next): int
    {
        return $next - $current;
    }
    
    /**
     * Get all discount tiers
     *
     * @return array
     */
    public function getAllTiers(): array
    {
        $tiers = [];
        
        foreach ($this->discountTiers as $minQuantity => $discount) {
            $tiers[] = [
                'min_quantity' => $minQuantity,
                'discount_percentage' => $discount,
                'label' => $this->getTierLabel($minQuantity, $discount),
            ];
        }
        
        return $tiers;
    }
    
    /**
     * Get tier label for display
     */
    protected function getTierLabel(int $minQuantity, float $discount): string
    {
        if ($discount == 0) {
            return "1-49 users: Standard pricing";
        }
        
        return "{$minQuantity}+ users: {$discount}% discount";
    }
    
    /**
     * Calculate pricing comparison table for multiple quantities
     *
     * @param float $basePrice
     * @param array $quantities Example: [10, 50, 100, 200]
     * @return array
     */
    public function generatePricingTable(float $basePrice, array $quantities = [10, 50, 100, 200]): array
    {
        $table = [];
        
        foreach ($quantities as $quantity) {
            $pricing = $this->calculatePrice($basePrice, $quantity);
            $table[] = [
                'quantity' => $quantity,
                'discount' => $pricing['discount_percentage'] . '%',
                'per_user' => '$' . $pricing['per_user_cost'],
                'total' => '$' . $pricing['total'],
                'savings' => '$' . $pricing['discount_amount'],
            ];
        }
        
        return $table;
    }
    
    /**
     * Set custom discount tiers
     *
     * @param array $tiers [min_quantity => discount_percentage]
     * @return self
     */
    public function setDiscountTiers(array $tiers): self
    {
        ksort($tiers);
        $this->discountTiers = $tiers;
        return $this;
    }
}
