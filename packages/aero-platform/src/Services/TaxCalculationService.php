<?php

namespace Aero\Platform\Services;

class TaxCalculationService
{
    protected array $vatRates = [
        // EU countries
        'AT' => 20.0, 'BE' => 21.0, 'BG' => 20.0, 'CY' => 19.0, 'CZ' => 21.0,
        'DE' => 19.0, 'DK' => 25.0, 'EE' => 20.0, 'ES' => 21.0, 'FI' => 24.0,
        'FR' => 20.0, 'GR' => 24.0, 'HR' => 25.0, 'HU' => 27.0, 'IE' => 23.0,
        'IT' => 22.0, 'LT' => 21.0, 'LU' => 17.0, 'LV' => 21.0, 'MT' => 18.0,
        'NL' => 21.0, 'PL' => 23.0, 'PT' => 23.0, 'RO' => 19.0, 'SE' => 25.0,
        'SI' => 22.0, 'SK' => 20.0,
        
        // Other countries
        'GB' => 20.0, // UK VAT
        'AU' => 10.0, // Australian GST
        'CA' => 5.0,  // Canadian GST (varies by province)
        'NZ' => 15.0, // New Zealand GST
        'SG' => 9.0,  // Singapore GST
        'CH' => 7.7,  // Swiss VAT
        'NO' => 25.0, // Norwegian VAT
    ];

    protected array $euCountries = [
        'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI',
        'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
        'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
    ];

    /**
     * Calculate tax for a given amount and country.
     */
    public function calculateTax(
        float $amount,
        string $countryCode,
        bool $isBusinessCustomer = false,
        ?string $vatNumber = null
    ): array {
        // B2B in EU with valid VAT number: reverse charge (no VAT)
        if ($isBusinessCustomer && $this->isEuCountry($countryCode) && $vatNumber) {
            return [
                'amount' => $amount,
                'tax' => 0,
                'total' => $amount,
                'tax_rate' => 0,
                'tax_type' => 'reverse_charge',
                'tax_exempt' => true,
                'vat_number' => $vatNumber,
            ];
        }

        $rate = $this->getTaxRate($countryCode);
        $tax = ($amount * $rate) / 100;
        
        return [
            'amount' => round($amount, 2),
            'tax' => round($tax, 2),
            'total' => round($amount + $tax, 2),
            'tax_rate' => $rate,
            'tax_type' => $this->getTaxType($countryCode),
            'tax_exempt' => false,
            'vat_number' => null,
        ];
    }

    /**
     * Get tax rate for a country.
     */
    public function getTaxRate(string $countryCode): float
    {
        return $this->vatRates[strtoupper($countryCode)] ?? 0.0;
    }

    /**
     * Get tax type name for a country.
     */
    protected function getTaxType(string $countryCode): string
    {
        $code = strtoupper($countryCode);
        
        if ($this->isEuCountry($code) || $code === 'GB') {
            return 'VAT';
        }
        
        if (in_array($code, ['AU', 'NZ', 'CA', 'SG'])) {
            return 'GST';
        }
        
        if ($code === 'US') {
            return 'Sales Tax';
        }
        
        return 'Tax';
    }

    /**
     * Check if country is in the EU.
     */
    protected function isEuCountry(string $countryCode): bool
    {
        return in_array(strtoupper($countryCode), $this->euCountries);
    }

    /**
     * Validate VAT number format (basic validation).
     */
    public function validateVatNumber(string $vatNumber, string $countryCode): bool
    {
        // Remove spaces and convert to uppercase
        $vatNumber = strtoupper(str_replace(' ', '', $vatNumber));
        $countryCode = strtoupper($countryCode);

        // Basic format validation
        $patterns = [
            'AT' => '/^ATU\d{8}$/',
            'BE' => '/^BE0?\d{9}$/',
            'DE' => '/^DE\d{9}$/',
            'ES' => '/^ES[A-Z0-9]\d{7}[A-Z0-9]$/',
            'FR' => '/^FR[A-Z0-9]{2}\d{9}$/',
            'GB' => '/^GB\d{9}$|^GB\d{12}$|^GBGD\d{3}$|^GBHA\d{3}$/',
            'IT' => '/^IT\d{11}$/',
            'NL' => '/^NL\d{9}B\d{2}$/',
        ];

        if (isset($patterns[$countryCode])) {
            return preg_match($patterns[$countryCode], $vatNumber) === 1;
        }

        // For countries without pattern, just check if it starts with country code
        return str_starts_with($vatNumber, $countryCode);
    }

    /**
     * Calculate tax for multiple line items.
     */
    public function calculateMultipleItems(array $items, string $countryCode, bool $isBusinessCustomer = false): array
    {
        $subtotal = 0;
        $totalTax = 0;
        $itemsWithTax = [];

        foreach ($items as $item) {
            $amount = $item['amount'] ?? 0;
            $taxCalc = $this->calculateTax($amount, $countryCode, $isBusinessCustomer);
            
            $subtotal += $taxCalc['amount'];
            $totalTax += $taxCalc['tax'];
            
            $itemsWithTax[] = array_merge($item, $taxCalc);
        }

        return [
            'items' => $itemsWithTax,
            'subtotal' => round($subtotal, 2),
            'total_tax' => round($totalTax, 2),
            'grand_total' => round($subtotal + $totalTax, 2),
            'tax_type' => $this->getTaxType($countryCode),
            'tax_rate' => $this->getTaxRate($countryCode),
        ];
    }

    /**
     * Get all supported tax rates.
     */
    public function getAllRates(): array
    {
        return $this->vatRates;
    }

    /**
     * Check if tax is applicable for a country.
     */
    public function hasTax(string $countryCode): bool
    {
        return isset($this->vatRates[strtoupper($countryCode)]);
    }

    /**
     * Calculate net amount from gross (tax inclusive) amount.
     */
    public function calculateNetFromGross(float $grossAmount, string $countryCode): array
    {
        $rate = $this->getTaxRate($countryCode);
        $net = $grossAmount / (1 + $rate / 100);
        $tax = $grossAmount - $net;

        return [
            'gross' => round($grossAmount, 2),
            'net' => round($net, 2),
            'tax' => round($tax, 2),
            'tax_rate' => $rate,
            'tax_type' => $this->getTaxType($countryCode),
        ];
    }
}
