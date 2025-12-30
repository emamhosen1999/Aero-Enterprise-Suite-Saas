# Plans & Pricing Module - Developer Guide

## 🎯 Quick Reference

### Adding Entitlement Checks to Your Routes

```php
// In routes/tenant.php or your module's routes

// Check user limit before creating users
Route::post('/users', [UserController::class, 'store'])
    ->middleware('check-plan-entitlements:users');

// Check storage limit before file uploads
Route::post('/documents/upload', [DocumentController::class, 'upload'])
    ->middleware('check-plan-entitlements:storage');
```

### Checking Module Access in Controllers

```php
use Aero\Platform\Services\PlanEntitlementService;

class FeatureController extends Controller
{
    public function __construct(
        private PlanEntitlementService $entitlementService
    ) {}
    
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;
        
        if (!$this->entitlementService->hasModuleAccess($tenantId, 'crm')) {
            abort(403, 'Your plan does not include CRM module. Please upgrade.');
        }
        
        // ... rest of code
    }
}
```

### Managing Subscriptions

```php
use Aero\Platform\Services\SubscriptionLifecycleService;

class SubscriptionController extends Controller
{
    public function __construct(
        private SubscriptionLifecycleService $lifecycleService
    ) {}
    
    // Upgrade to higher plan
    public function upgrade(Request $request, Subscription $subscription)
    {
        $newPlan = Plan::findOrFail($request->plan_id);
        
        $updatedSubscription = $this->lifecycleService->upgrade(
            $subscription,
            $newPlan
        );
        
        return response()->json([
            'message' => 'Subscription upgraded successfully',
            'subscription' => $updatedSubscription,
        ]);
    }
    
    // Downgrade to lower plan
    public function downgrade(Request $request, Subscription $subscription)
    {
        $newPlan = Plan::findOrFail($request->plan_id);
        
        $updatedSubscription = $this->lifecycleService->downgrade(
            $subscription,
            $newPlan
        );
        
        $message = $subscription->pending_plan_id
            ? 'Downgrade scheduled for end of billing period'
            : 'Subscription downgraded successfully';
        
        return response()->json([
            'message' => $message,
            'subscription' => $updatedSubscription,
        ]);
    }
    
    // Cancel subscription
    public function cancel(Subscription $subscription)
    {
        $this->lifecycleService->cancel($subscription);
        
        return response()->json([
            'message' => 'Subscription cancelled',
            'subscription' => $subscription->fresh(),
        ]);
    }
}
```

### Clearing Entitlement Cache

```php
use Aero\Platform\Services\PlanEntitlementService;

// After subscription changes, clear the cache
app(PlanEntitlementService::class)->clearCache($tenantId);
```

### Checking Remaining Limits

```php
use Aero\Platform\Services\PlanEntitlementService;

$entitlementService = app(PlanEntitlementService::class);

// Get remaining user slots
$remaining = $entitlementService->getRemainingUserSlots($tenantId);

if ($remaining === null) {
    // Unlimited users
} else {
    echo "You can add {$remaining} more users";
}
```

### Creating Plans with Lifecycle Policies

```php
Plan::create([
    'name' => 'Professional',
    'slug' => 'professional',
    'tier' => 'professional',
    'plan_type' => 'paid', // trial, free, paid, custom
    'price' => 49.99,
    'currency' => 'USD',
    'duration_in_months' => 1,
    
    // Lifecycle policies
    'grace_days' => 14,
    'downgrade_policy' => 'end_of_period', // immediate, end_of_period, grace_period
    'cancellation_policy' => 'end_of_period', // immediate, end_of_period, grace_period
    'supports_custom_duration' => false,
    
    // Limits
    'max_users' => 10,
    'max_storage_gb' => 50,
    
    'features' => [
        'Advanced Reporting',
        'Priority Support',
        'API Access',
    ],
    
    'limits' => [
        'max_projects' => 100,
        'max_api_calls_per_month' => 10000,
    ],
    
    'visibility' => 'public', // public or private
    'status' => 'active',
]);

// Sync modules
$plan->modules()->sync([
    'hrm' => ['is_enabled' => true],
    'crm' => ['is_enabled' => true],
    'finance' => ['is_enabled' => false],
]);
```

### Plan Types

| Type | Description | Use Case |
|------|-------------|----------|
| `trial` | Time-limited trial | Free trial with expiration |
| `free` | Forever free | Community/hobby tier |
| `paid` | Standard paid | Regular subscriptions |
| `custom` | Custom pricing | Enterprise/negotiated deals |

### Downgrade Policies

| Policy | Behavior | When to Use |
|--------|----------|-------------|
| `immediate` | Apply new plan instantly | Generous downgrades |
| `end_of_period` | Apply at next billing date | Default behavior |
| `grace_period` | Apply after grace_days | Prevent churn |

### Cancellation Policies

| Policy | Behavior | When to Use |
|--------|----------|-------------|
| `immediate` | Revoke access now | Strict policy |
| `end_of_period` | Access until paid period ends | Fair to users |
| `grace_period` | Access for grace_days | Re-engagement opportunity |

### Scheduled Tasks Setup

Add to `routes/console.php`:

```php
use Illuminate\Support\Facades\Schedule;

Schedule::command('subscriptions:process-pending')
    ->daily()
    ->at('02:00'); // Run at 2 AM
```

Or use Laravel's task scheduler in `app/Console/Kernel.php` (if not using Laravel 11 structure):

```php
protected function schedule(Schedule $schedule): void
{
    $schedule->command('subscriptions:process-pending')
        ->daily()
        ->at('02:00');
}
```

### Audit Log Queries

```bash
# View audit logs
tail -f storage/logs/audit.log

# Search for specific plan changes
grep "plan_slug.*professional" storage/logs/audit.log

# Find who deleted plans
grep "action.*deleted" storage/logs/audit.log
```

### Testing Middleware

```php
// In your feature tests
public function test_user_limit_enforced()
{
    $tenant = Tenant::factory()->create();
    $subscription = Subscription::factory()->for($tenant)->create([
        'plan_id' => Plan::factory()->create(['max_users' => 5]),
    ]);
    
    // Create 5 users (at limit)
    User::factory()->count(5)->create(['tenant_id' => $tenant->id]);
    
    // Attempt to create 6th user
    $response = $this->actingAs($user)
        ->post('/users', [/* user data */]);
    
    $response->assertStatus(403);
    $response->assertJson([
        'message' => 'User limit reached for your plan',
    ]);
}
```

### Frontend: Checking Entitlements

```jsx
// In your React components
import { usePage } from '@inertiajs/react';

const MyComponent = () => {
    const { auth } = usePage().props;
    const subscription = auth.user?.tenant?.subscription;
    
    const canAddUsers = subscription?.remaining_user_slots > 0;
    const hasModuleAccess = subscription?.plan?.modules?.includes('crm');
    
    return (
        <div>
            {canAddUsers ? (
                <Button onPress={handleAddUser}>Add User</Button>
            ) : (
                <Alert>
                    User limit reached. 
                    <Link href="/upgrade">Upgrade Plan</Link>
                </Alert>
            )}
            
            {hasModuleAccess ? (
                <CRMDashboard />
            ) : (
                <UpgradePrompt module="CRM" />
            )}
        </div>
    );
};
```

### Common Gotchas

1. **Always clear entitlement cache after subscription changes:**
   ```php
   app(PlanEntitlementService::class)->clearCache($tenantId);
   ```

2. **Check for `null` when getting remaining slots (means unlimited):**
   ```php
   $remaining = $entitlementService->getRemainingUserSlots($tenantId);
   if ($remaining === null) {
       // Unlimited - don't block
   }
   ```

3. **Pending downgrades need the scheduled command running:**
   ```bash
   php artisan subscriptions:process-pending
   ```

4. **Module sync in seeder requires modules table (SaaS mode only):**
   ```php
   if (Schema::hasTable('modules')) {
       $plan->modules()->sync($moduleCodes);
   }
   ```

5. **Plan deletion checks for active subscriptions:**
   ```php
   // This will fail if subscriptions exist
   $plan->delete();
   
   // Check first
   if ($plan->subscriptions()->active()->exists()) {
       throw new \Exception('Cannot delete plan with active subscriptions');
   }
   ```

### API Endpoints Reference

```
# Admin Plan Management
GET    /admin/plans                  # List all plans (paginated)
POST   /admin/plans                  # Create new plan
GET    /admin/plans/{id}             # Show plan details
PUT    /admin/plans/{id}             # Update plan
DELETE /admin/plans/{id}             # Delete plan (checks active subscriptions)
POST   /admin/plans/{id}/archive     # Archive/unarchive plan

# Public Plans (for registration/upgrade pages)
GET    /api/plans/public             # List public plans only

# Plan Modules
POST   /admin/plans/{id}/modules     # Attach modules to plan
DELETE /admin/plans/{id}/modules/{moduleId}  # Detach module
```

### Common Queries

```php
// Get active subscription for tenant
$subscription = Subscription::where('tenant_id', $tenant->id)
    ->with('plan.modules')
    ->active()
    ->first();

// Get all plans with specific tier
$plans = Plan::where('tier', 'professional')
    ->where('visibility', 'public')
    ->where('status', 'active')
    ->get();

// Get plans with module included
$plans = Plan::whereHas('modules', function ($query) {
    $query->where('code', 'crm')->where('is_enabled', true);
})->get();

// Get subscriptions scheduled for downgrade
$subscriptions = Subscription::whereNotNull('pending_plan_id')
    ->whereNotNull('downgrade_scheduled_at')
    ->where('downgrade_scheduled_at', '<=', now())
    ->get();
```

---

## 🎉 You're All Set!

The Plans & Pricing module is fully implemented and ready to use. Follow the patterns above to integrate plan-based access control into your features.
