The project workflow is structured into four distinct phases: **Platform Registration**, **Tenant Provisioning**, **Tenant Onboarding**, and **Operational Usage**. The system uses a multi-tenant architecture where the "Platform" manages the infrastructure and "Tenants" operate in isolated environments.

### 1. Landing & Registration (Platform Domain)
**Entry Point:** `https://aero-enterprise-suite-saas.com` (Public Landing)

The registration process is a multi-step wizard designed to capture all necessary information before provisioning resources.

*   **Step 1: Account Type** (`/register`)
    *   User selects between "Individual" or "Company" account types.
*   **Step 2: Details** (`/register/details`)
    *   User provides Name, Email, Phone, and desired **Subdomain** (e.g., `acme`).
    *   System checks subdomain availability immediately.
*   **Step 3: Verification** (`/register/verify-email` & `/register/verify-phone`)
    *   **Email:** System sends an OTP to the provided email. User must verify to proceed.
    *   **Phone:** System sends an OTP to the provided phone number.
*   **Step 4: Plan Selection** (`/register/plan`)
    *   User selects a subscription plan (e.g., Basic, Pro, Enterprise).
*   **Step 5: Payment** (`/register/payment`)
    *   User enters payment details via Stripe or SSLCommerz.
    *   Trial activation is handled here if applicable.
*   **Step 6: Provisioning Queue** (`/register/provisioning/{tenant}`)
    *   User is shown a "Building your workspace..." screen.
    *   **Backend Action:** The `ProvisionTenant` job is dispatched.
        *   Creates Tenant Database (`tenant_{uuid}`).
        *   Runs Migrations (Schema setup).
        *   Seeds Default Roles (Super Admin, Employee, etc.).
    *   Frontend polls `/provisioning/{tenant}/status` for completion.
    *   **Completion:** Redirects user to their new domain: `http://acme.platform.com/admin-setup`.

### 2. Tenant Setup (Tenant Domain)
**Context:** `http://{tenant}.platform.com` (Isolated Tenant Environment)

Once provisioning is complete, the user is redirected to their specific subdomain to create their administrative account.

*   **Admin Account Creation** (`/admin-setup`)
    *   **Security:** Route is only accessible if the tenant has no admin user yet.
    *   **Action:** User creates their username and password.
    *   **System:** Creates the user record in the *tenant database* and assigns the **Super Administrator** role.
    *   **Redirect:** Sends user to `/login`.

### 3. Tenant Onboarding (First Login)
**Context:** Authenticated User on Tenant Domain

Upon first login, the `RequireTenantOnboarding` middleware intercepts the request and forces the user through a setup wizard.

*   **Step 1: Welcome** (`/onboarding`)
    *   Introduction to the platform.
*   **Step 2: Company Info**
    *   User fills in organization details (Address, Tax ID, etc.).
*   **Step 3: Branding**
    *   Upload Logo, Favicon, and set primary brand colors.
*   **Step 4: Team Invitation**
    *   Invite initial team members via email.
*   **Step 5: Module Configuration**
    *   Enable/Disable specific modules (HR, CRM, Projects) based on needs.
*   **Completion:**
    *   System flags onboarding as `complete`.
    *   User is released to the main Dashboard.

### 4. Operational Usage (End User)
**Context:** Daily usage of the ERP system.

*   **Authentication:**
    *   Users log in at `http://{tenant}.platform.com/login`.
    *   Auth is handled by auth.php using the `web` guard (Tenant User).
*   **Dashboard:**
    *   Central hub showing widgets and stats relevant to enabled modules.
*   **Modules:**
    *   **HR:** Employee management, leave, attendance.
    *   **Projects:** Task management, milestones.
    *   **CRM:** Leads, customers, opportunities.
    *   **Finance:** Invoices, expenses.
*   **Role-Based Access:**
    *   Access to modules is controlled by the `role_module_access` table.
    *   Menu items are dynamically filtered based on the user's role.

### 5. Platform Administration (Super Admin)
**Context:** `https://admin.platform.com` (Central Management)

Platform administrators manage the SaaS infrastructure itself.

*   **Authentication:**
    *   Login at `https://admin.platform.com/login`.
    *   Uses `landlord` guard (separate `landlord_users` table in central DB).
*   **Tenant Management:**
    *   View all tenants, manage domains, suspend/activate tenants.
    *   Direct database access/management.
*   **Plans & Billing:**
    *   Create/Edit subscription plans.
    *   View global revenue and subscription status.
*   **System Health:**
    *   Monitor queues, cache, and server performance.
    *   View audit logs and error reports.

### Architecture Summary

| Component | Domain | Database | Auth Guard | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Platform** | `www.domain.com` | Central | N/A | Landing, Registration, Marketing |
| **Admin** | `admin.domain.com` | Central | `landlord` | Tenant Management, Billing, System Health |
| **Tenant** | `{tenant}.domain.com` | Tenant DB | `web` | ERP Modules, User Data, Daily Operations |

### Key Workflows

1.  **Registration:** Public -> `Register` -> `Provisioning Job` -> `Tenant DB Created`.
2.  **Onboarding:** `Admin Setup` -> `Login` -> `Onboarding Wizard` -> `Dashboard`.
3.  **Access Control:** `Role` + `Module Access` -> `Dynamic Menu` -> `Feature Access`.
