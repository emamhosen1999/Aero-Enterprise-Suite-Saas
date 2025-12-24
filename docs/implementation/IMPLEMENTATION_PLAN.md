# Implementation Plan - Tenant Management System Enhancement

**Date:** December 24, 2025  
**Status:** Ready for Development  
**Based on:** Stakeholder feedback from PR review

---

## Stakeholder Decisions

**Confirmed Requirements:**
1. ✅ **Phase Priority:** Phase 1 (UI-first approach)
2. ✅ **Revenue Analytics:** YES - Required immediately (include in Phase 1)
3. ✅ **Quota Enforcement:** Warn for 10 days, then block (configurable in UI)
4. ✅ **Notification Channels:** Email + SMS
5. ✅ **Retention Offers:** YES - Include in cancellation flow
6. ✅ **Custom Enterprise Plans:** YES - Full support needed
7. ✅ **Multi-Currency:** YES - Support multiple currencies

---

## Revised Implementation Plan

### Phase 1: Core Management UI + Analytics (3 weeks)

**Week 1: Quota Management**
- [ ] Admin Quota Monitoring Dashboard
  - Real-time tenant usage table with filters
  - Stats cards (healthy, warning, critical, over limit)
  - Export to CSV functionality
  - Drill-down to tenant details
- [ ] Tenant Quota Widget (Dashboard)
  - Collapsible widget with progress bars
  - Color-coded alerts (green/yellow/red)
  - "Upgrade Plan" CTA
- [ ] Configurable Quota Enforcement
  - UI for setting warning period (default: 10 days)
  - Grace period before blocking
  - Email/SMS notifications during warning period

**Week 2: Subscription Management**
- [ ] Enhanced Plan Creation Form
  - Multi-currency support (USD, EUR, GBP, etc.)
  - Custom enterprise plan builder
  - Stripe integration fields
  - Module selection with limits
- [ ] Plan Comparison Modal
  - Side-by-side comparison
  - Proration calculation preview
  - Feature diff highlighting
- [ ] Upgrade/Downgrade Wizards
  - Impact preview (features gained/lost)
  - Proration handling
  - Immediate vs scheduled change
- [ ] 3-Step Cancellation Flow
  - Reason capture
  - Retention offers (25% discount, pause options)
  - Data export reminders
  - Confirmation with impact preview

**Week 3: Revenue Analytics Dashboard**
- [ ] MRR (Monthly Recurring Revenue) tracking
- [ ] ARR (Annual Recurring Revenue) tracking
- [ ] Churn rate calculation
- [ ] Expansion revenue metrics
- [ ] Cohort analysis
- [ ] Revenue by plan tier
- [ ] Revenue by currency
- [ ] Top 10 revenue-generating tenants

### Phase 2: Automation & Notifications (2 weeks)

**Week 4: Usage Tracking Automation**
- [ ] API Call Tracking Middleware
- [ ] Resource Quota Observers
- [ ] Storage Monitoring Job
- [ ] Quota Warning System

**Week 5: Notification System**
- [ ] Email Templates
- [ ] SMS Notifications (via Twilio/SNS)
- [ ] Notification Preferences
- [ ] Admin Alert Dashboard

### Phase 3: Advanced Features (2 weeks)

**Week 6: Tenant Health & Predictive Analytics**
- [ ] Tenant Health Score
- [ ] At-Risk Tenant Identification
- [ ] Proactive Intervention Workflows

**Week 7: Custom Enterprise Plans & Multi-Currency**
- [ ] Enterprise Plan Builder
- [ ] Multi-Currency Support
- [ ] Currency Conversion Dashboard

---

## Technical Implementation Details

### 1. Configurable Quota Enforcement

**Database Schema Addition:**
```sql
CREATE TABLE IF NOT EXISTS quota_enforcement_settings (
    id UUID PRIMARY KEY,
    quota_type VARCHAR(50) NOT NULL,
    warning_threshold_percentage INT DEFAULT 80,
    critical_threshold_percentage INT DEFAULT 90,
    block_threshold_percentage INT DEFAULT 100,
    warning_period_days INT DEFAULT 10,
    send_email BOOLEAN DEFAULT TRUE,
    send_sms BOOLEAN DEFAULT FALSE,
    block_on_exceed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### 2. Multi-Currency Support

**Migrations:**
- Add `currency` fields to plans, tenants, subscriptions
- Create `exchange_rates` table
- Add `regional_pricing` JSON field to plans

**CurrencyService:**
- Exchange rate fetching from external API
- Conversion to base currency (USD)
- Regional pricing calculator

### 3. Revenue Analytics Queries

**Services to implement:**
- `RevenueAnalyticsService::getMRR()`
- `RevenueAnalyticsService::getARR()`
- `RevenueAnalyticsService::getChurnRate()`
- `RevenueAnalyticsService::getRevenueByPlan()`
- `RevenueAnalyticsService::getRevenueByCurrency()`

### 4. SMS Notification Integration

**TwilioService:**
- SMS sending via Twilio API
- Notification logging
- Delivery status tracking

---

## API Endpoints to Implement

### Quota Management (15 endpoints)
```
GET    /api/v1/quotas/tenants
GET    /api/v1/quotas/tenants/{tenant}
POST   /api/v1/quotas/tenants/{tenant}/custom
GET    /api/v1/quotas/settings
PUT    /api/v1/quotas/settings
GET    /api/v1/quotas/warnings/{tenant}
POST   /api/v1/quotas/warnings/{tenant}/dismiss
```

### Revenue Analytics (7 endpoints)
```
GET    /api/v1/analytics/revenue/mrr
GET    /api/v1/analytics/revenue/arr
GET    /api/v1/analytics/revenue/churn
GET    /api/v1/analytics/revenue/by-plan
GET    /api/v1/analytics/revenue/by-currency
GET    /api/v1/analytics/revenue/cohorts
GET    /api/v1/analytics/revenue/trends
```

### Currency Management (6 endpoints)
```
GET    /api/v1/currencies
GET    /api/v1/exchange-rates
POST   /api/v1/exchange-rates
POST   /api/v1/exchange-rates/sync
GET    /api/v1/plans/{plan}/regional-pricing
PUT    /api/v1/plans/{plan}/regional-pricing
```

### Notifications (4 endpoints)
```
GET    /api/v1/notifications/preferences
PUT    /api/v1/notifications/preferences
GET    /api/v1/notifications/history
POST   /api/v1/notifications/test
```

---

## Frontend Components to Create

### Phase 1 (20+ components)

**Admin Pages:**
```
packages/aero-ui/resources/js/Pages/Platform/Admin/
├── Quotas/
│   ├── Index.jsx                    # Quota monitoring dashboard
│   ├── TenantDetails.jsx            # Single tenant quota view
│   ├── Settings.jsx                 # Enforcement settings UI
│   └── WarningHistory.jsx           # Warning log
│
├── Analytics/
│   ├── Revenue.jsx                  # Revenue analytics dashboard
│   ├── RevenueCharts.jsx            # MRR/ARR/Churn charts
│   ├── RevenueByCurrency.jsx        # Multi-currency breakdown
│   └── CohortAnalysis.jsx           # Cohort revenue analysis
│
├── Plans/
│   ├── Create.jsx (ENHANCE)         # Full plan creation form
│   ├── CreateEnterprise.jsx (NEW)   # Enterprise plan builder
│   ├── RegionalPricing.jsx (NEW)    # Multi-currency pricing
│   └── Compare.jsx (NEW)            # Plan comparison modal
│
└── Subscriptions/
    ├── UpgradeWizard.jsx (NEW)      # Upgrade flow
    ├── DowngradeWizard.jsx (NEW)    # Downgrade flow
    └── CancellationFlow.jsx (NEW)   # 3-step cancellation
```

**Tenant Pages:**
```
packages/aero-ui/resources/js/Pages/Tenant/Billing/
├── QuotaWidget.jsx (NEW)            # Dashboard widget
├── QuotaDetails.jsx (NEW)           # Full quota view
├── UpgradePlan.jsx (NEW)            # Self-service upgrade
└── NotificationSettings.jsx (NEW)   # Email/SMS preferences
```

---

## Scheduled Jobs (8 jobs)

```php
// Hourly
- MonitorStorageUsage::class
- SyncStripeUsage::class

// Daily
- CheckQuotaLimits::class (09:00)
- SendTrialExpiryReminders::class (10:00)
- ProcessFailedPayments::class (11:00)
- CalculateRevenueMetrics::class (01:00)

// Weekly
- GenerateUsageReports::class (Mondays 08:00)
- SyncExchangeRates::class (Mondays 00:00)

// Monthly
- GenerateMonthlyRevenueReport::class (1st, 02:00)
```

---

## Configuration Files

**config/quota.php:**
```php
return [
    'default_warning_period_days' => env('QUOTA_WARNING_PERIOD', 10),
    'default_thresholds' => [
        'warning' => 80,
        'critical' => 90,
        'block' => 100,
    ],
    'notifications' => [
        'email' => env('QUOTA_EMAIL_NOTIFICATIONS', true),
        'sms' => env('QUOTA_SMS_NOTIFICATIONS', false),
    ],
];
```

**config/currencies.php:**
```php
return [
    'base' => env('BASE_CURRENCY', 'USD'),
    'supported' => [
        'USD' => ['symbol' => '$', 'name' => 'US Dollar'],
        'EUR' => ['symbol' => '€', 'name' => 'Euro'],
        'GBP' => ['symbol' => '£', 'name' => 'British Pound'],
        'CAD' => ['symbol' => 'C$', 'name' => 'Canadian Dollar'],
        'AUD' => ['symbol' => 'A$', 'name' => 'Australian Dollar'],
        'JPY' => ['symbol' => '¥', 'name' => 'Japanese Yen'],
    ],
    'exchange_rate_api' => env('EXCHANGE_RATE_API_KEY'),
];
```

---

## Questions for Stakeholders (15 questions)

### Priority & Scope
1. **SMS Provider:** Should we use Twilio, AWS SNS, or another provider?
2. **Exchange Rate API:** Should we use a paid API (e.g., exchangerate-api.com) or manual updates?
3. **Revenue Currency:** Should all revenue reports default to USD, or allow admin to choose base currency?

### Quota Enforcement Details
4. **Warning Escalation:** Should warnings increase in frequency as quota approaches 100%? (e.g., daily at 95%, hourly at 99%)
5. **Grace Period Per Quota:** Should different quotas have different grace periods? (e.g., 10 days for storage, 3 days for users)
6. **Soft vs Hard Limits:** For API calls, should we throttle (slow down) or hard block at 100%?

### Custom Enterprise Plans
7. **Approval Workflow:** Should custom plans require admin approval before activation?
8. **Minimum Contract:** What's the minimum contract length for enterprise plans? (1 year, 3 years?)
9. **Volume Discounts:** Should we support tiered pricing? (e.g., 20% off if >100 users)

### Multi-Currency
10. **Regional Pricing Strategy:** Should prices be exact conversions, or rounded (e.g., $99 USD = €89 EUR)?
11. **Tax Handling:** Should we calculate VAT/GST automatically based on tenant location?
12. **Currency Changes:** Can tenants change their currency, or is it locked at signup?

### Notifications
13. **Branding:** Should notification emails/SMS be fully white-labeled per tenant, or use platform branding?
14. **Localization:** Should notifications be in the tenant's preferred language?
15. **Admin Alerts:** Which admin users should receive critical alerts? (Super admin only, or all with certain role?)

---

## Success Metrics

### Phase 1 (Week 1-3)
- [ ] Quota dashboard loads in <2s with 1000+ tenants
- [ ] Revenue analytics display MRR/ARR with 99.9% accuracy
- [ ] Plan upgrade conversion rate >15%
- [ ] Cancellation retention rate >30% (with offers)

### Phase 2 (Week 4-5)
- [ ] Quota warnings sent within 1 hour of threshold breach
- [ ] SMS delivery success rate >95%
- [ ] Zero accidental service interruptions (proper grace periods)

### Phase 3 (Week 6-7)
- [ ] Custom enterprise plan creation in <10 minutes
- [ ] Multi-currency revenue reports accurate within 0.1%
- [ ] Tenant health score predicts churn with >70% accuracy

---

**Status:** Ready for Development Sprint Planning  
**Next Steps:**
1. Review and answer the 15 questions above
2. Assign developers to Phase 1 tasks
3. Set up sprint tracking (Jira/Linear)
4. Begin Week 1 development

**Last Updated:** December 24, 2025
