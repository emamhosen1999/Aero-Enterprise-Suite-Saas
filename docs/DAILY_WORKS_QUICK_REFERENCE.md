# Daily Works Module - Quick Reference Card

## Status Enum Values
```php
use App\Models\DailyWork;

// Using constants (recommended)
$work->status = DailyWork::STATUS_NEW;
$work->status = DailyWork::STATUS_IN_PROGRESS;
$work->status = DailyWork::STATUS_COMPLETED;
$work->status = DailyWork::STATUS_REJECTED;
$work->status = DailyWork::STATUS_RESUBMISSION;
$work->status = DailyWork::STATUS_PENDING;

// Validation
if (DailyWork::isValidStatus($status)) {
    // Status is valid
}
```

## Inspection Result Enum Values
```php
use App\Models\DailyWork;

// Using constants (recommended)
$work->inspection_result = DailyWork::INSPECTION_PASS;
$work->inspection_result = DailyWork::INSPECTION_FAIL;
$work->inspection_result = DailyWork::INSPECTION_CONDITIONAL;
$work->inspection_result = DailyWork::INSPECTION_PENDING;
$work->inspection_result = DailyWork::INSPECTION_APPROVED;
$work->inspection_result = DailyWork::INSPECTION_REJECTED;

// Validation
if (DailyWork::isValidInspectionResult($result)) {
    // Result is valid
}
```

## Common Queries

### With Soft Deletes
```php
// Include soft deleted
DailyWork::withTrashed()->get();

// Only soft deleted
DailyWork::onlyTrashed()->get();

// Restore soft deleted
$work->restore();

// Force delete (permanent)
$work->forceDelete();
```

### Using Scopes
```php
// Completed works
DailyWork::completed()->get();

// Pending works
DailyWork::pending()->get();

// With RFI submission
DailyWork::withRFI()->get();

// Resubmissions
DailyWork::resubmissions()->get();

// By type
DailyWork::byType('Structure')->get();

// By incharge
DailyWork::byIncharge($userId)->get();

// By date range
DailyWork::byDateRange('2025-11-01', '2025-11-30')->get();

// By status
DailyWork::byStatus(DailyWork::STATUS_COMPLETED)->get();

// Combine scopes
DailyWork::completed()
    ->byType('Structure')
    ->byDateRange('2025-11-01', '2025-11-30')
    ->get();
```

### Activity Logs
```php
// Get all activities for a daily work
$activities = $work->activities;

// Get activities with details
foreach ($activities as $activity) {
    echo $activity->description; // "Daily work has been updated"
    echo $activity->causer->name; // User who made the change
    echo $activity->created_at; // When it happened
    print_r($activity->changes()); // What changed
}
```

## Performance Tips

### Use Eager Loading
```php
// Good - eager load relationships
$works = DailyWork::with(['inchargeUser', 'assignedUser', 'reports'])->get();

// Bad - N+1 queries
$works = DailyWork::all();
foreach ($works as $work) {
    echo $work->inchargeUser->name; // Triggers additional query
}
```

### Use Indexes
The following columns are indexed for performance:
- `status` + `date` (composite)
- `incharge` + `date` (composite)
- `assigned` + `status` (composite)
- `type` (single)
- `completion_time` (single)

Filter by these columns for optimal performance.

## Validation Examples

### Create Daily Work
```php
$validated = $request->validate([
    'date' => 'required|date',
    'number' => 'required|string|unique:daily_works,number',
    'status' => 'required|in:' . implode(',', DailyWork::$statuses),
    'inspection_result' => 'nullable|in:' . implode(',', DailyWork::$inspectionResults),
    'type' => 'required|string',
    'description' => 'required|string',
    'location' => 'required|string',
]);

$work = DailyWork::create($validated);
```

### Update Daily Work
```php
// Model will automatically validate on save
try {
    $work->status = 'invalid-status'; // Will throw exception
    $work->save();
} catch (\InvalidArgumentException $e) {
    // Handle validation error
}
```

## Common Patterns

### Check if Completed
```php
if ($work->is_completed) {
    // Work is completed
}
```

### Check if Has RFI Submission
```php
if ($work->has_rfi_submission) {
    // RFI has been submitted
}
```

### Check if Resubmission
```php
if ($work->is_resubmission) {
    // This is a resubmission
}
```

## Error Handling

### Duplicate RFI Number
```php
try {
    DailyWork::create(['number' => 'S2025-001', ...]);
} catch (\Illuminate\Database\QueryException $e) {
    if ($e->errorInfo[1] == 1062) { // Duplicate entry
        // Handle duplicate RFI number
    }
}
```

### Invalid Status
```php
try {
    $work->status = 'invalid';
    $work->save();
} catch (\InvalidArgumentException $e) {
    // Handle invalid status
    // $e->getMessage() contains valid options
}
```

### User Delete Restriction
```php
try {
    $user->delete();
} catch (\Illuminate\Database\QueryException $e) {
    if ($e->errorInfo[1] == 1451) { // Foreign key constraint
        // User has assigned daily works
        // Must reassign works before deleting user
    }
}
```

## Best Practices

1. **Always use constants** instead of hardcoded strings
2. **Use scopes** for common queries
3. **Eager load relationships** to avoid N+1 queries
4. **Use soft deletes** - don't force delete unless necessary
5. **Check activity logs** for debugging
6. **Validate before save** to catch errors early
7. **Use indexes** - filter by indexed columns when possible

## Migration Commands

```bash
# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Check migration status
php artisan migrate:status

# Fresh migration (caution: drops all tables)
php artisan migrate:fresh
```

## Useful Queries

### Find Works Needing Attention
```php
// Works pending for over 24 hours
$pending = DailyWork::where('status', DailyWork::STATUS_PENDING)
    ->where('created_at', '<', now()->subDay())
    ->get();

// Works with failed inspections
$failed = DailyWork::where('inspection_result', DailyWork::INSPECTION_FAIL)
    ->get();

// Works with multiple resubmissions
$multipleResubmissions = DailyWork::where('resubmission_count', '>', 2)
    ->get();
```

### Statistics
```php
// Completion rate by type
$completionRate = DailyWork::byType('Structure')
    ->selectRaw('
        COUNT(*) as total,
        SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as completed
    ', [DailyWork::STATUS_COMPLETED])
    ->first();

$rate = ($completionRate->completed / $completionRate->total) * 100;
```

## Quick Links
- Full API Documentation: `docs/API_DAILY_WORKS.md`
- Implementation Summary: `docs/DAILY_WORKS_IMPROVEMENTS_SUMMARY.md`
- Model: `app/Models/DailyWork.php`
- Controller: `app/Http/Controllers/DailyWorkController.php`
