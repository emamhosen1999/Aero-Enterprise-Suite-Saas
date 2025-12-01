<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Tenant Subscription Management Controller
 *
 * Handles tenant-facing subscription operations including:
 * - Viewing current subscription details
 * - Comparing and changing plans
 * - Viewing usage metrics
 * - Managing invoices
 * - Cancelling/resuming subscriptions
 */
class SubscriptionController extends Controller
{
    /**
     * Display subscription overview
     */
    public function index(Request $request): Response
    {
        $tenant = $request->user()->currentTenant;

        // Get subscription data
        $subscription = $tenant->subscription('default');

        // Get usage data
        $usage = [
            'users' => $tenant->users()->count(),
            'storage_bytes' => $tenant->calculateStorageUsage(),
            'api_calls' => $tenant->getApiCallsThisMonth(),
            'active_modules' => $tenant->modules()->where('is_active', true)->count(),
        ];

        // Get recent invoices (last 5)
        $recentInvoices = $tenant->invoices()
            ->orderBy('created_at', 'desc')
            ->take(5)
            ->get()
            ->map(fn ($invoice) => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'date' => $invoice->date()->toDateString(),
                'amount' => $invoice->total(),
                'status' => $invoice->status,
                'description' => $invoice->lines->first()?->description ?? 'Subscription payment',
            ]);

        // Get payment method
        $paymentMethod = $tenant->defaultPaymentMethod();

        return Inertia::render('Tenant/Pages/Subscription/Index', [
            'subscription' => [
                'id' => $subscription?->stripe_id,
                'status' => $subscription?->stripe_status ?? 'inactive',
                'plan' => [
                    'name' => $subscription?->stripe_price ?? 'Free',
                    'price' => $subscription?->price ?? 0,
                    'interval' => $subscription?->recurring()?->interval ?? 'month',
                ],
                'trial_ends_at' => $subscription?->trial_ends_at?->toDateString(),
                'ends_at' => $subscription?->ends_at?->toDateString(),
                'next_payment' => [
                    'date' => $subscription?->nextPayment()?->toDateString(),
                    'amount' => $subscription?->price ?? 0,
                ],
            ],
            'usage' => $usage,
            'recent_invoices' => $recentInvoices,
            'payment_method' => $paymentMethod ? [
                'brand' => $paymentMethod->card->brand,
                'last4' => $paymentMethod->card->last4,
                'exp_month' => $paymentMethod->card->exp_month,
                'exp_year' => $paymentMethod->card->exp_year,
            ] : null,
        ]);
    }

    /**
     * Display available plans
     */
    public function plans(Request $request): Response
    {
        $tenant = $request->user()->currentTenant;
        $currentSubscription = $tenant->subscription('default');

        // Define available plans
        $plans = [
            [
                'id' => 'starter',
                'name' => 'Starter',
                'description' => 'Perfect for small teams getting started',
                'monthly_price' => 29,
                'yearly_price' => 290,
                'features' => [
                    'users' => 10,
                    'storage_gb' => 50,
                    'modules' => ['dms', 'compliance'],
                    'support' => 'Email support',
                    'api_access' => true,
                    'custom_branding' => false,
                ],
            ],
            [
                'id' => 'professional',
                'name' => 'Professional',
                'description' => 'For growing businesses with advanced needs',
                'monthly_price' => 99,
                'yearly_price' => 990,
                'features' => [
                    'users' => 50,
                    'storage_gb' => 500,
                    'modules' => ['dms', 'compliance', 'hr', 'project_management'],
                    'support' => 'Priority support',
                    'api_access' => true,
                    'custom_branding' => true,
                ],
                'popular' => true,
            ],
            [
                'id' => 'enterprise',
                'name' => 'Enterprise',
                'description' => 'Unlimited power for large organizations',
                'monthly_price' => 299,
                'yearly_price' => 2990,
                'features' => [
                    'users' => -1, // Unlimited
                    'storage_gb' => -1, // Unlimited
                    'modules' => ['all'],
                    'support' => 'Dedicated support',
                    'api_access' => true,
                    'custom_branding' => true,
                ],
            ],
        ];

        return Inertia::render('Tenant/Pages/Subscription/Plans', [
            'plans' => $plans,
            'current_plan' => $currentSubscription?->stripe_price,
        ]);
    }

    /**
     * Change subscription plan
     */
    public function changePlan(Request $request): RedirectResponse
    {
        $request->validate([
            'plan' => 'required|string|in:starter,professional,enterprise',
            'billing_cycle' => 'required|string|in:monthly,yearly',
        ]);

        $tenant = $request->user()->currentTenant;
        $subscription = $tenant->subscription('default');

        try {
            if ($subscription && $subscription->active()) {
                // Swap to new plan
                $subscription->swap($request->plan);
            } else {
                // Create new subscription
                $tenant->newSubscription('default', $request->plan)->create();
            }

            return redirect()->route('tenant.subscription.index')
                ->with('toast', [
                    'type' => 'success',
                    'message' => 'Plan changed successfully!',
                ]);
        } catch (\Exception $e) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Failed to change plan: '.$e->getMessage(),
            ]);
        }
    }

    /**
     * Cancel subscription
     */
    public function cancel(Request $request): RedirectResponse
    {
        $tenant = $request->user()->currentTenant;
        $subscription = $tenant->subscription('default');

        if (! $subscription || ! $subscription->active()) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'No active subscription found.',
            ]);
        }

        try {
            $subscription->cancel();

            return back()->with('toast', [
                'type' => 'success',
                'message' => 'Subscription cancelled. You can continue using your plan until the end of your billing period.',
            ]);
        } catch (\Exception $e) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Failed to cancel subscription: '.$e->getMessage(),
            ]);
        }
    }

    /**
     * Resume cancelled subscription
     */
    public function resume(Request $request): RedirectResponse
    {
        $tenant = $request->user()->currentTenant;
        $subscription = $tenant->subscription('default');

        if (! $subscription || ! $subscription->onGracePeriod()) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'No cancelled subscription found.',
            ]);
        }

        try {
            $subscription->resume();

            return back()->with('toast', [
                'type' => 'success',
                'message' => 'Subscription resumed successfully!',
            ]);
        } catch (\Exception $e) {
            return back()->with('toast', [
                'type' => 'error',
                'message' => 'Failed to resume subscription: '.$e->getMessage(),
            ]);
        }
    }

    /**
     * Display detailed usage metrics
     */
    public function usage(Request $request): Response
    {
        $tenant = $request->user()->currentTenant;
        $period = $request->input('period', '30d');

        // Calculate days based on period
        $days = match ($period) {
            '7d' => 7,
            '90d' => 90,
            default => 30,
        };

        // Get current usage
        $usage = [
            'users' => $tenant->users()->count(),
            'active_users' => $tenant->users()->where('last_login_at', '>=', now()->subDays(30))->count(),
            'storage_bytes' => $tenant->calculateStorageUsage(),
            'api_calls' => $tenant->getApiCallsThisMonth(),
            'active_modules' => $tenant->modules()->where('is_active', true)->count(),
            'storage_breakdown' => $tenant->getStorageBreakdown(),
        ];

        // Get historical data
        $historicalData = $tenant->usageMetrics()
            ->where('recorded_at', '>=', now()->subDays($days))
            ->orderBy('recorded_at', 'asc')
            ->get()
            ->map(fn ($metric) => [
                'date' => $metric->recorded_at->toDateString(),
                'users' => $metric->users,
                'storage_bytes' => $metric->storage_bytes,
                'api_calls' => $metric->api_calls,
            ]);

        return Inertia::render('Tenant/Pages/Subscription/Usage', [
            'usage' => $usage,
            'historical_data' => $historicalData,
            'period' => $period,
        ]);
    }

    /**
     * Display invoices
     */
    public function invoices(Request $request): Response
    {
        $tenant = $request->user()->currentTenant;

        $invoices = $tenant->invoices()
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(fn ($invoice) => [
                'id' => $invoice->id,
                'number' => $invoice->number,
                'date' => $invoice->date()->toDateString(),
                'amount' => $invoice->total(),
                'status' => $invoice->status,
                'description' => $invoice->lines->first()?->description ?? 'Subscription payment',
            ]);

        return Inertia::render('Tenant/Pages/Subscription/Invoices', [
            'invoices' => $invoices->items(),
            'pagination' => [
                'current_page' => $invoices->currentPage(),
                'last_page' => $invoices->lastPage(),
                'per_page' => $invoices->perPage(),
                'total' => $invoices->total(),
            ],
        ]);
    }

    /**
     * Download invoice PDF
     */
    public function downloadInvoice(Request $request, string $invoiceId): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $tenant = $request->user()->currentTenant;

        return $tenant->downloadInvoice($invoiceId, [
            'vendor' => config('app.name'),
            'product' => 'Subscription',
        ]);
    }
}
