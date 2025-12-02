# Leave Balance System Implementation - Complete

## Overview
Implemented a comprehensive leave balance tracking system with automatic accrual, carry-forward, and event-driven balance updates.

## Components Created

### 1. Model: `LeaveBalance`
**Location:** `app/Models/HRM/LeaveBalance.php`

**Features:**
- Tracks per-user, per-leave-type, per-year balances
- Fields: `allocated`, `used`, `pending`, `available`, `carried_forward`, `encashed`
- Methods:
  - `calculateAvailable()` - Real-time balance calculation
  - `hasSufficientBalance($days)` - Balance validation
  - `deduct($days)` - Deduct used days
  - `addPending($days)` - Add pending leave request
  - `approvePending($days)` - Move from pending to used
  - `removePending($days)` - Cancel pending leave

### 2. Service: `LeaveBalanceService`
**Location:** `app/Services/Leave/LeaveBalanceService.php`

**Core Methods:**
- `initializeBalancesForUser(User $user, int $year)` - Initialize year balances
- `initializeBalancesForAllUsers(int $year)` - Bulk initialization
- `getBalance(User $user, int $leaveSettingId, int $year)` - Fetch balance
- `getAllBalances(User $user, int $year)` - Fetch all types
- `hasSufficientBalance(...)` - Pre-request validation

**Event Handlers:**
- `handleLeaveRequest(Leave $leave)` - Add to pending
- `handleLeaveApproval(Leave $leave)` - Move pending → used
- `handleLeaveRejection(Leave $leave)` - Remove from pending
- `handleLeaveCancellation(Leave $leave)` - Refund or remove pending

**Automated Processes:**
- `processMonthlyAccrual()` - Monthly leave accrual for eligible types
- `processCarryForward(int $fromYear, int $toYear)` - Year-end carry forward

**Reporting:**
- `getBalanceSummary(int $year)` - Aggregated statistics

### 3. Events
**Location:** `app/Events/Leave/`

Created 4 event classes:
- `LeaveRequested` - Fired when employee submits leave
- `LeaveApproved` - Fired when leave is approved
- `LeaveRejected` - Fired when leave is rejected
- `LeaveCancelled` - Fired when leave is cancelled

### 4. Listeners
**Location:** `app/Listeners/Leave/`

Created 4 queued listeners:
- `UpdateBalanceOnLeaveRequest`
- `UpdateBalanceOnLeaveApproval`
- `UpdateBalanceOnLeaveRejection`
- `UpdateBalanceOnLeaveCancellation`

All registered in `EventServiceProvider`.

### 5. Console Commands
**Location:** `app/Console/Commands/Leave/`

#### `ProcessMonthlyAccrual`
- **Command:** `php artisan leave:process-monthly-accrual`
- **Purpose:** Process monthly accrual for leave types with `accrual_type='monthly'`
- **Schedule:** Runs automatically on 1st of each month at 00:00

#### `ProcessYearlyCarryForward`
- **Command:** `php artisan leave:process-carry-forward`
- **Options:**
  - `--from-year=2024` - Source year
  - `--to-year=2025` - Target year
- **Purpose:** Carry forward unused leave to next year
- **Schedule:** Runs automatically on January 1st at 00:00

### 6. Database Changes
**Migration:** `2025_12_02_121546_create_hrm_core_tables.php`

Updated `leave_balances` table:
```php
- user_id (FK to users)
- leave_setting_id (FK to leave_settings)
- year
- allocated (decimal 5,2)
- used (decimal 5,2)
- pending (decimal 5,2)
- available (decimal 5,2)
- carried_forward (decimal 5,2)
- encashed (decimal 5,2)
- notes (text)
- Unique constraint: (user_id, leave_setting_id, year)
```

Updated `leave_settings` table:
```php
+ accrual_type enum('yearly', 'monthly', 'none') - NEW FIELD
```

Updated `LeaveSetting` model:
- Added new fillable fields
- Added `balances()` relationship

## Scheduler Configuration
**File:** `app/Console/Kernel.php`

Updated scheduled tasks:
- **Monthly Accrual:** 1st of every month at 00:00
- **Carry Forward:** January 1st at 00:00

Both tasks include:
- Logging (before/success/failure)
- Output to dedicated log files
- Overlap prevention
- Timezone awareness

## How It Works

### 1. Initialization
When a new employee joins or new year begins:
```php
$leaveBalanceService->initializeBalancesForUser($user, 2025);
```

### 2. Leave Request Flow
```
Employee submits leave
    ↓
LeaveRequested event fired
    ↓
UpdateBalanceOnLeaveRequest listener
    ↓
LeaveBalanceService->handleLeaveRequest()
    ↓
Balance.pending += days
Balance.available recalculated
```

### 3. Leave Approval Flow
```
Manager approves leave
    ↓
LeaveApproved event fired
    ↓
UpdateBalanceOnLeaveApproval listener
    ↓
LeaveBalanceService->handleLeaveApproval()
    ↓
Balance.pending -= days
Balance.used += days
Balance.available recalculated
```

### 4. Monthly Accrual (Automated)
```
CRON runs on 1st of month
    ↓
leave:process-monthly-accrual command
    ↓
LeaveBalanceService->processMonthlyAccrual()
    ↓
For each leave type with accrual_type='monthly':
    monthlyAccrual = annual_quota / 12
    Balance.allocated += monthlyAccrual
    Balance.available recalculated
```

### 5. Year-End Carry Forward (Automated)
```
CRON runs on Jan 1st
    ↓
leave:process-carry-forward command
    ↓
LeaveBalanceService->processCarryForward(2024, 2025)
    ↓
For each leave type with carry_forward_allowed=true:
    availableToCarry = min(balance.available, max_carry_forward_days)
    Create/update 2025 balance with:
        allocated = annual_quota
        carried_forward = availableToCarry
```

## Testing Commands

### Initialize balances for all users
```bash
php artisan tinker
>>> app(App\Services\Leave\LeaveBalanceService::class)->initializeBalancesForAllUsers(2025);
```

### Test monthly accrual
```bash
php artisan leave:process-monthly-accrual
```

### Test carry forward
```bash
php artisan leave:process-carry-forward --from-year=2024 --to-year=2025
```

### Check user balance
```bash
php artisan tinker
>>> $service = app(App\Services\Leave\LeaveBalanceService::class);
>>> $user = User::find(1);
>>> $balances = $service->getAllBalances($user, 2025);
>>> $balances->toArray();
```

## Integration Points

### In Leave Controllers
```php
use App\Services\Leave\LeaveBalanceService;

public function store(Request $request, LeaveBalanceService $balanceService)
{
    // Validate balance before creating leave
    $hasSufficient = $balanceService->hasSufficientBalance(
        auth()->user(),
        $request->leave_setting_id,
        $request->no_of_days
    );

    if (!$hasSufficient) {
        return back()->withErrors(['leave' => 'Insufficient leave balance']);
    }

    $leave = Leave::create($request->all());
    
    // Fire event to update balance
    event(new LeaveRequested($leave));
}

public function approve(Leave $leave)
{
    $leave->update(['status' => 'Approved', 'approved_at' => now()]);
    
    // Fire event to update balance
    event(new LeaveApproved($leave));
}
```

### In Leave Request Form (Frontend)
```jsx
// Fetch balance before showing form
const { data: balances } = useFetch('/api/leave-balances');

// Show balance widget
<LeaveBalanceWidget balances={balances} />

// Validate on submit
if (formData.days > balance.available) {
    setError('Insufficient balance');
}
```

## Benefits

✅ **Automated:** Accrual and carry-forward run automatically
✅ **Event-Driven:** Balance updates happen automatically when leave status changes
✅ **Queued:** All balance updates run in queue (won't block requests)
✅ **Accurate:** Real-time balance calculation prevents over-allocation
✅ **Auditable:** All changes logged, can track balance history
✅ **Flexible:** Supports monthly accrual, carry-forward limits, encashment
✅ **Tenant-Safe:** Works within multi-tenant architecture

## Next Steps

1. ✅ Backend complete
2. ⏳ Create leave balance widget component (Frontend)
3. ⏳ Integrate balance check in leave request form
4. ⏳ Add balance history view
5. ⏳ Create manager dashboard showing team balances
6. ⏳ Write comprehensive tests

## Files Modified/Created

### Created (13 files)
- `app/Models/HRM/LeaveBalance.php`
- `app/Services/Leave/LeaveBalanceService.php`
- `app/Console/Commands/Leave/ProcessMonthlyAccrual.php`
- `app/Console/Commands/Leave/ProcessYearlyCarryForward.php`
- `app/Events/Leave/LeaveRequested.php`
- `app/Events/Leave/LeaveApproved.php`
- `app/Events/Leave/LeaveRejected.php`
- `app/Events/Leave/LeaveCancelled.php`
- `app/Listeners/Leave/UpdateBalanceOnLeaveRequest.php`
- `app/Listeners/Leave/UpdateBalanceOnLeaveApproval.php`
- `app/Listeners/Leave/UpdateBalanceOnLeaveRejection.php`
- `app/Listeners/Leave/UpdateBalanceOnLeaveCancellation.php`
- `docs/leave-balance-system-implementation.md` (this file)

### Modified (4 files)
- `database/migrations/tenant/2025_12_02_121546_create_hrm_core_tables.php` - Updated leave_balances & leave_settings tables
- `app/Models/HRM/LeaveSetting.php` - Added new fields and balances relationship
- `app/Providers/EventServiceProvider.php` - Registered leave events/listeners
- `app/Console/Kernel.php` - Updated scheduler commands

---

**Status:** ✅ Complete and ready for testing
**Date:** December 2, 2025
