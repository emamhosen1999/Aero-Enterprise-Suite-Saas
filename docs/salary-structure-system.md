# Salary Structure Management System

## Overview
Comprehensive salary structure management system for the HRM module with flexible component management, employee-specific salary assignments, and real-time calculation preview.

## Features

### 1. Salary Component Management
- **Component Types**: Earnings and Deductions
- **Calculation Types**:
  - Fixed: Static amount
  - Percentage: Based on basic/gross/CTC
  - Formula: Custom expressions
  - Attendance: Overtime calculations
  - Slab: Progressive calculations
- **Settings**:
  - Tax status (taxable/non-taxable)
  - Statutory flags (PF, ESI, etc.)
  - Payroll impact (affects gross, CTC, EPF, ESI)
  - Display preferences (show in payslip, show if zero)

### 2. Default Components Seeded
#### Earnings (8 components):
- BASIC - Basic Salary (fixed)
- HRA - House Rent Allowance (40% of basic)
- DA - Dearness Allowance (10% of basic)
- TA - Transport Allowance (₹1,600 fixed)
- MA - Medical Allowance (₹1,250 fixed)
- SPA - Special Allowance (fixed)
- OT - Overtime (formula-based)
- BONUS - Performance Bonus (fixed)

#### Deductions (5 components):
- PF_EE - Provident Fund (12% of basic)
- ESI_EE - Employee State Insurance (0.75% of gross)
- PT - Professional Tax (slab-based)
- TDS - Income Tax (formula-based)
- LOAN - Loan Repayment (fixed)

### 3. Employee Salary Assignment
- Per-employee component customization
- Override default amounts/percentages
- Effective date management
- Salary preview with real-time calculation
- Visual breakdown of earnings and deductions

## Database Structure

### Tables Created:
1. **salary_components** - Master component list
2. **employee_salary_structures** - Employee assignments
3. **salary_templates** - Reusable salary templates
4. **salary_template_components** - Template composition
5. **salary_revisions** - Salary change history with approval workflow

## API Endpoints

### Component Management:
```
GET    /hr/salary-structure              - List all components
POST   /hr/salary-structure              - Create component
PUT    /hr/salary-structure/{id}         - Update component
DELETE /hr/salary-structure/{id}         - Delete component
```

### Employee Salary:
```
GET    /hr/salary-structure/employee/{id}      - View employee salary
POST   /hr/salary-structure/assign             - Assign components
POST   /hr/salary-structure/calculate-preview  - Calculate preview
```

## Frontend Components

### 1. Index.jsx (`/hr/salary-structure`)
- Component management dashboard
- Create/Edit/Delete components
- Tabs for All/Earnings/Deductions
- Stats cards (total, active, earnings, deductions)
- Comprehensive component form with all settings

### 2. EmployeeSalary.jsx (`/hr/salary-structure/employee/{id}`)
- Employee salary overview
- Earnings and deductions breakdown
- Summary cards (total earnings, deductions, net salary)
- Assignment modal with:
  - Component selector
  - Calculation type override
  - Amount/percentage input
  - Real-time preview calculation
  - Effective date selection

## Usage

### Creating a Salary Component:
1. Navigate to HR → Salary Structure
2. Click "Add Component"
3. Fill in component details:
   - Name and Code
   - Type (Earning/Deduction)
   - Calculation method
   - Tax and payroll settings
4. Save component

### Assigning Salary to Employee:
1. Navigate to employee salary page
2. Click "Assign Salary Structure"
3. Add components from dropdown
4. Set amounts or percentages
5. Click "Calculate Preview" to see breakdown
6. Set effective date
7. Submit to assign

## Models

### SalaryComponent.php
- Fillable fields for all component properties
- Calculation methods:
  - `calculateAmount()` - Main calculation engine
  - `getBaseAmount()` - Get base for percentage calculations
  - `evaluateFormula()` - Formula evaluation
  - `calculateFromAttendance()` - Overtime calculations
- Query scopes for filtering

### EmployeeSalaryStructure.php
- Per-employee component assignments
- Override support for amounts/percentages
- Effective date tracking
- Calculation methods with override logic

## Controller Methods

### SalaryStructureController.php
- `index()` - List all components
- `store()` - Create component
- `update()` - Update component
- `destroy()` - Delete component
- `employeeSalary()` - View employee salary
- `assignToEmployee()` - Assign components to employee
- `calculatePreview()` - Real-time salary calculation

## Permissions Required
- `hr.payroll.view` - Access salary structure pages

## Testing Checklist
- [ ] Create earning component
- [ ] Create deduction component
- [ ] Edit component
- [ ] Delete component
- [ ] Filter by earnings/deductions
- [ ] Assign salary to employee
- [ ] Override component amount
- [ ] Calculate preview
- [ ] View employee salary breakdown

## Future Enhancements
1. Salary templates for roles/designations
2. Bulk employee assignment
3. Salary revision history
4. Approval workflow
5. Formula builder UI
6. Slab configuration UI
7. Export salary structures
8. Import from Excel

## Technical Notes
- Uses Laravel Eloquent ORM
- Inertia.js for frontend
- HeroUI component library
- Axios for API calls
- Soft deletes enabled
- Multi-tenant support (migrations in tenant folder)
