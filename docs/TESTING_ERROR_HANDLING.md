# Testing the Unified Error Handling System

## Quick Test Commands

### 1. Test Frontend Error Boundary (Browser Console)

Visit any page in the application and run in browser console:

```javascript
// Test context detection
const hostname = window.location.hostname;
const dotCount = hostname.split('.').length - 1;
console.log('Domain:', hostname);
console.log('Dot count:', dotCount);
console.log('Context type:', 
  hostname.startsWith('admin.') || dotCount <= 1 ? 'platform' :
  dotCount === 2 ? 'tenant' : 'standalone'
);
```

### 2. Trigger a Test Frontend Error

Create a test component that throws an error:

```javascript
// In any React page, add:
const TestError = () => {
  throw new Error('Test error - verifying unified error handling');
  return <div>This won't render</div>;
};

// Then use it:
<TestError />
```

**Expected Result:**
- Error boundary catches the error
- Context-aware message displayed based on domain:
  - **Platform**: "Error logged and team notified"
  - **Tenant**: "Platform has been informed"
  - **Standalone**: "Error reported for analysis"
- Trace ID shown in green success card
- Console shows: `Error reported to platform [type]: <uuid>`

---

### 3. Test Backend Exception Reporting

Add to any controller method:

```php
// Test exception
throw new \Exception('Test backend error - verifying platform reporting');
```

**Expected Result:**
- Exception caught by custom handler
- Reported to platform via PlatformErrorReporter
- Laravel log shows: "Exception reported to platform" with trace_id
- If SaaS mode: Direct entry in central.error_logs table
- If standalone: HTTP POST to platform API

---

### 4. Verify in Database

**SaaS Mode:**
```sql
-- Check latest error logs
SELECT 
    trace_id,
    source_domain,
    origin,
    error_type,
    error_message,
    created_at
FROM error_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check context field
SELECT 
    trace_id,
    JSON_EXTRACT(context, '$.installation_type') as installation_type,
    JSON_EXTRACT(context, '$.browser.name') as browser,
    created_at
FROM error_logs
WHERE origin = 'frontend'
ORDER BY created_at DESC
LIMIT 5;
```

---

### 5. Test API Endpoint Directly

```bash
# Test error log submission (simulate frontend error)
curl -X POST http://aeos365.test/api/error-log \
  -H "Content-Type: application/json" \
  -H "X-CSRF-TOKEN: <token>" \
  -d '{
    "trace_id": "test-' $(uuidgen) '",
    "origin": "frontend",
    "error_type": "TestError",
    "http_code": 0,
    "message": "Manual test error",
    "url": "http://aeos365.test/test",
    "module": "test",
    "context": {
      "installation_type": "platform",
      "test": true
    }
  }'

# Expected response:
# {"success":true,"trace_id":"<uuid>","message":"Error reported successfully"}
```

---

### 6. Check Admin Dashboard

1. Navigate to: `http://admin.aeos365.test/admin/error-logs`
2. Verify:
   - ✅ Test errors appear in list
   - ✅ Can filter by origin (frontend/backend)
   - ✅ Can view details with stack trace
   - ✅ Trace ID is displayed
   - ✅ Source domain is tracked
   - ✅ Context information is preserved

---

### 7. Test Context Messages on Different Domains

**Test on Platform Domain (aeos365.test):**
```
Expected message: "Error logged and team notified"
Expected description: "Your platform admin team can review this error..."
Context type: "platform"
```

**Test on Admin Domain (admin.aeos365.test):**
```
Expected message: "Error logged and team notified"
Expected description: "Your platform admin team can review this error..."
Context type: "platform"
```

**Test on Tenant Domain (tenant1.aeos365.test):**
```
Expected message: "Platform has been informed"
Expected description: "The Aero platform team has received this error report..."
Context type: "tenant"
```

---

### 8. Verify Error Payload Structure

Check browser Network tab → `/api/error-log` request:

```json
{
  "trace_id": "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx",
  "origin": "frontend",
  "error_type": "ReactError",
  "http_code": 0,
  "message": "Test error message",
  "stack": "Error: Test error message\n    at ...",
  "component_stack": "\n    at ErrorBoundary\n    at App",
  "url": "http://tenant1.aeos365.test/dashboard",
  "referrer": "http://tenant1.aeos365.test/login",
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "module": "dashboard",
  "component": "Dashboard",
  "context": {
    "installation_type": "tenant",
    "source_domain": "tenant1.aeos365.test",
    "user_agent": "Mozilla/5.0...",
    "browser": {
      "name": "Chrome",
      "version": "120.0",
      "platform": "Win32"
    },
    "timestamp": "2024-01-15T10:30:45.123Z"
  }
}
```

---

### 9. Test Error Resolution Workflow

```bash
# Mark error as resolved via API
curl -X POST http://admin.aeos365.test/api/platform/error-logs/1/resolve \
  -H "Authorization: Bearer <token>" \
  -d '{"notes": "Fixed by updating component logic"}'

# Expected response:
# {"success":true,"message":"Error marked as resolved","error_log":{...}}
```

---

### 10. Performance Check

```bash
# Check error reporting doesn't slow down app
time curl http://aeos365.test/dashboard

# With error reporting enabled
# Expected: < 500ms difference

# Verify async reporting works (errors reported in background)
# Check queue jobs if using async mode:
php artisan queue:work --once
```

---

## Expected Test Results Summary

✅ **Frontend errors**:
- Caught by ErrorBoundary
- Context-aware message displayed
- Trace ID visible
- Logged to platform

✅ **Backend errors**:
- Caught by custom Handler
- Reported via PlatformErrorReporter
- Logged locally with trace ID
- Sent to platform

✅ **Context detection**:
- Correct for platform domain
- Correct for tenant subdomain
- Correct for standalone (if tested)

✅ **Database entries**:
- All fields populated correctly
- Context field contains metadata
- Source domain tracked
- Origin (frontend/backend) recorded

✅ **Admin dashboard**:
- Errors visible and filterable
- Details viewable
- Resolution workflow works
- Statistics calculated

---

## Troubleshooting

### Error not appearing in dashboard?
1. Check `error_logs` table in central database
2. Verify `AERO_ERROR_REPORTING=true` in .env
3. Check Laravel logs for "Failed to report exception"
4. Verify routes are loaded: `php artisan route:list | grep error-log`

### Context showing wrong type?
1. Check browser console for detected context
2. Verify domain pattern matches expected format
3. Review `detectContext()` logic in ErrorBoundary.jsx

### Trace ID not shown in UI?
1. Check browser Network tab for `/api/error-log` response
2. Verify response contains `trace_id`
3. Check ErrorBoundary state updates correctly

### Backend errors not logging?
1. Verify Handler is registered: Check AeroCoreServiceProvider
2. Check PlatformErrorReporter is enabled
3. Review Laravel logs for exception handler errors
4. Verify `AERO_LICENSE_KEY` is set (for standalone mode)

---

## Production Checklist

Before going live:

- [ ] `AERO_ERROR_REPORTING=true` in production .env
- [ ] `AERO_LICENSE_KEY` set for standalone installations
- [ ] `AERO_ERROR_REPORTING_ASYNC=true` for performance
- [ ] `AERO_ERROR_REPORTING_LEVEL=all` or `server_only` as needed
- [ ] Queue worker running (`php artisan queue:work`)
- [ ] Admin dashboard accessible at admin subdomain
- [ ] Error cleanup cron job configured
- [ ] Alert notifications configured for critical errors
- [ ] Test all three contexts (platform, tenant, standalone)
- [ ] Verify sensitive data redaction works
- [ ] Check error log retention policy

---

## Monitoring & Alerts

**Set up alerts for:**
1. Error rate spike (> 100 errors/hour)
2. Unresolved errors > 24 hours old
3. Critical errors (HTTP 500+)
4. Errors from specific domains
5. Repeated errors (same signature)

**Regular reviews:**
- Weekly: Top error types
- Monthly: Error trends by domain
- Quarterly: Resolution times and patterns
