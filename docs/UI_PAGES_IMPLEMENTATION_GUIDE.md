# UI Pages Implementation Guide

## Overview

This document provides a comprehensive guide for implementing missing UI pages for the newly synchronized navigation modules: **DMS**, **Quality**, **Compliance**, and **Platform Onboarding**.

**Total Pages Required**: 36 new page components

---

## Current Status

### ✅ Existing Pages

**DMS Module** (`resources/js/Tenant/Pages/DMS/`):
- ✅ Dashboard.jsx (exists)

**Other Modules**:
- ❌ Quality - No folder exists
- ❌ Compliance - No folder exists  
- ❌ Platform Onboarding - No folder exists in Admin/Pages

---

## Missing Pages Breakdown

### 📁 DMS Module - 11 Missing Pages

**Directory**: `resources/js/Tenant/Pages/DMS/`

| # | Page Name | Route | Component File | Priority |
|---|-----------|-------|----------------|----------|
| 1 | Overview | `dms.index` | `Index.jsx` | HIGH |
| 2 | Document Library | `dms.documents` | `Documents.jsx` | HIGH |
| 3 | Version Control | `dms.versions` | `Versions.jsx` | MEDIUM |
| 4 | Folders | `dms.folders` | `Folders.jsx` | HIGH |
| 5 | Shared Documents | `dms.shared` | `SharedDocuments.jsx` | MEDIUM |
| 6 | Workflows | `dms.workflows` | `Workflows.jsx` | MEDIUM |
| 7 | Templates | `dms.templates` | `Templates.jsx` | LOW |
| 8 | E-Signatures | `dms.signatures` | `Signatures.jsx` | MEDIUM |
| 9 | Audit Trail | `dms.audit` | `AuditTrail.jsx` | LOW |
| 10 | Search | `dms.search` | `Search.jsx` | HIGH |
| 11 | Analytics | `dms.analytics` | `Analytics.jsx` | MEDIUM |
| 12 | Settings | `dms.settings` | `Settings.jsx` | LOW |

### 🛡️ Quality Module - 9 Missing Pages

**Directory**: `resources/js/Tenant/Pages/Quality/` (needs creation)

| # | Page Name | Route | Component File | Priority |
|---|-----------|-------|----------------|----------|
| 1 | Dashboard | `quality.dashboard` | `Dashboard.jsx` | HIGH |
| 2 | Inspections | `quality.inspections.index` | `Inspections.jsx` | HIGH |
| 3 | NCRs | `quality.ncrs.index` | `NCRs.jsx` | HIGH |
| 4 | CAPA | `quality.capa.index` | `CAPA.jsx` | HIGH |
| 5 | Calibrations | `quality.calibrations.index` | `Calibrations.jsx` | MEDIUM |
| 6 | Quality Audits | `quality.audits.index` | `Audits.jsx` | MEDIUM |
| 7 | Certifications | `quality.certifications.index` | `Certifications.jsx` | MEDIUM |
| 8 | Analytics | `quality.analytics` | `Analytics.jsx` | MEDIUM |
| 9 | Settings | `quality.settings` | `Settings.jsx` | LOW |

### 📋 Compliance Module - 9 Missing Pages

**Directory**: `resources/js/Tenant/Pages/Compliance/` (needs creation)

| # | Page Name | Route | Component File | Priority |
|---|-----------|-------|----------------|----------|
| 1 | Dashboard | `compliance.dashboard` | `Dashboard.jsx` | HIGH |
| 2 | Policies & Procedures | `compliance.policies.index` | `Policies.jsx` | HIGH |
| 3 | Risk Register | `compliance.risks.index` | `Risks.jsx` | HIGH |
| 4 | Compliance Audits | `compliance.audits.index` | `Audits.jsx` | MEDIUM |
| 5 | Regulatory Requirements | `compliance.requirements.index` | `Requirements.jsx` | MEDIUM |
| 6 | Compliance Documents | `compliance.documents.index` | `Documents.jsx` | MEDIUM |
| 7 | Training & Awareness | `compliance.training.index` | `Training.jsx` | MEDIUM |
| 8 | Certifications | `compliance.certifications.index` | `Certifications.jsx` | MEDIUM |
| 9 | Reports & Analytics | `compliance.reports.index` | `Reports.jsx` | MEDIUM |

### 🎯 Platform Onboarding - 7 Missing Pages

**Directory**: `resources/js/Admin/Pages/Onboarding/` (needs creation)

| # | Page Name | Route | Component File | Priority |
|---|-----------|-------|----------------|----------|
| 1 | Registration Dashboard | `admin.onboarding.dashboard` | `Dashboard.jsx` | HIGH |
| 2 | Pending Registrations | `admin.onboarding.pending` | `PendingRegistrations.jsx` | HIGH |
| 3 | Provisioning Queue | `admin.onboarding.provisioning` | `ProvisioningQueue.jsx` | HIGH |
| 4 | Trial Management | `admin.onboarding.trials` | `TrialManagement.jsx` | MEDIUM |
| 5 | Welcome Automation | `admin.onboarding.automation` | `WelcomeAutomation.jsx` | LOW |
| 6 | Analytics | `admin.onboarding.analytics` | `Analytics.jsx` | MEDIUM |
| 7 | Settings | `admin.onboarding.settings` | `Settings.jsx` | LOW |

---

## Implementation Standards

### Component Structure

All pages must follow this pattern (from existing EmployeeList.jsx and DMS/Dashboard.jsx):

```jsx
import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from "@inertiajs/react";
import { 
  Button, 
  Card, 
  CardBody, 
  CardHeader,
  Input,
  Select,
  SelectItem,
  Spinner,
  Pagination
} from "@heroui/react";
import { IconName } from "@heroicons/react/24/outline";
import App from "@/Layouts/App.jsx";
import StatsCards from "@/Components/StatsCards.jsx";
import PageHeader from "@/Components/PageHeader.jsx";

const ComponentName = ({ title, initialData = [] }) => {
  // 1. Responsive breakpoint detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth < 768);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // 2. State management
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(initialData);
  
  // 3. Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  });
  
  // 4. Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    total: 0,
  });

  return (
    <App>
      <Head title={title} />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Page Header */}
        <PageHeader 
          title={title}
          description="Manage and track..."
          action={{
            label: "Add New",
            onClick: () => {},
            icon: <IconName className="h-5 w-5" />
          }}
        />
        
        {/* Stats Cards */}
        <StatsCards stats={statsData} isLoading={loading} />
        
        {/* Filters */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Search..."
                value={filters.search}
                onValueChange={(value) => setFilters(prev => ({...prev, search: value}))}
                startContent={<MagnifyingGlassIcon className="w-4 h-4 text-default-400" />}
                classNames={{ inputWrapper: "bg-default-100" }}
              />
              {/* Add more filters */}
            </div>
          </CardBody>
        </Card>
        
        {/* Data Table */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Data List</h3>
          </CardHeader>
          <CardBody>
            {/* Table component */}
          </CardBody>
        </Card>
        
        {/* Pagination */}
        <div className="mt-4 flex justify-center">
          <Pagination
            total={pagination.lastPage}
            page={pagination.currentPage}
            onChange={(page) => loadData(page)}
          />
        </div>
      </div>
    </App>
  );
};

export default ComponentName;
```

### Required HeroUI Components

- `Table`, `TableHeader`, `TableColumn`, `TableBody`, `TableRow`, `TableCell`
- `Card`, `CardHeader`, `CardBody`, `CardFooter`
- `Button`, `ButtonGroup`
- `Input`, `Select`, `SelectItem`
- `Modal`, `ModalContent`, `ModalHeader`, `ModalBody`, `ModalFooter`
- `Chip`, `Badge`, `Tooltip`, `Dropdown`
- `Pagination`, `Spinner`, `Skeleton`

### Required Icons (@heroicons/react/24/outline)

Common icons to import:
- `MagnifyingGlassIcon`, `FunnelIcon`, `AdjustmentsHorizontalIcon`
- `PlusIcon`, `PencilIcon`, `TrashIcon`
- `EyeIcon`, `DocumentTextIcon`, `FolderIcon`
- `ChartBarIcon`, `ClockIcon`, `CheckCircleIcon`

### Card Styling Pattern (CRITICAL)

```jsx
<Card 
  className="transition-all duration-200"
  style={{
    border: `var(--borderWidth, 2px) solid transparent`,
    borderRadius: `var(--borderRadius, 12px)`,
    fontFamily: `var(--fontFamily, "Inter")`,
    transform: `scale(var(--scale, 1))`,
    background: `linear-gradient(135deg, 
      var(--theme-content1, #FAFAFA) 20%, 
      var(--theme-content2, #F4F4F5) 10%, 
      var(--theme-content3, #F1F3F4) 20%)`,
  }}
>
  <CardHeader 
    style={{
      borderBottom: `1px solid var(--theme-divider, #E4E4E7)`,
    }}
  >
    {/* Header content */}
  </CardHeader>
  <CardBody>
    {/* Body content */}
  </CardBody>
</Card>
```

---

## Page Type Templates

### 1. Dashboard Page Template

**Features:**
- 4-6 stat cards with icons
- Recent activity list
- Charts/graphs (optional)
- Quick actions

**Reference**: `resources/js/Tenant/Pages/DMS/Dashboard.jsx`, `resources/js/Tenant/Pages/HR/Dashboard.jsx`

**Key Elements**:
- StatsCards component
- Grid layout for stats
- Recent items table
- Charts using recharts library

### 2. List/Index Page Template

**Features:**
- Search and filters
- Data table with sorting
- Pagination
- Bulk actions
- Add/Edit/Delete actions

**Reference**: `resources/js/Tenant/Pages/Employees/EmployeeList.jsx`

**Key Elements**:
- Filter bar with search + dropdowns
- Table with custom columns
- Dropdown actions per row
- Modal forms for CRUD

### 3. Detail/Show Page Template

**Features:**
- Header with breadcrumb
- Tabbed interface
- Related data sections
- Action buttons

**Reference**: Look at existing Show pages in tenant modules

### 4. Settings Page Template

**Features:**
- Form sections
- Toggle switches
- Save/Reset buttons
- Success/error toasts

**Reference**: `resources/js/Tenant/Pages/Settings/`

---

## Implementation Priority

### Phase 1: High Priority (Week 1-2)

**Focus**: Dashboard and Index pages for each module

1. **DMS**:
   - Index.jsx (Overview)
   - Documents.jsx (Library)
   - Folders.jsx
   - Search.jsx

2. **Quality**:
   - Dashboard.jsx
   - Inspections.jsx
   - NCRs.jsx
   - CAPA.jsx

3. **Compliance**:
   - Dashboard.jsx
   - Policies.jsx
   - Risks.jsx

4. **Platform Onboarding**:
   - Dashboard.jsx
   - PendingRegistrations.jsx
   - ProvisioningQueue.jsx

**Estimated Time**: 40-60 hours

### Phase 2: Medium Priority (Week 3-4)

**Focus**: Specialized pages and secondary features

1. **DMS**: Version Control, Workflows, Shared Documents, E-Signatures, Analytics
2. **Quality**: Calibrations, Audits, Certifications, Analytics
3. **Compliance**: Audits, Requirements, Documents, Training, Certifications
4. **Platform Onboarding**: Trial Management, Analytics

**Estimated Time**: 30-40 hours

### Phase 3: Low Priority (Week 5+)

**Focus**: Settings and specialized features

1. **All Modules**: Settings pages
2. **DMS**: Templates, Audit Trail
3. **Compliance**: Reports
4. **Platform Onboarding**: Welcome Automation

**Estimated Time**: 20-30 hours

---

## Data Requirements

Each page needs corresponding backend:

### 1. Controller Methods

```php
// Example for Quality Inspections
class QualityInspectionController extends Controller
{
    public function index(Request $request)
    {
        return Inertia::render('Tenant/Pages/Quality/Inspections', [
            'title' => 'Quality Inspections',
            'inspections' => Inspection::with(['inspector', 'location'])
                ->paginate($request->get('per_page', 10)),
            'stats' => [
                'total' => Inspection::count(),
                'pending' => Inspection::where('status', 'pending')->count(),
                'completed' => Inspection::where('status', 'completed')->count(),
            ],
        ]);
    }
}
```

### 2. Routes

```php
// routes/tenant/quality.php
Route::middleware(['auth:web', 'module:quality'])->prefix('quality')->name('quality.')->group(function () {
    Route::get('/dashboard', [QualityController::class, 'dashboard'])->name('dashboard');
    Route::resource('inspections', QualityInspectionController::class);
    Route::resource('ncrs', NCRController::class);
    Route::resource('capa', CAPAController::class);
    // ... more routes
});
```

### 3. Models

Each entity needs:
- Model with relationships
- Migration
- Factory (for testing)
- Policy (for authorization)

---

## Testing Checklist

For each page, verify:

- [ ] Page renders without errors
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Dark mode support
- [ ] Access control works (module permissions)
- [ ] Search functionality
- [ ] Filters work correctly
- [ ] Pagination works
- [ ] CRUD operations functional
- [ ] Toast notifications display
- [ ] Loading states show correctly
- [ ] No console errors
- [ ] Icons display properly

---

## Development Workflow

### Step 1: Setup Folder Structure

```bash
# Tenant pages
mkdir -p resources/js/Tenant/Pages/Quality
mkdir -p resources/js/Tenant/Pages/Compliance

# Admin pages
mkdir -p resources/js/Admin/Pages/Onboarding
```

### Step 2: Create Skeleton Pages

Start with basic structure, gradually add features:

```jsx
// Skeleton template
import React from 'react';
import { Head } from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import { Card, CardBody } from "@heroui/react";

const PageName = () => {
  return (
    <App>
      <Head title="Page Title" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Page Title</h1>
        <Card>
          <CardBody>
            <p className="text-gray-600">TODO: Implement page content</p>
          </CardBody>
        </Card>
      </div>
    </App>
  );
};

export default PageName;
```

### Step 3: Add Features Incrementally

1. Add stats cards
2. Add filters
3. Add data table
4. Add CRUD modals
5. Add pagination
6. Polish UI/UX

### Step 4: Test and Refine

- Test on different screen sizes
- Test with different user roles
- Test edge cases
- Optimize performance

---

## Code Generation Script

For rapid skeleton generation, use this bash script:

```bash
#!/bin/bash

# Generate skeleton page
generate_page() {
  local module=$1
  local page=$2
  local route=$3
  local title=$4
  
  cat > "resources/js/Tenant/Pages/${module}/${page}.jsx" << 'EOF'
import React from 'react';
import { Head } from "@inertiajs/react";
import App from "@/Layouts/App.jsx";
import { Card, CardBody } from "@heroui/react";

const ${page} = () => {
  return (
    <App>
      <Head title="${title}" />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">${title}</h1>
        <Card>
          <CardBody>
            <p className="text-gray-600">TODO: Implement ${title}</p>
          </CardBody>
        </Card>
      </div>
    </App>
  );
};

export default ${page};
EOF

  echo "Created: resources/js/Tenant/Pages/${module}/${page}.jsx"
}

# Usage examples:
# generate_page "Quality" "Dashboard" "quality.dashboard" "Quality Dashboard"
# generate_page "Quality" "Inspections" "quality.inspections.index" "Quality Inspections"
```

---

## Resources

### Reference Files

**Best Practices:**
- `resources/js/Tenant/Pages/Employees/EmployeeList.jsx` - Complete list page example
- `resources/js/Tenant/Pages/DMS/Dashboard.jsx` - Dashboard example
- `resources/js/Tenant/Pages/HR/Dashboard.jsx` - Stats and charts
- `resources/js/Tables/EmployeeTable.jsx` - Data table pattern
- `resources/js/Forms/AddEditUserForm.jsx` - Form modal pattern
- `resources/js/Components/StatsCards.jsx` - Stats component
- `resources/js/Components/PageHeader.jsx` - Page header component

### Documentation

- HeroUI Documentation: https://heroui.com/
- Heroicons: https://heroicons.com/
- Inertia.js: https://inertiajs.com/
- React: https://react.dev/

---

## Success Criteria

✅ All 36 pages created and functional
✅ Consistent UI/UX across all modules
✅ Responsive design working
✅ Access control properly implemented
✅ No console errors
✅ Performance optimized
✅ Code follows project standards
✅ Documentation updated

---

## Estimated Total Effort

**Development Time**: 90-130 hours (11-16 days full-time)
**Testing Time**: 20-30 hours
**Documentation**: 5-10 hours
**Total**: 115-170 hours (15-21 days)

**Recommended Approach**: Implement in 3-4 sprints with priority-based rollout.

---

## Next Steps

1. **Review this guide** with the development team
2. **Prioritize pages** based on business requirements
3. **Assign developers** to specific modules
4. **Set up backend routes and controllers** first
5. **Begin Phase 1 implementation**
6. **Regular code reviews** to ensure consistency
7. **Iterative testing** throughout development

---

**Last Updated**: 2025-12-05
**Status**: Ready for Implementation
**Priority**: HIGH - Required for full module synchronization
