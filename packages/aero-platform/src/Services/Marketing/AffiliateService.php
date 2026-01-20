<?php

declare(strict_types=1);

namespace Aero\Platform\Services\Marketing;

use Aero\Platform\Models\Affiliate;
use Aero\Platform\Models\AffiliatePayout;
use Aero\Platform\Models\AffiliateReferral;
use Aero\Platform\Models\PlatformSetting;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\DB;

/**
 * Affiliate Service
 *
 * Manages affiliate/referral program.
 */
class AffiliateService
{
    protected const COOKIE_NAME = 'aero_ref';

    /**
     * Get paginated affiliates.
     */
    public function getPaginatedAffiliates(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Affiliate::query();

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('referral_code', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $sortBy = $filters['sort_by'] ?? 'created_at';
        $sortDir = $filters['sort_dir'] ?? 'desc';
        $query->orderBy($sortBy, $sortDir);

        return $query->paginate($perPage);
    }

    /**
     * Create an affiliate application.
     */
    public function createAffiliate(array $data): Affiliate
    {
        $settings = PlatformSetting::current()->getAffiliateSettings();

        $affiliate = Affiliate::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'company_name' => $data['company_name'] ?? null,
            'website' => $data['website'] ?? null,
            'commission_rate' => $settings['default_commission_rate'] ?? 10.00,
            'commission_type' => $settings['default_commission_type'] ?? 'percentage',
            'cookie_days' => $settings['cookie_days'] ?? 30,
            'minimum_payout' => $settings['minimum_payout'] ?? 50.00,
            'status' => ($settings['auto_approve_affiliates'] ?? false)
                ? Affiliate::STATUS_APPROVED
                : Affiliate::STATUS_PENDING,
        ]);

        if ($affiliate->isApproved()) {
            $affiliate->update(['approved_at' => now()]);
        }

        return $affiliate;
    }

    /**
     * Track a referral click.
     */
    public function trackReferralClick(string $referralCode): ?AffiliateReferral
    {
        $affiliate = Affiliate::findByCode($referralCode);

        if (! $affiliate) {
            return null;
        }

        $referral = $affiliate->recordReferral([
            'visitor_id' => $this->getVisitorId(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'referrer_url' => request()->headers->get('referer'),
            'landing_page' => request()->fullUrl(),
            'utm_data' => [
                'utm_source' => request()->get('utm_source'),
                'utm_medium' => request()->get('utm_medium'),
                'utm_campaign' => request()->get('utm_campaign'),
            ],
        ]);

        // Set referral cookie
        $cookieDays = $affiliate->cookie_days;
        Cookie::queue(self::COOKIE_NAME, $referralCode, $cookieDays * 24 * 60);

        return $referral;
    }

    /**
     * Get affiliate from cookie.
     */
    public function getAffiliateFromCookie(): ?Affiliate
    {
        $code = Cookie::get(self::COOKIE_NAME);

        if (! $code) {
            return null;
        }

        return Affiliate::findByCode($code);
    }

    /**
     * Get referral from cookie/session.
     */
    public function getCurrentReferral(): ?AffiliateReferral
    {
        $affiliate = $this->getAffiliateFromCookie();

        if (! $affiliate) {
            return null;
        }

        $visitorId = $this->getVisitorId();

        return AffiliateReferral::where('affiliate_id', $affiliate->id)
            ->where('visitor_id', $visitorId)
            ->whereIn('status', [AffiliateReferral::STATUS_CLICKED, AffiliateReferral::STATUS_REGISTERED])
            ->latest()
            ->first();
    }

    /**
     * Record registration from referral.
     */
    public function recordRegistration(string $email): ?AffiliateReferral
    {
        $referral = $this->getCurrentReferral();

        if (! $referral) {
            return null;
        }

        $referral->markAsRegistered($email);

        return $referral;
    }

    /**
     * Record conversion (subscription payment).
     */
    public function recordConversion(int $tenantId, float $transactionAmount): ?AffiliateReferral
    {
        // Find referral by tenant email or current session
        $referral = $this->getCurrentReferral();

        if (! $referral) {
            return null;
        }

        $referral->markAsConverted($tenantId, $transactionAmount);

        // Clear cookie after conversion
        Cookie::queue(Cookie::forget(self::COOKIE_NAME));

        return $referral;
    }

    /**
     * Get affiliate statistics.
     */
    public function getAffiliateStats(?string $period = 'month'): array
    {
        $startDate = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'quarter' => now()->startOfQuarter(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        return [
            'total_affiliates' => Affiliate::count(),
            'active_affiliates' => Affiliate::approved()->count(),
            'pending_affiliates' => Affiliate::pending()->count(),
            'total_referrals' => AffiliateReferral::where('created_at', '>=', $startDate)->count(),
            'conversions' => AffiliateReferral::where('created_at', '>=', $startDate)
                ->where('status', AffiliateReferral::STATUS_CONVERTED)
                ->count(),
            'total_revenue' => AffiliateReferral::where('created_at', '>=', $startDate)
                ->where('status', AffiliateReferral::STATUS_CONVERTED)
                ->sum('transaction_amount'),
            'total_commission' => AffiliateReferral::where('created_at', '>=', $startDate)
                ->where('status', AffiliateReferral::STATUS_CONVERTED)
                ->sum('commission_amount'),
            'pending_payouts' => Affiliate::sum('pending_earnings'),
        ];
    }

    /**
     * Get top affiliates.
     */
    public function getTopAffiliates(int $limit = 10, ?string $period = 'month'): Collection
    {
        $startDate = match ($period) {
            'today' => now()->startOfDay(),
            'week' => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'quarter' => now()->startOfQuarter(),
            'year' => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        return Affiliate::approved()
            ->withCount(['referrals as period_referrals' => function ($query) use ($startDate) {
                $query->where('created_at', '>=', $startDate);
            }])
            ->withSum(['referrals as period_revenue' => function ($query) use ($startDate) {
                $query->where('created_at', '>=', $startDate)
                    ->where('status', AffiliateReferral::STATUS_CONVERTED);
            }], 'transaction_amount')
            ->orderByDesc('period_revenue')
            ->limit($limit)
            ->get();
    }

    /**
     * Get pending payouts.
     */
    public function getPendingPayouts(): Collection
    {
        return Affiliate::approved()
            ->where('pending_earnings', '>=', DB::raw('minimum_payout'))
            ->whereNotNull('payout_method')
            ->get();
    }

    /**
     * Create a payout.
     */
    public function createPayout(Affiliate $affiliate, ?float $amount = null): AffiliatePayout
    {
        return AffiliatePayout::createForAffiliate($affiliate, $amount);
    }

    /**
     * Process a payout.
     */
    public function processPayout(AffiliatePayout $payout): bool
    {
        $payout->markAsProcessing();

        // In real implementation, integrate with payment provider
        // For now, just mark as completed
        // $payout->markAsCompleted('TXN-' . time());

        return true;
    }

    /**
     * Get affiliate referrals.
     */
    public function getAffiliateReferrals(Affiliate $affiliate, array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = $affiliate->referrals();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['commission_status'])) {
            $query->where('commission_status', $filters['commission_status']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * Get affiliate payouts.
     */
    public function getAffiliatePayouts(Affiliate $affiliate, int $perPage = 15): LengthAwarePaginator
    {
        return $affiliate->payouts()->orderByDesc('created_at')->paginate($perPage);
    }

    /**
     * Generate visitor ID.
     */
    protected function getVisitorId(): string
    {
        $sessionId = session()->getId();

        return md5($sessionId . request()->ip());
    }

    /**
     * Check if affiliate program is enabled.
     */
    public function isEnabled(): bool
    {
        $settings = PlatformSetting::current()->getAffiliateSettings();

        return $settings['enabled'] ?? false;
    }
}
