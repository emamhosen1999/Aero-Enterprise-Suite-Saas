# Platform Package - Tenancy Features Gap Analysis

> **Analysis Date:** December 21, 2025  
> **Purpose:** Identify missing features for robust tenancy management

---

## Executive Summary

The **aero-platform** package provides a solid foundation for multi-tenant SaaS management. However, several features are missing that are essential for a **production-ready, enterprise-grade** tenancy management system.

### Current State: ✅ What's Complete

| Category | Features |
|----------|----------|
| **Tenant Lifecycle** | Create, Provision (async), Activate, Suspend, Archive, Delete |
| **Database Isolation** | stancl/tenancy with TenantWithDatabase contract |
| **Domain Management** | Subdomain + Custom domains with verification |
| **Billing** | Stripe integration via Laravel Cashier, SSLCommerz webhook |
| **Subscription** | Plans, trial periods, grace periods, module gating |
| **Access Control** | Module-based RBAC, role-module mappings |
| **Impersonation** | Admin can impersonate tenant users |
| **Provisioning** | Async queue-based DB creation & migration |
| **Error Logging** | Tenant-scoped error tracking |
| **Rate Limiting** | Login & registration rate limiting |

---

## 🔴 CRITICAL GAPS - Missing Features

### 1. Tenant Database Backup & Restore

**Status:** ❌ NOT IMPLEMENTED

**Why Critical:** Tenants expect data safety. Platform needs disaster recovery.

**Required Components:**
| Component | Description |
|-----------|-------------|
| `BackupTenantDatabase` Job | Queue job to create mysqldump/pg_dump |
| `RestoreTenantDatabase` Job | Queue job to restore from backup |
| `TenantBackup` Model | Track backup history, size, status |
| `ScheduledBackupCommand` | Artisan command for scheduled backups |
| `BackupController` | Admin API for manual backup/restore |
| Storage Integration | S3/local for backup files |

**Suggested Implementation:**
```php
// Job: BackupTenantDatabase
class BackupTenantDatabase implements ShouldQueue
{
    public function __construct(
        public Tenant $tenant,
        public string $reason = 'scheduled'
    ) {}
    
    public function handle(): void
    {
        tenancy()->initialize($tenant);
        $dbName = $tenant->tenancy_db_name;
        $filename = "{$tenant->id}_{now()->format('Y-m-d_His')}.sql.gz";
        
        // Create backup
        $this->createMySQLBackup($dbName, $filename);
        
        // Store to S3
        Storage::disk('backups')->put("tenants/{$tenant->id}/{$filename}", ...);
        
        // Log backup
        TenantBackup::create([...]);
    }
}
```

---

### 2. Tenant Data Export (GDPR Compliance)

**Status:** ❌ NOT IMPLEMENTED

**Why Critical:** GDPR Article 20 - Data Portability. Users have the right to download their data.

**Required Components:**
| Component | Description |
|-----------|-------------|
| `ExportTenantData` Job | Queue job to compile all tenant data |
| `TenantDataExport` Model | Track export requests & status |
| `ExportController` | API for requesting/downloading exports |
| Export Formats | JSON, CSV, XML options |
| Notification | Email when export is ready |

---

### 3. Tenant Clone/Duplicate

**Status:** ❌ NOT IMPLEMENTED

**Why Critical:** Testing, staging environments, template tenants.

**Required Components:**
| Component | Description |
|-----------|-------------|
| `CloneTenant` Job | Copy database + files to new tenant |
| Clone Configuration | What to include/exclude |
| Data Anonymization | Option to anonymize PII during clone |

---

### 4. Trial Expiration Notifications

**Status:** ⚠️ PARTIAL (model methods exist, no notifications)

**Missing:**
| Component | Description |
|-----------|-------------|
| `TrialExpiringNotification` | Email sent 3, 7 days before trial ends |
| `TrialExpiredNotification` | Email when trial ends |
| `CheckTrialExpiration` Command | Scheduled job to send notifications |
| In-App Warning Banner | Frontend component for trial warning |

---

### 5. Subscription Lifecycle Notifications

**Status:** ⚠️ PARTIAL (webhook handlers exist, no tenant notifications)

**Missing:**
| Event | Notification |
|-------|--------------|
| Payment Failed | Email to tenant owner |
| Subscription Cancelled | Confirmation email |
| Subscription Upgraded | Thank you email |
| Subscription Downgraded | Feature changes notice |
| Invoice Created | Invoice email |
| Grace Period Ending | Warning before suspension |

---

### 6. Resource Quotas & Usage Tracking

**Status:** ⚠️ PARTIAL (UsageRecord model exists, no enforcement)

**Missing:**
| Feature | Description |
|---------|-------------|
| `StorageQuota` per plan | Max storage per plan tier |
| `UserLimit` per plan | Max users per plan tier |
| `ApiRequestLimit` | Rate limiting per tenant |
| Quota Enforcement Middleware | Block when limits exceeded |
| Usage Dashboard | Show current usage vs limits |
| Overage Alerts | Notify when approaching limits |

**Current `UsageRecord` model exists but needs:**
```php
// Missing: Quota configuration per plan
'plan_limits' => [
    'storage_gb' => 10,
    'users' => 25,
    'api_calls_monthly' => 100000,
    'email_sends_monthly' => 1000,
]
```

---

### 7. Tenant Audit Log (Compliance)

**Status:** ⚠️ PARTIAL (platform has logs, tenants need their own)

**Missing:**
| Feature | Description |
|---------|-------------|
| `TenantAuditLog` Model | Per-tenant activity tracking |
| Audit Trail Export | For compliance reports |
| Data Retention Policy | Auto-purge after X days |
| Search & Filter | Admin can search audit logs |

---

### 8. Scheduled Tenant Maintenance

**Status:** ❌ NOT IMPLEMENTED

**Why Needed:** Run maintenance tasks per-tenant on schedule.

**Required:**
| Component | Description |
|-----------|-------------|
| `RunTenantMaintenance` Command | Execute maintenance per tenant |
| Maintenance Tasks | Cache clear, temp cleanup, etc. |
| Staggered Execution | Don't overload server |

---

### 9. Tenant Health Checks

**Status:** ⚠️ PARTIAL (TenantHealth command exists)

**Missing:**
| Feature | Description |
|---------|-------------|
| Database Connectivity Check | Verify tenant DB is accessible |
| Storage Connectivity Check | Verify files accessible |
| Last Activity Tracking | Detect dormant tenants |
| Health Score Dashboard | Visual health overview |

---

### 10. White-Label/Branding Per Tenant

**Status:** ❌ NOT IMPLEMENTED

**Why Needed:** Enterprise tenants want their own branding.

**Required:**
| Feature | Description |
|---------|-------------|
| `TenantBranding` Model | Store logo, colors, name |
| Branding Settings UI | Tenant admin can customize |
| Dynamic Theme Loading | Apply branding at runtime |
| Custom Email Templates | Use tenant's branding in emails |

---

## 🟡 RECOMMENDED ENHANCEMENTS

### 11. Multi-Region Support

**Status:** ❌ NOT IMPLEMENTED

**For Scale:**
- Database server per region
- CDN configuration per tenant
- Data residency compliance (GDPR)

---

### 12. Feature Flags Per Tenant

**Status:** ❌ NOT IMPLEMENTED

**Required:**
| Feature | Description |
|---------|-------------|
| `TenantFeatureFlag` Model | Enable/disable features per tenant |
| A/B Testing | Gradual feature rollout |
| Beta Features | Opt-in for early access |

---

### 13. Tenant Communication Center

**Status:** ⚠️ PARTIAL (broadcast exists in routes)

**Missing:**
| Feature | Description |
|---------|-------------|
| Platform Announcements | Show to all tenants |
| Targeted Messages | Message specific tenant segments |
| In-App Message Center | Tenant sees messages in UI |
| Read Receipts | Track who saw announcements |

---

### 14. SLA Monitoring Per Tenant

**Status:** ❌ NOT IMPLEMENTED

**Required:**
| Feature | Description |
|---------|-------------|
| Uptime Tracking | Per-tenant availability |
| Performance Metrics | Response times per tenant |
| SLA Breach Alerts | Notify if SLA violated |

---

### 15. Tenant Self-Service Portal

**Status:** ⚠️ PARTIAL (billing exists)

**Missing:**
| Feature | Description |
|---------|-------------|
| Download Invoices | PDF invoice download |
| Update Billing Info | Self-service card update |
| View Usage | See current consumption |
| Request Data Export | GDPR self-service |
| Close Account | Self-service cancellation |

---

## Implementation Priority Matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 🔴 P0 | Tenant Database Backup | Medium | Critical |
| 🔴 P0 | Tenant Data Export (GDPR) | Medium | Critical |
| 🔴 P0 | Trial Expiration Notifications | Low | High |
| 🟠 P1 | Subscription Lifecycle Notifications | Low | High |
| 🟠 P1 | Resource Quotas Enforcement | Medium | High |
| 🟠 P1 | Tenant Audit Log | Medium | High |
| 🟡 P2 | Tenant Clone | Medium | Medium |
| 🟡 P2 | White-Label Branding | High | Medium |
| 🟡 P2 | Feature Flags | Medium | Medium |
| 🟢 P3 | Multi-Region Support | High | Low (for now) |
| 🟢 P3 | SLA Monitoring | High | Medium |

---

## Quick Win Implementations

### 1. Trial Expiration Notifications (Low Effort)

Create these files:
```
packages/aero-platform/
├── src/
│   ├── Console/Commands/
│   │   └── CheckTrialExpirations.php
│   ├── Mail/
│   │   └── Tenant/
│   │       ├── TrialExpiringMail.php
│   │       └── TrialExpiredMail.php
│   └── Notifications/
│       ├── TrialExpiringNotification.php
│       └── TrialExpiredNotification.php
```

### 2. Subscription Lifecycle Emails (Low Effort)

Create notification classes:
```
src/Notifications/
├── PaymentFailedNotification.php
├── SubscriptionCancelledNotification.php
├── SubscriptionUpgradedNotification.php
├── InvoiceCreatedNotification.php
└── GracePeriodEndingNotification.php
```

Update `StripeWebhookController` to dispatch notifications.

### 3. Resource Quota Checks (Medium Effort)

Add to `Plan` model:
```php
protected $casts = [
    'limits' => 'array',  // ['users' => 25, 'storage_gb' => 10]
];

public function getLimit(string $resource): ?int
{
    return $this->limits[$resource] ?? null;
}
```

Create middleware:
```php
class EnforceQuota
{
    public function handle($request, $next, $resource)
    {
        $tenant = tenant();
        $limit = $tenant->plan->getLimit($resource);
        $current = $this->getCurrentUsage($tenant, $resource);
        
        if ($current >= $limit) {
            return response()->json(['error' => 'Quota exceeded'], 403);
        }
        
        return $next($request);
    }
}
```

---

## Summary

### ✅ Platform Strengths
- Solid multi-tenant architecture with stancl/tenancy
- Proper database isolation per tenant
- Complete billing integration with Stripe
- Module-based RBAC with granular permissions
- Async provisioning with queue jobs

### ❌ Critical Gaps to Address
1. **No backup/restore capability** - Essential for disaster recovery
2. **No GDPR data export** - Legal compliance requirement
3. **No tenant notifications** - Trial/subscription lifecycle emails
4. **No quota enforcement** - Usage limits not enforced
5. **No tenant-level audit** - Compliance logging needed

### Recommendation

Focus on **P0 items** first:
1. Implement tenant database backup system
2. Add GDPR data export capability
3. Build trial/subscription notification system

These are relatively low-medium effort with critical impact on platform maturity.

---

*Analysis based on codebase inspection of packages/aero-platform/*
