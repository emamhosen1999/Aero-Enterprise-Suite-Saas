# Tenant Module Files - Awaiting Module Package Creation

These files belong in their respective module packages (aero-hrm, aero-crm, etc.) but the module packages haven't been created yet.

## Distribution Plan:

### Controllers/Tenant/
- **CRM/** → aero-crm package
- **Compliance/** → aero-compliance package  
- **POS/** → aero-pos package
- **SCM/** → aero-scm package
- **IMS/** → aero-ims package
- **Finance/** → aero-finance package
- **DMS/** → aero-dms package
- **Quality/** → aero-quality package
- **Helpdesk/** → aero-helpdesk package
- **LMS/** → aero-lms package
- **ProjectManagement/** → aero-project package
- **Asset/** → aero-asset package
- **Procurement/** → aero-procurement package
- **Analytics/** → aero-analytics package
- **FMS/** → aero-fms package
- **Dashboard/** → aero-core (core dashboard)
- **AdminSetupController.php** → aero-core
- **SubscriptionController.php** → aero-core
- **TenantOnboardingController.php** → aero-core

### Models/Tenant/
- Map to respective module packages based on business domain

### Services/Tenant/
- Map to respective module packages based on business domain

### Policies/Tenant/
- Map to respective module packages based on business domain

## Next Steps:
1. Create individual module packages (aero-crm, aero-hrm, etc.)
2. Move files from this directory to appropriate packages
3. Update all imports and namespaces
4. Delete this TODO directory once all files are distributed
