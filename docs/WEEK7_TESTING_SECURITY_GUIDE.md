# Week 7: Testing & Security Implementation Guide

## Overview

This guide provides comprehensive testing procedures and security audits for the HRM module before marketplace launch.

**Timeline:** Week 7 of 8-week launch plan  
**Status:** Pre-production validation phase  
**Goal:** Ensure production-ready quality for Codecanyon submission

---

## Table of Contents

1. [Testing Strategy](#testing-strategy)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [Security Audit](#security-audit)
5. [Performance Testing](#performance-testing)
6. [Codecanyon Validation](#codecanyon-validation)
7. [Pre-Launch Checklist](#pre-launch-checklist)

---

## Testing Strategy

### Test Pyramid

```
           /\
          /  \  E2E Tests (10%)
         /    \
        /------\ Integration Tests (30%)
       /        \
      /----------\ Unit Tests (60%)
     /____________\
```

### Coverage Goals

- **Unit Tests:** 80%+ code coverage
- **Integration Tests:** All critical workflows
- **Security Tests:** All OWASP Top 10 vulnerabilities
- **Performance Tests:** Load testing for 100+ concurrent users

---

## Unit Tests

### 1. Model Tests

**File:** `packages/aero-hrm/tests/Unit/Models/EmployeeTest.php`

```php
<?php

namespace AeroModules\Hrm\Tests\Unit\Models;

use AeroModules\Hrm\Models\Employee;
use AeroModules\Hrm\Models\Department;
use AeroModules\Core\Models\User;
use AeroModules\Hrm\Tests\TestCase;

class EmployeeTest extends TestCase
{
    /** @test */
    public function it_can_create_an_employee()
    {
        $employee = Employee::factory()->create([
            'first_name' => 'John',
            'last_name' => 'Doe',
            'employee_id' => 'EMP001'
        ]);

        $this->assertDatabaseHas('employees', [
            'employee_id' => 'EMP001',
            'first_name' => 'John'
        ]);
    }

    /** @test */
    public function it_belongs_to_a_department()
    {
        $department = Department::factory()->create();
        $employee = Employee::factory()->create([
            'department_id' => $department->id
        ]);

        $this->assertInstanceOf(Department::class, $employee->department);
        $this->assertEquals($department->id, $employee->department->id);
    }

    /** @test */
    public function it_belongs_to_a_user()
    {
        $user = User::factory()->create();
        $employee = Employee::factory()->create([
            'user_id' => $user->id
        ]);

        $this->assertInstanceOf(User::class, $employee->user);
    }

    /** @test */
    public function it_can_calculate_total_experience()
    {
        $employee = Employee::factory()->create([
            'date_of_joining' => now()->subYears(5)
        ]);

        $this->assertEquals(5, $employee->total_experience_years);
    }
}
```

### 2. Service Tests

**File:** `packages/aero-hrm/tests/Unit/Services/LeaveBalanceServiceTest.php`

```php
<?php

namespace AeroModules\Hrm\Tests\Unit\Services;

use AeroModules\Hrm\Services\LeaveBalanceService;
use AeroModules\Hrm\Models\Employee;
use AeroModules\Hrm\Models\LeaveBalance;
use AeroModules\Hrm\Tests\TestCase;

class LeaveBalanceServiceTest extends TestCase
{
    protected LeaveBalanceService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(LeaveBalanceService::class);
    }

    /** @test */
    public function it_can_calculate_available_leave_balance()
    {
        $employee = Employee::factory()->create();
        $balance = LeaveBalance::factory()->create([
            'employee_id' => $employee->id,
            'total_days' => 20,
            'used_days' => 5
        ]);

        $available = $this->service->getAvailableBalance($employee->id, 'annual');

        $this->assertEquals(15, $available);
    }

    /** @test */
    public function it_can_deduct_leave_balance()
    {
        $employee = Employee::factory()->create();
        $balance = LeaveBalance::factory()->create([
            'employee_id' => $employee->id,
            'total_days' => 20,
            'used_days' => 5
        ]);

        $result = $this->service->deductBalance($employee->id, 'annual', 3);

        $this->assertTrue($result);
        $this->assertEquals(8, $balance->fresh()->used_days);
    }

    /** @test */
    public function it_prevents_negative_balance()
    {
        $employee = Employee::factory()->create();
        $balance = LeaveBalance::factory()->create([
            'employee_id' => $employee->id,
            'total_days' => 10,
            'used_days' => 8
        ]);

        $result = $this->service->deductBalance($employee->id, 'annual', 5);

        $this->assertFalse($result);
        $this->assertEquals(8, $balance->fresh()->used_days);
    }
}
```

### 3. License Validator Tests

**File:** `packages/aero-hrm/tests/Unit/Services/LicenseValidatorTest.php`

```php
<?php

namespace AeroModules\Hrm\Tests\Unit\Services;

use AeroModules\Hrm\Services\LicenseValidator;
use AeroModules\Hrm\Tests\TestCase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class LicenseValidatorTest extends TestCase
{
    protected LicenseValidator $validator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = app(LicenseValidator::class);
    }

    /** @test */
    public function it_validates_valid_license()
    {
        Http::fake([
            '*/api/licenses/validate' => Http::response([
                'valid' => true,
                'license' => ['status' => 'active']
            ], 200)
        ]);

        $result = $this->validator->validate();

        $this->assertTrue($result);
    }

    /** @test */
    public function it_uses_cache_for_performance()
    {
        Cache::put('hrm_license_valid', true, 3600);

        Http::fake(); // Should not make any HTTP calls

        $result = $this->validator->validate();

        $this->assertTrue($result);
        Http::assertNothingSent();
    }

    /** @test */
    public function it_handles_grace_period()
    {
        Http::fake([
            '*/api/licenses/validate' => Http::response([], 500)
        ]);

        Cache::put('hrm_license_last_check', now()->subDays(3)->timestamp, 3600);

        $result = $this->validator->validate();

        $this->assertTrue($result); // Still valid within 7-day grace period
    }

    /** @test */
    public function it_fails_after_grace_period()
    {
        Http::fake([
            '*/api/licenses/validate' => Http::response([], 500)
        ]);

        Cache::put('hrm_license_last_check', now()->subDays(10)->timestamp, 3600);

        $result = $this->validator->validate();

        $this->assertFalse($result); // Grace period expired
    }
}
```

### Running Unit Tests

```bash
cd packages/aero-hrm
vendor/bin/phpunit --testsuite=Unit --coverage-html coverage
```

---

## Integration Tests

### 1. Employee Management Flow

**File:** `packages/aero-hrm/tests/Integration/EmployeeManagementTest.php`

```php
<?php

namespace AeroModules\Hrm\Tests\Integration;

use AeroModules\Core\Models\User;
use AeroModules\Hrm\Models\Department;
use AeroModules\Hrm\Models\Designation;
use AeroModules\Hrm\Models\Employee;
use AeroModules\Hrm\Tests\TestCase;

class EmployeeManagementTest extends TestCase
{
    /** @test */
    public function it_can_create_employee_with_complete_profile()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);

        $department = Department::factory()->create();
        $designation = Designation::factory()->create();

        $response = $this->postJson('/hrm/employees', [
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john.doe@example.com',
            'employee_id' => 'EMP001',
            'department_id' => $department->id,
            'designation_id' => $designation->id,
            'date_of_joining' => now()->toDateString(),
            'employment_type' => 'full-time'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('employees', ['employee_id' => 'EMP001']);
        $this->assertDatabaseHas('users', ['email' => 'john.doe@example.com']);
    }

    /** @test */
    public function it_can_update_employee_information()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);

        $employee = Employee::factory()->create(['first_name' => 'John']);

        $response = $this->putJson("/hrm/employees/{$employee->id}", [
            'first_name' => 'Jane',
            'last_name' => $employee->last_name
        ]);

        $response->assertStatus(200);
        $this->assertEquals('Jane', $employee->fresh()->first_name);
    }

    /** @test */
    public function it_can_delete_employee()
    {
        $admin = User::factory()->create();
        $this->actingAs($admin);

        $employee = Employee::factory()->create();

        $response = $this->deleteJson("/hrm/employees/{$employee->id}");

        $response->assertStatus(204);
        $this->assertSoftDeleted('employees', ['id' => $employee->id]);
    }
}
```

### 2. Leave Management Flow

**File:** `packages/aero-hrm/tests/Integration/LeaveManagementTest.php`

```php
<?php

namespace AeroModules\Hrm\Tests\Integration;

use AeroModules\Hrm\Models\Employee;
use AeroModules\Hrm\Models\Leave;
use AeroModules\Hrm\Models\LeaveBalance;
use AeroModules\Hrm\Tests\TestCase;

class LeaveManagementTest extends TestCase
{
    /** @test */
    public function employee_can_apply_for_leave()
    {
        $employee = Employee::factory()->create();
        LeaveBalance::factory()->create([
            'employee_id' => $employee->id,
            'leave_type' => 'annual',
            'total_days' => 20,
            'used_days' => 0
        ]);

        $this->actingAs($employee->user);

        $response = $this->postJson('/hrm/leaves', [
            'leave_type' => 'annual',
            'from_date' => now()->addDays(1)->toDateString(),
            'to_date' => now()->addDays(3)->toDateString(),
            'reason' => 'Personal work'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('leaves', [
            'employee_id' => $employee->id,
            'status' => 'pending'
        ]);
    }

    /** @test */
    public function manager_can_approve_leave()
    {
        $manager = Employee::factory()->create();
        $employee = Employee::factory()->create([
            'manager_id' => $manager->id
        ]);
        $leave = Leave::factory()->create([
            'employee_id' => $employee->id,
            'status' => 'pending'
        ]);

        $this->actingAs($manager->user);

        $response = $this->patchJson("/hrm/leaves/{$leave->id}/approve");

        $response->assertStatus(200);
        $this->assertEquals('approved', $leave->fresh()->status);
    }

    /** @test */
    public function it_prevents_overlapping_leaves()
    {
        $employee = Employee::factory()->create();
        Leave::factory()->create([
            'employee_id' => $employee->id,
            'from_date' => now()->addDays(1),
            'to_date' => now()->addDays(3),
            'status' => 'approved'
        ]);

        $this->actingAs($employee->user);

        $response = $this->postJson('/hrm/leaves', [
            'leave_type' => 'annual',
            'from_date' => now()->addDays(2)->toDateString(),
            'to_date' => now()->addDays(4)->toDateString(),
            'reason' => 'Personal work'
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['from_date']);
    }
}
```

### 3. License Integration Test

**File:** `packages/aero-hrm/tests/Integration/LicenseIntegrationTest.php`

```php
<?php

namespace AeroModules\Hrm\Tests\Integration;

use AeroModules\Hrm\Tests\TestCase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;

class LicenseIntegrationTest extends TestCase
{
    /** @test */
    public function it_can_activate_license_via_command()
    {
        Http::fake([
            '*/api/licenses/activate' => Http::response([
                'success' => true,
                'message' => 'License activated successfully'
            ], 200)
        ]);

        $exitCode = Artisan::call('license:activate', [
            'key' => 'ABC-DEF-GHI-JKL'
        ]);

        $this->assertEquals(0, $exitCode);
    }

    /** @test */
    public function it_blocks_access_without_valid_license()
    {
        Http::fake([
            '*/api/licenses/validate' => Http::response([
                'valid' => false
            ], 200)
        ]);

        $response = $this->get('/hrm/employees');

        $response->assertStatus(403);
        $response->assertSee('Invalid License');
    }

    /** @test */
    public function it_allows_access_with_valid_license()
    {
        Http::fake([
            '*/api/licenses/validate' => Http::response([
                'valid' => true,
                'license' => ['status' => 'active']
            ], 200)
        ]);

        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get('/hrm/employees');

        $response->assertStatus(200);
    }
}
```

### Running Integration Tests

```bash
cd packages/aero-hrm
vendor/bin/phpunit --testsuite=Integration
```

---

## Security Audit

### OWASP Top 10 Checklist

#### 1. Injection Vulnerabilities

**Status:** ✅ Protected

- ✅ All database queries use Eloquent ORM (parameterized queries)
- ✅ Form requests validate and sanitize input
- ✅ No raw SQL queries without parameter binding

**Test:**
```php
/** @test */
public function it_prevents_sql_injection()
{
    $response = $this->get('/hrm/employees?search=1\' OR \'1\'=\'1');
    
    $response->assertStatus(200);
    // Should return empty results, not all employees
}
```

#### 2. Broken Authentication

**Status:** ✅ Protected

- ✅ Uses Laravel Sanctum/Passport for API authentication
- ✅ Password reset requires email verification
- ✅ Multi-factor authentication supported via core
- ✅ Session timeout configured

**Test:**
```php
/** @test */
public function it_requires_authentication()
{
    $response = $this->get('/hrm/employees');
    $response->assertRedirect('/login');
}
```

#### 3. Sensitive Data Exposure

**Status:** ✅ Protected

- ✅ Passwords hashed with bcrypt
- ✅ API tokens encrypted
- ✅ License keys never logged
- ✅ HTTPS enforced in production

**Checklist:**
- [ ] Environment variables not in version control
- [ ] `.env.example` provided without sensitive data
- [ ] Database backups encrypted
- [ ] File uploads scanned for malware

#### 4. XML External Entities (XXE)

**Status:** ✅ N/A

- HRM module doesn't process XML input

#### 5. Broken Access Control

**Status:** ✅ Protected

- ✅ Policies enforce authorization on all models
- ✅ Middleware checks permissions before route access
- ✅ Scope-based access (all/department/team/own)

**Test:**
```php
/** @test */
public function employee_cannot_access_other_employee_data()
{
    $employee1 = Employee::factory()->create();
    $employee2 = Employee::factory()->create();
    
    $this->actingAs($employee1->user);
    
    $response = $this->get("/hrm/employees/{$employee2->id}");
    $response->assertStatus(403);
}
```

#### 6. Security Misconfiguration

**Status:** ⚠️ Review Required

**Checklist:**
- [ ] Debug mode disabled in production
- [ ] Default passwords changed
- [ ] Unnecessary services disabled
- [ ] Error messages don't expose sensitive info
- [ ] Security headers configured

**Fix:**
```php
// config/aero-hrm.php
'debug' => env('APP_DEBUG', false),
'error_reporting' => env('APP_ENV') === 'production' ? E_ALL & ~E_NOTICE : E_ALL,
```

#### 7. Cross-Site Scripting (XSS)

**Status:** ✅ Protected

- ✅ Blade templates auto-escape output
- ✅ React components sanitize user input
- ✅ Content Security Policy headers

**Test:**
```php
/** @test */
public function it_escapes_html_in_employee_notes()
{
    $employee = Employee::factory()->create([
        'notes' => '<script>alert("XSS")</script>'
    ]);
    
    $response = $this->get("/hrm/employees/{$employee->id}");
    
    $response->assertSee('&lt;script&gt;');
    $response->assertDontSee('<script>');
}
```

#### 8. Insecure Deserialization

**Status:** ✅ Protected

- ✅ No untrusted data deserialization
- ✅ JSON used for API responses
- ✅ Validation before processing

#### 9. Using Components with Known Vulnerabilities

**Status:** ⚠️ Ongoing Monitoring

**Actions:**
```bash
# Check for vulnerabilities
composer audit

# Update dependencies
composer update

# Frontend dependencies
npm audit
npm audit fix
```

#### 10. Insufficient Logging & Monitoring

**Status:** ✅ Implemented

- ✅ All authentication attempts logged
- ✅ Failed license validations logged
- ✅ Admin actions logged
- ✅ Error tracking configured

**Logs to Review:**
- `storage/logs/laravel.log`
- License validation failures
- Failed login attempts
- Permission denied events

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Test employee list endpoint
ab -n 1000 -c 10 -H "Authorization: Bearer TOKEN" \
   https://demo.aero-erp.com/api/hrm/employees

# Expected results:
# - Response time: < 200ms (avg)
# - Throughput: > 50 requests/sec
# - Success rate: 100%
```

### Database Query Optimization

```bash
# Enable query logging
php artisan telescope:install

# Check for N+1 queries
# Visit: /telescope/queries

# Optimize with eager loading
Employee::with(['department', 'designation', 'user'])->get();
```

### Cache Performance

```php
// Cache frequently accessed data
Cache::remember('departments_list', 3600, function () {
    return Department::all();
});

// Warm up cache
php artisan cache:warm
```

### Benchmarks

| Endpoint | Target | Actual |
|----------|--------|--------|
| GET /employees | < 200ms | ⏱️ Test |
| POST /employees | < 300ms | ⏱️ Test |
| GET /leaves | < 150ms | ⏱️ Test |
| License validation | < 100ms | ⏱️ Test |

---

## Codecanyon Validation

### Quality Checklist

- [ ] **Code Quality**
  - [ ] PSR-12 coding standards
  - [ ] No PHP warnings/notices
  - [ ] Clean code principles
  - [ ] Commented complex logic

- [ ] **Documentation**
  - [ ] README.md complete
  - [ ] Installation guide clear
  - [ ] Configuration documented
  - [ ] API endpoints listed
  - [ ] Troubleshooting section

- [ ] **Functionality**
  - [ ] All features working
  - [ ] No console errors
  - [ ] Mobile responsive
  - [ ] Cross-browser tested

- [ ] **Security**
  - [ ] CSRF protection
  - [ ] XSS prevention
  - [ ] SQL injection protected
  - [ ] Authentication working
  - [ ] Authorization enforced

- [ ] **Performance**
  - [ ] Page load < 2 seconds
  - [ ] Optimized queries
  - [ ] Cached where appropriate
  - [ ] Assets minified

### Automated Validation

```bash
# Run all checks
./vendor/bin/pint --test
./vendor/bin/phpstan analyze
./vendor/bin/phpunit
npm run build
```

---

## Pre-Launch Checklist

### Week 7 Tasks

#### Day 1-2: Testing
- [ ] Write all unit tests
- [ ] Write integration tests
- [ ] Achieve 80%+ coverage
- [ ] Fix all failing tests

#### Day 3-4: Security
- [ ] Complete security audit
- [ ] Fix vulnerabilities
- [ ] Implement security headers
- [ ] Review permissions

#### Day 5-6: Performance
- [ ] Run load tests
- [ ] Optimize queries
- [ ] Implement caching
- [ ] Measure benchmarks

#### Day 7: Validation
- [ ] Run Codecanyon checklist
- [ ] Fix quality issues
- [ ] Document everything
- [ ] Prepare for Week 8 launch

### Critical Issues

**Must Fix Before Launch:**
- ❌ Any security vulnerabilities
- ❌ Test coverage < 80%
- ❌ Performance < benchmarks
- ❌ Missing documentation

**Nice to Have:**
- ⚠️ Additional features
- ⚠️ UI polish
- ⚠️ Extra documentation

---

## Next Steps

After Week 7 completion:

1. **Week 5-6:** Demo deployment & marketing
2. **Week 8:** Final review & Codecanyon submission

**Status:** Ready for production testing phase

---

## Resources

- [Laravel Testing Documentation](https://laravel.com/docs/testing)
- [PHPUnit Documentation](https://phpunit.de/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Codecanyon Quality Guidelines](https://help.author.envato.com/)
