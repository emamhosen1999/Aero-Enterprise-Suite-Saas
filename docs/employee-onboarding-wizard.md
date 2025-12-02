# Employee Onboarding Wizard

## Overview
A comprehensive multi-step onboarding wizard for new employees, providing a guided experience for collecting all necessary information during the hiring process.

## Features

### 5-Step Wizard Flow
1. **Personal Information**
   - Full name, email, phone
   - Date of birth, gender
   - Address (street, city, state, zip, country)
   - Emergency contact details

2. **Job Details**
   - Employee ID (unique identifier)
   - Department and designation
   - Attendance type
   - Hire date
   - Reporting manager
   - Work location
   - Employment type (full-time, part-time, contract, intern)
   - Probation period

3. **Documents**
   - Resume/CV upload
   - ID proof (passport, driver's license)
   - Address proof
   - Education certificates
   - Experience letters
   - Passport details (number, expiry)
   - National ID/SSN

4. **Bank Details**
   - Bank name and branch
   - Account number and holder name
   - Routing number
   - SWIFT code (for international)
   - Tax ID / EIN
   - PAN number

5. **Review & Submit**
   - Summary of all entered information
   - Edit capabilities for each section
   - Final confirmation and submission

## Technical Implementation

### Frontend Component
**File**: `resources/js/Pages/HR/Onboarding/Wizard.jsx`

- Built with React and Inertia.js
- Uses HeroUI components for consistent UI
- Framer Motion for smooth step transitions
- Form state management with `useForm` hooks
- Progress bar tracking completion
- Step-by-step validation
- Edit capability from review screen

### Backend Controller
**File**: `app/Http/Controllers/HR/OnboardingController.php`

Methods:
- `wizard($employeeId)` - Display wizard interface
- `savePersonal(Request, $employeeId)` - Save personal info
- `saveJob(Request, $employeeId)` - Save job details
- `saveDocuments(Request, $employeeId)` - Handle document uploads
- `saveBank(Request, $employeeId)` - Save banking information
- `complete($employeeId)` - Finalize onboarding

### Routes
**File**: `routes/hr.php`

```php
Route::get('/onboarding/wizard/{employee}', [OnboardingController::class, 'wizard'])->name('onboarding.wizard');
Route::post('/onboarding/wizard/{employee}/personal', [OnboardingController::class, 'savePersonal'])->name('onboarding.save-personal');
Route::post('/onboarding/wizard/{employee}/job', [OnboardingController::class, 'saveJob'])->name('onboarding.save-job');
Route::post('/onboarding/wizard/{employee}/documents', [OnboardingController::class, 'saveDocuments'])->name('onboarding.save-documents');
Route::post('/onboarding/wizard/{employee}/bank', [OnboardingController::class, 'saveBank'])->name('onboarding.save-bank');
Route::post('/onboarding/wizard/{employee}/complete', [OnboardingController::class, 'complete'])->name('onboarding.complete');
```

## Key Features

### Progressive Saving
- Each step saves data immediately upon "Next"
- No data loss if user navigates away
- Can resume onboarding process later

### Validation
- Field-level validation on frontend
- Server-side validation for security
- Clear error messages for invalid data
- Required field indicators

### File Uploads
- Support for multiple document types (PDF, JPG, PNG, DOC)
- 5MB file size limit per upload
- Secure storage in `storage/app/public/onboarding/documents/{employeeId}`
- Multiple file uploads for certificates and experience letters

### Security
- Authorization checks via policies
- CSRF protection on all forms
- Encrypted banking information
- Permission-based access (`hr.onboarding.view`)

### User Experience
- Visual progress indicator
- Step completion tracking
- Clickable step navigation (completed steps)
- Smooth animations between steps
- Responsive design for mobile devices
- Loading states during processing

## Completion Actions

When the wizard is completed:
1. Creates an `Onboarding` record with status "in_progress"
2. Generates default onboarding tasks:
   - Complete HR documentation (due in 3 days)
   - IT equipment setup (due in 1 day)
   - Office tour and introductions (due in 2 days)
   - Review company policies (due in 5 days)
   - Set up email and accounts (due in 1 day)
3. Marks employee as `active`
4. Redirects to onboarding detail page

## Database Storage

### User Model Fields
All wizard data is stored in the `users` table with extended fields:
- Personal: `name`, `email`, `phone`, `birthday`, `gender`, `address`, `city`, `state`, `zip_code`, `country`
- Emergency: `emergency_contact_primary_name`, `emergency_contact_primary_phone`, `emergency_contact_primary_relationship`
- Job: `employee_id`, `department_id`, `designation_id`, `attendance_type_id`, `hire_date`, `reporting_manager_id`, `work_location`, `employment_type`, `probation_period`
- Documents: `resume_path`, `id_proof_path`, `address_proof_path`, `passport_no`, `passport_exp_date`, `nid`
- Banking: `bank_name`, `bank_account_no`, `bank_account_name`, `bank_branch`, `bank_routing_no`, `bank_swift_code`, `tax_id`, `pan_no`

### Onboarding Model
Tracks the onboarding process:
- `employee_id`: Foreign key to users
- `start_date`: When onboarding begins
- `expected_completion_date`: Target completion (default: 30 days)
- `status`: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- `notes`: Additional information

### OnboardingTask Model
Checklist items for onboarding:
- `onboarding_id`: Foreign key
- `task`: Task description
- `due_date`: Deadline
- `status`: PENDING, IN_PROGRESS, COMPLETED
- `assigned_to`: User responsible

## Access & Permissions

Required permission: `hr.onboarding.view`

Access via:
- Direct link: `/hr/onboarding/wizard/{employeeId}`
- From employee list (to be added)
- From onboarding index page

## Integration Points

### Existing Systems
- User/Employee management
- Department management
- Designation/Role management
- Attendance types
- Document storage (Laravel Storage)

### Future Enhancements
- Email notifications at each step
- SMS verification for contact details
- Digital signature for documents
- Background verification integration
- Automated task assignment
- Onboarding progress dashboard
- Bulk onboarding for multiple employees
- Template-based onboarding (by role/department)

## Usage Flow

1. HR creates a new user record (or imports from applicant)
2. HR initiates wizard: `/hr/onboarding/wizard/{userId}`
3. Employee (or HR) completes 5 steps
4. System creates onboarding record with tasks
5. Employee marked as active
6. HR tracks onboarding progress
7. Tasks completed over 30-day period
8. Onboarding marked as completed

## Benefits

- **Consistency**: Same process for all employees
- **Completeness**: All required information collected
- **Compliance**: Audit trail of onboarding steps
- **Efficiency**: Reduced manual data entry
- **User-Friendly**: Guided experience reduces errors
- **Flexibility**: Can pause and resume
- **Integration**: Seamlessly connects with existing HR systems

## Comparison to Traditional Onboarding

| Feature | Traditional (Create.jsx) | Wizard (Wizard.jsx) |
|---------|-------------------------|---------------------|
| **Steps** | Single form | 5 guided steps |
| **Progress Tracking** | No | Yes with visual indicator |
| **Data Saving** | All at once | Progressive per step |
| **Validation** | End of form | Per step |
| **User Experience** | Overwhelming | Intuitive and guided |
| **File Uploads** | Limited | Multiple with preview |
| **Review Step** | No | Yes with edit capability |
| **Mobile Support** | Basic | Responsive design |
| **Animations** | None | Smooth transitions |

## Maintenance

### Adding New Fields
1. Add to database migration (users table)
2. Update validation in controller method
3. Add field to appropriate wizard step
4. Update review step summary

### Modifying Steps
1. Update `steps` array in Wizard.jsx
2. Add new case in `renderStepContent()`
3. Create controller method if needed
4. Add route in `routes/hr.php`

### Changing Completion Logic
Modify `complete()` method in `OnboardingController.php` to adjust:
- Default tasks created
- Notification triggers
- Status updates
- Redirect destination

## Testing Checklist

- [ ] All fields validate correctly
- [ ] File uploads work and store properly
- [ ] Step navigation functions (next/previous)
- [ ] Can edit from review step
- [ ] Data persists between steps
- [ ] Completion creates onboarding record
- [ ] Default tasks are created
- [ ] Employee marked as active
- [ ] Authorization checks work
- [ ] Mobile responsive design
- [ ] Error handling displays properly
- [ ] Loading states show correctly

## Conclusion

The Employee Onboarding Wizard provides a modern, user-friendly approach to collecting comprehensive employee information during the hiring process. By breaking the process into manageable steps with progressive saving, it ensures data completeness while maintaining an excellent user experience.
