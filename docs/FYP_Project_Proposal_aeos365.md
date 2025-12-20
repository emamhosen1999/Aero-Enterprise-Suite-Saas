# Project Proposal

## aeos365: A Modular Enterprise Platform with SaaS and Standalone Distribution
### *Implementing Dual-Deployment Architecture using Monorepo Design Patterns, Multi-Tenant Database Isolation, and Hierarchical Role-Module Access Control*

---

## **Cover Page**

| | |
|---|---|
| **Project Title** | aeos365: A Modular Enterprise Platform with SaaS and Standalone Distribution |
| **Submitted By** | [Student Name 1], [Student Name 2], [Student Name 3], [Student Name 4] |
| **Student IDs** | [ID1], [ID2], [ID3], [ID4] |
| **Program** | Bachelor of Science in Computer Science and Engineering |
| **Department** | Department of Computer Science and Engineering |
| **Institution** | Uttara University, Dhaka, Bangladesh |
| **Submission Date** | [Month, Year] |
| **Supervisor** | [Supervisor Name], [Designation] |

---

## **Executive Summary**

This proposal presents **aeos365**, a novel enterprise software platform that addresses fundamental limitations in existing ERP/SaaS solutions through three key technical innovations:

1. **Dual-Deployment Architecture:** A single codebase that deploys as either multi-tenant SaaS or standalone single-tenant product—unprecedented in the Laravel ecosystem.

2. **Hierarchical Role-Module Access Control (HRMAC):** A four-level authorization system (Module → SubModule → Component → Action) replacing traditional flat permission models, enabling subscription-aware access control.

3. **Monorepo Package Composition:** Independent Composer packages that can be selectively composed into different product configurations (Aero HRM, Aero CRM, Aero ERP) from shared source code.

The platform leverages cutting-edge technologies including Laravel 11's modern PHP 8.2+ features, React 18's concurrent rendering, Inertia.js 2's hybrid SPA architecture, and OpenAI-powered contextual assistance.

**Keywords:** Multi-tenancy, SaaS Architecture, Monorepo, RBAC, Laravel, React, Inertia.js, Database Isolation, AI Assistant

---

## **1. Introduction**

### 1.1 Background and Context

The global Enterprise Resource Planning (ERP) software market, valued at $54.76 billion in 2022, is projected to reach $123.41 billion by 2030, with a CAGR of 11.0% (Grand View Research, 2023). This growth is driven by digital transformation initiatives, cloud adoption, and the increasing need for integrated business processes.

However, the enterprise software landscape presents a significant paradox:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE ENTERPRISE SOFTWARE PARADOX                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   LARGE ENTERPRISES              vs.              SMEs (90% of businesses) │
│   ─────────────────                               ──────────────────────── │
│   ✓ Can afford SAP/Oracle                         ✗ Cannot afford $100K+   │
│   ✓ Have IT departments                           ✗ Limited technical staff│
│   ✓ 6-18 month implementations                    ✗ Need immediate value   │
│   ✓ Custom integrations                           ✗ Use disconnected tools │
│                                                                             │
│                         THE ACCESSIBILITY GAP                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Problem Statement

Through systematic analysis of existing solutions, we identify five fundamental limitations:

| Problem | Technical Root Cause | Business Impact |
|---------|---------------------|-----------------|
| **P1: Vendor Lock-in** | Proprietary APIs, closed ecosystems | Migration costs exceed implementation |
| **P2: Deployment Rigidity** | Architecture couples tenancy model to codebase | Cannot switch between SaaS/on-premise |
| **P3: Coarse-grained Authorization** | Flat permission models (user → permissions) | Cannot align access with subscription tiers |
| **P4: Integration Complexity** | Point-to-point connections, no unified data model | 30-40% IT budget on integration (Gartner) |
| **P5: AI Assistance Gap** | Chatbots trained on generic data | Cannot provide domain-specific guidance |

### 1.3 Research Questions

This project addresses the following research questions:

> **RQ1:** How can a single codebase support both multi-tenant SaaS and standalone single-tenant deployments without architectural compromise?

> **RQ2:** How can hierarchical module access control enable subscription-aware feature gating while maintaining RBAC principles?

> **RQ3:** How can monorepo design patterns enable flexible product composition from shared enterprise modules?

> **RQ4:** How can AI assistants be integrated to provide contextual, domain-aware user guidance?

### 1.4 Novel Contributions

| Contribution | Innovation | Differentiation from Existing Work |
|--------------|------------|-----------------------------------|
| **Dual-Mode Tenancy** | Runtime tenancy detection via environment configuration | Existing solutions require separate codebases |
| **HRMAC System** | Four-level access hierarchy with scope modifiers | Traditional RBAC uses flat permission sets |
| **Composer Package Composition** | Path-based package linking with selective installation | Monolithic ERPs cannot be decomposed |
| **Codebase-Trained AI** | Assistant trained on platform's own documentation and code | Generic chatbots lack domain context |

---

## **2. Proposed Solution: Technical Architecture**

We propose **aeos365** (Aero Enterprise Operating System 365)—a modular enterprise platform implementing novel architectural patterns to solve the identified problems.

### 2.1 High-Level Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              aeos365 PLATFORM ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            PRESENTATION LAYER                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  React 18 + HeroUI Components + Tailwind CSS 4                          │    │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐   │    │   │
│  │  │  │Dashboard │ │  HRM UI  │ │  CRM UI  │ │Finance UI│ │ aero-assist │   │    │   │
│  │  │  │Components│ │Components│ │Components│ │Components│ │  Chat UI    │   │    │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────────┘   │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  │                                      │                                           │   │
│  │                              Inertia.js v2 Bridge                                │   │
│  │                    (Server-Side Routing + Client-Side Rendering)                 │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                            APPLICATION LAYER                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐    │   │
│  │  │  Laravel 11 (PHP 8.2+)                                                   │    │   │
│  │  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────────┐   │    │   │
│  │  │  │  Controllers   │ │  Form Requests │ │  Inertia Response Builder  │   │    │   │
│  │  │  └────────────────┘ └────────────────┘ └────────────────────────────┘   │    │   │
│  │  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────────────────┐   │    │   │
│  │  │  │  Middleware    │ │   Policies     │ │  API Resources (JSON:API)  │   │    │   │
│  │  │  │ (HRMAC Check)  │ │ (Ownership)    │ │  (External Integrations)   │   │    │   │
│  │  │  └────────────────┘ └────────────────┘ └────────────────────────────┘   │    │   │
│  │  └─────────────────────────────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                             DOMAIN LAYER (Packages)                              │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │   │
│  │  │aero-core  │ │aero-      │ │aero-hrm   │ │aero-crm   │ │aero-      │          │   │
│  │  │───────────│ │platform   │ │───────────│ │───────────│ │finance    │          │   │
│  │  │• Auth     │ │───────────│ │• Employee │ │• Contact  │ │───────────│          │   │
│  │  │• User     │ │• Tenancy  │ │• Attend.  │ │• Lead     │ │• Account  │          │   │
│  │  │• HRMAC    │ │• Billing  │ │• Leave    │ │• Deal     │ │• Journal  │          │   │
│  │  │• Settings │ │• Domain   │ │• Payroll  │ │• Pipeline │ │• Ledger   │          │   │
│  │  │• Audit    │ │• Plans    │ │• Recruit  │ │• Campaign │ │• Invoice  │          │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘          │   │
│  │  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐          │   │
│  │  │aero-ims   │ │aero-pos   │ │aero-      │ │aero-dms   │ │aero-assist│          │   │
│  │  │───────────│ │───────────│ │project    │ │───────────│ │───────────│          │   │
│  │  │• Warehouse│ │• Terminal │ │───────────│ │• Documents│ │• AI Chat  │          │   │
│  │  │• Stock    │ │• Receipt  │ │• Projects │ │• Versions │ │• RAG      │          │   │
│  │  │• Barcode  │ │• Payment  │ │• Tasks    │ │• Workflow │ │• Embeddings│         │   │
│  │  │• Valuation│ │• Offline  │ │• Sprints  │ │• Signatures│ │• Context │          │   │
│  │  └───────────┘ └───────────┘ └───────────┘ └───────────┘ └───────────┘          │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                         │                                              │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐   │
│  │                          INFRASTRUCTURE LAYER                                    │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  │   │
│  │  │  MySQL 8    │ │   Redis     │ │  Laravel    │ │  Laravel    │ │ OpenAI/   │  │   │
│  │  │  (Tenant    │ │  (Cache +   │ │  Horizon    │ │  Reverb     │ │ Local LLM │  │   │
│  │  │  Databases) │ │   Session)  │ │  (Queues)   │ │ (WebSocket) │ │  (Ollama) │  │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Dual-Deployment Architecture (Novel Contribution)

The core innovation is a **runtime-configurable tenancy system** that switches between SaaS and Standalone modes based on environment configuration:

```php
// Simplified Dual-Mode Detection Algorithm
class TenancyModeResolver
{
    public function resolve(): TenancyMode
    {
        if (config('aeos.mode') === 'saas') {
            // Multi-tenant: Identify tenant from subdomain
            $tenant = $this->identifyTenantFromRequest();
            $this->initializeTenantContext($tenant);
            return TenancyMode::SAAS;
        }
        
        // Standalone: Single organization, no tenant switching
        return TenancyMode::STANDALONE;
    }
}
```

**Technical Comparison:**

| Aspect | SaaS Mode | Standalone Mode |
|--------|-----------|-----------------|
| **Tenant Identification** | Subdomain parsing (`acme.aeos365.com`) | None (implicit single tenant) |
| **Database Strategy** | Database-per-tenant (complete isolation) | Single database |
| **Configuration Source** | `apps/saas-host/.env` | `apps/standalone-host/.env` |
| **Required Packages** | `aero-core` + `aero-platform` + modules | `aero-core` + modules (no platform) |
| **Billing Integration** | Laravel Cashier + Stripe | External/disabled |
| **Domain Management** | Dynamic subdomain + custom domain mapping | Static domain |

### 2.3 Hierarchical Role-Module Access Control (HRMAC)

Traditional RBAC associates users with roles, and roles with permissions:

```
Traditional RBAC: User → Role → [Permission₁, Permission₂, ..., Permissionₙ]
```

This flat model cannot express:
- Subscription-tier feature gating
- Hierarchical module access
- Cascading permissions
- Scope-limited access (own/team/department/all)

**HRMAC (Our Approach):**

```
HRMAC: User → Role → ModuleAccess[] → {Level, Scope, Constraints}

Where ModuleAccess = {
    module: "HRM" | "CRM" | "Finance" | ...,
    submodule?: "Payroll" | "Recruitment" | ...,
    component?: "SalaryProcessing" | "JobPosting" | ...,
    action?: "view" | "create" | "update" | "delete" | "approve",
    scope: "all" | "own" | "team" | "department",
    constraints?: { department_id?: int, ... }
}
```

**Access Resolution Algorithm:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     HRMAC ACCESS RESOLUTION FLOW                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Request: User wants to "approve" in "HRM.Payroll.SalaryProcessing"        │
│                                                                             │
│   Step 1: Check Plan Access (Subscription Gate)                             │
│   ────────────────────────────────────────────                              │
│   Does tenant's plan include HRM module?                                    │
│   └── NO → Access Denied (403: Upgrade Required)                            │
│   └── YES → Continue                                                        │
│                                                                             │
│   Step 2: Check Role-Module Access (Authorization)                          │
│   ─────────────────────────────────────────────                             │
│   Find user's role(s) → Check roleModuleAccess entries                      │
│                                                                             │
│   Priority Resolution (first match wins):                                   │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │ 1. Exact Action Match                                               │  │
│   │    role.access("HRM.Payroll.SalaryProcessing.approve") → ✓ Allow    │  │
│   │                                                                     │  │
│   │ 2. Component-Level Access (cascades to all actions)                 │  │
│   │    role.access("HRM.Payroll.SalaryProcessing") → ✓ Allow           │  │
│   │                                                                     │  │
│   │ 3. SubModule-Level Access (cascades to all components)              │  │
│   │    role.access("HRM.Payroll") → ✓ Allow                            │  │
│   │                                                                     │  │
│   │ 4. Module-Level Access (cascades to all submodules)                 │  │
│   │    role.access("HRM") → ✓ Allow                                    │  │
│   │                                                                     │  │
│   │ 5. No Match → ✗ Deny                                               │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│   Step 3: Apply Scope Filter (Data Visibility)                              │
│   ──────────────────────────────────────────────                            │
│   scope = "own" → WHERE created_by = $userId                                │
│   scope = "team" → WHERE team_id IN $userTeamIds                            │
│   scope = "department" → WHERE department_id = $userDeptId                  │
│   scope = "all" → No filter                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Database Schema for HRMAC:**

```sql
-- Role-Module Access Table (replaces traditional permissions)
CREATE TABLE role_module_access (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role_id BIGINT NOT NULL,
    
    -- Hierarchical access path
    module VARCHAR(50) NOT NULL,           -- e.g., "HRM"
    submodule VARCHAR(50) NULL,            -- e.g., "Payroll" (NULL = all)
    component VARCHAR(50) NULL,            -- e.g., "SalaryProcessing" (NULL = all)
    action VARCHAR(20) NULL,               -- e.g., "approve" (NULL = all)
    
    -- Scope modifier
    scope ENUM('all', 'own', 'team', 'department') DEFAULT 'own',
    
    -- Optional constraints (JSON)
    constraints JSON NULL,
    
    -- Metadata
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    UNIQUE KEY unique_access (role_id, module, submodule, component, action)
);

-- Indexes for fast access resolution
CREATE INDEX idx_role_module ON role_module_access(role_id, module);
CREATE INDEX idx_module_hierarchy ON role_module_access(module, submodule, component);
```

### 2.4 Monorepo Package Composition

The platform uses **Composer path repositories** to link packages during development while enabling independent distribution:

```json
// apps/saas-host/composer.json
{
    "require": {
        "aero/core": "*",
        "aero/platform": "*",    // SaaS-only
        "aero/hrm": "*",
        "aero/crm": "*",
        "aero/finance": "*"
    },
    "repositories": [
        { "type": "path", "url": "../../packages/aero-core" },
        { "type": "path", "url": "../../packages/aero-platform" },
        { "type": "path", "url": "../../packages/aero-hrm" },
        { "type": "path", "url": "../../packages/aero-crm" },
        { "type": "path", "url": "../../packages/aero-finance" }
    ]
}

// apps/standalone-host/composer.json (Aero HRM Product)
{
    "require": {
        "aero/core": "*",
        "aero/hrm": "*"
        // No platform package - standalone mode
    }
}
```

**Product Composition Matrix:**

| Package | Aero HRM | Aero CRM | Aero ERP | SaaS Platform |
|---------|:--------:|:--------:|:--------:|:-------------:|
| `aero-core` | ✓ | ✓ | ✓ | ✓ |
| `aero-platform` | ✗ | ✗ | ✗ | ✓ |
| `aero-hrm` | ✓ | ○ | ✓ | ✓ |
| `aero-crm` | ○ | ✓ | ✓ | ✓ |
| `aero-finance` | ○ | ○ | ✓ | ✓ |
| `aero-ims` | ✗ | ✗ | ✓ | ✓ |
| `aero-project` | ○ | ○ | ✓ | ✓ |
| `aero-assist` | ○ | ○ | ✓ | ✓ |

*Legend: ✓ = Included, ✗ = Not available, ○ = Optional add-on*

### 2.5 AI Assistant Architecture (aero-assist)

The AI assistant uses **Retrieval-Augmented Generation (RAG)** trained on the platform's codebase:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     AERO-ASSIST RAG ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   User Query: "How do I approve a leave request?"                           │
│                           │                                                  │
│                           ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  1. EMBEDDING GENERATION                                            │  │
│   │     Query → OpenAI text-embedding-ada-002 → Vector [1536 dims]      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                           │                                                  │
│                           ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  2. VECTOR SIMILARITY SEARCH                                        │  │
│   │     Query Vector → pgvector/Meilisearch → Top-K Relevant Chunks     │  │
│   │                                                                     │  │
│   │     Knowledge Base Sources:                                         │  │
│   │     • Platform documentation (Markdown)                              │  │
│   │     • Code comments and PHPDoc blocks                               │  │
│   │     • User manual chapters                                          │  │
│   │     • FAQ database                                                  │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                           │                                                  │
│                           ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  3. CONTEXT INJECTION                                               │  │
│   │     System Prompt + Retrieved Context + User Query → LLM            │  │
│   │                                                                     │  │
│   │     System: "You are aero-assist, an AI assistant for aeos365..."   │  │
│   │     Context: [LeaveController docs] [Approval workflow] [UI guide]  │  │
│   │     Query: "How do I approve a leave request?"                      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                           │                                                  │
│                           ▼                                                  │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │  4. RESPONSE GENERATION (GPT-4 / Ollama Local)                      │  │
│   │     "To approve a leave request:                                    │  │
│   │      1. Navigate to HRM → Leave Management → Pending Requests       │  │
│   │      2. Click on the request to view details                        │  │
│   │      3. Click 'Approve' or 'Reject' with optional comments..."      │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## **3. Objectives**

### 3.1 Primary Objectives

1. **Unified Business Platform:** Design and implement an integrated enterprise solution consolidating 19+ functional modules under a single authentication and authorization framework.

2. **Dual-Deployment Architecture:** Create a monorepo structure supporting both multi-tenant SaaS hosting and standalone single-tenant distribution from the same codebase.

3. **Product-Based Distribution:** Package modules into marketable products (Aero HRM, Aero CRM, Aero ERP) with tiered pricing, add-on modules, and upgrade paths.

4. **Multi-Tenant Architecture:** Implement secure tenant isolation using subdomain-based identification with dedicated database instances per tenant for SaaS mode.

5. **Modular Subscription Model:** Develop a flexible licensing system where organizations can subscribe to specific modules based on operational needs.

6. **Four-Level RBAC System:** Implement granular access control following the hierarchy: Module → SubModule → Component → Action, using a Role-Module Access system.

7. **AI-Powered Assistance:** Integrate an intelligent assistant (aero-assist) trained on the platform's codebase and documentation to guide users and perform analytical tasks.

8. **Modern Technology Stack:** Utilize contemporary frameworks (Laravel 11, React 18, Inertia.js 2) to ensure maintainability, performance, and developer productivity.

### 3.2 Secondary Objectives

1. **Self-Service Onboarding:** Enable organizations to register, configure, and begin using the platform without vendor intervention.

2. **White-Label Capability:** Support custom branding, themes, and domain mapping for enterprise clients and distribution partners.

3. **API-First Design:** Expose RESTful APIs for all core functionality, enabling third-party integrations and mobile application development.

4. **Comprehensive Audit Trails:** Maintain detailed activity logs for compliance, debugging, and security forensics.

5. **Scalable Infrastructure:** Design for horizontal scaling to support growth from single-tenant deployments to thousands of concurrent organizations.

---

## **4. Scope of the Project**

### 4.1 Deployment Modes

#### Mode 1: SaaS Platform (aeos365 Cloud)

| Aspect | Description |
|--------|-------------|
| **Host Application** | `apps/saas-host` |
| **Tenancy** | Multi-tenant with subdomain identification (e.g., `acme.aeos365.com`) |
| **Database** | Separate database per tenant for complete isolation |
| **Infrastructure** | Managed cloud hosting with automatic scaling |
| **Updates** | Automatic, vendor-managed updates |
| **Target Users** | Organizations preferring OpEx model, minimal IT overhead |

#### Mode 2: Standalone Products (Self-Hosted)

| Product | Description |
|---------|-------------|
| **Aero HRM** | Complete Human Resource Management with optional add-ons |
| **Aero CRM** | Customer Relationship Management with sales pipeline |
| **Aero ERP** | Complete enterprise suite with all modules |

| Aspect | Description |
|--------|-------------|
| **Host Application** | `apps/standalone-host` |
| **Tenancy** | Single-tenant (one organization per installation) |
| **Database** | Single database on customer infrastructure |
| **Infrastructure** | Customer-managed (on-premises, private cloud, VPS) |
| **Updates** | Manual updates via Composer |

### 4.2 Functional Modules

The platform encompasses the following core modules:

| # | Module | Package Name | Description |
|---|--------|--------------|-------------|
| 1 | Human Resource Management | `aero-hrm` | Employee lifecycle, attendance, leave, payroll, recruitment, performance |
| 2 | Customer Relationship Management | `aero-crm` | Lead capture, contact management, deal pipeline, sales forecasting |
| 3 | Enterprise Resource Planning | `aero-erp` | Procurement, sales orders, manufacturing, supply chain |
| 4 | Project Management | `aero-project` | Project planning, task management, Gantt charts, time tracking |
| 5 | Accounting & Finance | `aero-finance` | Chart of accounts, general ledger, AP/AR, bank reconciliation |
| 6 | Inventory Management | `aero-ims` | Warehouse management, stock movements, barcode integration |
| 7 | Point of Sale (POS) | `aero-pos` | Retail POS terminals, receipt printing, offline mode |
| 8 | Supply Chain Management | `aero-scm` | Logistics, carrier integration, route optimization |
| 9 | Document Management | `aero-dms` | File storage, version control, document workflows |
| 10 | Quality Management | `aero-quality` | Quality control inspections, non-conformance reports |
| 11 | Compliance Management | `aero-compliance` | Regulatory framework, policy documentation, audit scheduling |
| 12 | AI Assistant | `aero-assist` | Intelligent assistant for user guidance and task automation |

### 4.3 Technical Stack (Deep Dive)

#### 4.3.1 Technology Selection Rationale

| Layer | Technology | Version | Selection Criteria |
|-------|------------|---------|-------------------|
| **Backend Framework** | Laravel | 11.x | PHP 8.2+ features, mature ecosystem, excellent multi-tenancy support |
| **Frontend Framework** | React | 18.x | Concurrent rendering, Suspense, large ecosystem, component reusability |
| **Bridge Layer** | Inertia.js | 2.x | Eliminates API layer complexity, SSR routing with SPA experience |
| **UI Components** | HeroUI | 2.x | Modern React components, Tailwind-based, dark mode support |
| **CSS Framework** | Tailwind CSS | 4.x | Utility-first, JIT compilation, design system consistency |
| **Database** | MySQL | 8.x | JSON support, CTEs, window functions, proven scalability |
| **Cache Layer** | Redis | 7.x | Sub-millisecond latency, pub/sub, tenant-aware key prefixing |
| **Queue System** | Laravel Horizon | 5.x | Redis-backed, real-time monitoring, auto-scaling workers |
| **WebSocket** | Laravel Reverb | 1.x | Native Laravel WebSocket server, presence channels |
| **Search Engine** | Meilisearch | 1.x | Typo-tolerant, faceted search, sub-50ms queries |
| **AI/LLM** | OpenAI API / Ollama | GPT-4 / Llama3 | RAG implementation, local fallback option |

#### 4.3.2 Backend Architecture Patterns

```php
// Service Layer Pattern Example (aero-hrm package)
namespace Aero\HRM\Services;

class PayrollService
{
    public function __construct(
        private readonly EmployeeRepository $employees,
        private readonly SalaryCalculator $calculator,
        private readonly TaxService $taxService,
        private readonly AuditLogger $audit
    ) {}

    public function processMonthlySalary(int $month, int $year): PayrollBatch
    {
        return DB::transaction(function () use ($month, $year) {
            $employees = $this->employees->getActiveWithSalaryStructure();
            
            $batch = PayrollBatch::create([
                'month' => $month,
                'year' => $year,
                'status' => PayrollStatus::Processing,
            ]);

            foreach ($employees as $employee) {
                $salary = $this->calculator->calculate($employee, $month, $year);
                $tax = $this->taxService->calculateDeductions($salary);
                
                PayrollEntry::create([
                    'batch_id' => $batch->id,
                    'employee_id' => $employee->id,
                    'gross_salary' => $salary->gross,
                    'deductions' => $tax->total,
                    'net_salary' => $salary->gross - $tax->total,
                ]);
            }

            $this->audit->log('payroll.processed', $batch);
            
            return $batch->refresh();
        });
    }
}
```

**Key Patterns Implemented:**

| Pattern | Purpose | Implementation |
|---------|---------|----------------|
| **Repository Pattern** | Abstract data access, enable testing | `EmployeeRepository`, `LeaveRepository` |
| **Service Layer** | Encapsulate business logic | `PayrollService`, `LeaveApprovalService` |
| **Observer Pattern** | Decouple side effects | `EmployeeObserver`, `LeaveObserver` |
| **Strategy Pattern** | Interchangeable algorithms | `TaxCalculationStrategy`, `LeaveAccrualStrategy` |
| **Specification Pattern** | Complex query composition | `ActiveEmployeeSpecification` |
| **Event Sourcing** | Audit trail, state reconstruction | `LeaveRequestEvents`, `PayrollEvents` |

#### 4.3.3 Frontend Architecture Patterns

```jsx
// Component Composition Pattern (React 18)
// resources/js/Pages/HRM/Employees/EmployeeList.jsx

import { usePage, router } from '@inertiajs/react';
import { Deferred } from '@inertiajs/react';
import { Table, Skeleton, Chip } from '@heroui/react';
import { useOptimisticUpdate } from '@/hooks/useOptimisticUpdate';

export default function EmployeeList() {
    const { employees, departments, stats } = usePage().props;
    
    // Deferred props with skeleton loading (Inertia v2)
    return (
        <Layout>
            {/* Stats load independently with skeleton */}
            <Deferred data="stats" fallback={<StatsCardsSkeleton />}>
                <StatsCards stats={stats} />
            </Deferred>
            
            {/* Main table with optimistic updates */}
            <EmployeeTable 
                employees={employees}
                onStatusChange={handleOptimisticStatusChange}
            />
        </Layout>
    );
}

// Custom Hook: Optimistic Updates with Rollback
function useOptimisticUpdate(endpoint) {
    const [optimisticData, setOptimisticData] = useState(null);
    
    const mutate = async (id, changes) => {
        const previousData = optimisticData;
        setOptimisticData(prev => ({ ...prev, ...changes })); // Optimistic
        
        try {
            await router.patch(endpoint, { id, ...changes });
        } catch (error) {
            setOptimisticData(previousData); // Rollback on failure
            throw error;
        }
    };
    
    return { data: optimisticData, mutate };
}
```

**Frontend Patterns:**

| Pattern | Purpose | Implementation |
|---------|---------|----------------|
| **Compound Components** | Flexible component APIs | `<Table.Header>`, `<Table.Body>`, `<Table.Row>` |
| **Render Props** | Shared stateful logic | `<DataFetcher render={data => ...}>` |
| **Custom Hooks** | Reusable stateful logic | `useFilters`, `usePagination`, `useOptimisticUpdate` |
| **Context Providers** | Global state without prop drilling | `ThemeProvider`, `AuthProvider` |
| **Suspense Boundaries** | Graceful loading states | Deferred props, lazy components |
| **Error Boundaries** | Fault isolation | Per-module error boundaries |

#### 4.3.4 Database Schema Design Principles

```sql
-- Tenant-Aware Table Design (aero-hrm)
-- All tenant tables automatically scoped by stancl/tenancy

-- Polymorphic Activity Log for Audit Trail
CREATE TABLE activity_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    
    -- Polymorphic subject (what was affected)
    subject_type VARCHAR(255) NOT NULL,      -- 'App\Models\Employee'
    subject_id BIGINT NOT NULL,
    
    -- Polymorphic causer (who did it)
    causer_type VARCHAR(255) NULL,
    causer_id BIGINT NULL,
    
    -- Event details
    event VARCHAR(50) NOT NULL,              -- 'created', 'updated', 'deleted'
    properties JSON NULL,                     -- { old: {...}, new: {...} }
    
    -- Metadata
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for fast querying
    INDEX idx_subject (subject_type, subject_id),
    INDEX idx_causer (causer_type, causer_id),
    INDEX idx_event_date (event, created_at)
);

-- Hierarchical Department Structure (Nested Set Model)
CREATE TABLE departments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    parent_id BIGINT NULL,
    
    -- Nested Set columns for O(1) subtree queries
    lft INT NOT NULL,
    rgt INT NOT NULL,
    depth INT NOT NULL DEFAULT 0,
    
    -- Metadata
    manager_id BIGINT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    
    FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE CASCADE,
    INDEX idx_nested_set (lft, rgt)
);

-- Efficient Leave Balance Tracking (Materialized View Pattern)
CREATE TABLE leave_balances (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    employee_id BIGINT NOT NULL,
    leave_type_id BIGINT NOT NULL,
    year INT NOT NULL,
    
    -- Pre-calculated balances (updated by triggers/jobs)
    entitled_days DECIMAL(5,2) NOT NULL,
    carried_forward DECIMAL(5,2) DEFAULT 0,
    used_days DECIMAL(5,2) DEFAULT 0,
    pending_days DECIMAL(5,2) DEFAULT 0,  -- Approved but not yet taken
    available_days DECIMAL(5,2) GENERATED ALWAYS AS 
        (entitled_days + carried_forward - used_days - pending_days) STORED,
    
    UNIQUE KEY unique_balance (employee_id, leave_type_id, year),
    INDEX idx_employee_year (employee_id, year)
);
```

#### 4.3.5 Security Implementation

| Security Layer | Implementation | Protection Against |
|----------------|----------------|---------------------|
| **Authentication** | Laravel Fortify + Sanctum (session + API tokens) | Unauthorized access |
| **Password Hashing** | Argon2id (PHP 8.2+ default) | Password cracking |
| **CSRF Protection** | Double-submit cookie pattern | Cross-site request forgery |
| **XSS Prevention** | React's automatic escaping + CSP headers | Cross-site scripting |
| **SQL Injection** | Eloquent ORM parameterized queries | SQL injection |
| **Rate Limiting** | Redis-backed throttling (60 req/min default) | Brute force, DoS |
| **Encryption** | AES-256-GCM for sensitive fields | Data breaches |
| **Audit Logging** | Immutable activity logs with IP/UA | Forensics, compliance |
| **Tenant Isolation** | Database-per-tenant + query scoping | Cross-tenant data leak |
| **2FA** | TOTP (Google Authenticator compatible) | Account compromise |

```php
// Tenant Isolation Middleware
class EnsureTenantIsolation
{
    public function handle(Request $request, Closure $next)
    {
        if (tenancy()->initialized) {
            // Verify requested resource belongs to current tenant
            $resourceTenantId = $request->route()->parameter('tenant_id');
            
            if ($resourceTenantId && $resourceTenantId !== tenant('id')) {
                abort(403, 'Cross-tenant access denied');
            }
        }
        
        return $next($request);
    }
}
```

#### 4.3.6 Performance Optimization Strategies

| Strategy | Implementation | Expected Improvement |
|----------|----------------|---------------------|
| **Query Optimization** | Eager loading, query scoping, proper indexing | 80% reduction in N+1 queries |
| **Response Caching** | Redis cache with tenant-prefixed keys | 10x faster repeat requests |
| **Asset Optimization** | Vite bundling, code splitting, lazy loading | 60% smaller initial bundle |
| **Database Connection Pooling** | Persistent connections, connection pooling | 50% reduction in connection overhead |
| **Deferred Props** | Inertia v2 deferred loading | Faster Time to Interactive |
| **Queue Processing** | Horizon with auto-scaling workers | Non-blocking operations |
| **CDN Integration** | Static assets via CloudFlare/S3 | Global edge caching |

```php
// Example: Tenant-Aware Caching
class CacheService
{
    public function remember(string $key, int $ttl, Closure $callback)
    {
        $tenantKey = $this->tenantPrefix() . $key;
        
        return Cache::remember($tenantKey, $ttl, $callback);
    }
    
    private function tenantPrefix(): string
    {
        return tenancy()->initialized 
            ? 'tenant_' . tenant('id') . ':' 
            : 'global:';
    }
}
```

---

## **5. Methodology**

The development follows an **Agile-Scrum methodology** adapted for academic project constraints while maintaining industry-standard practices.

### 5.1 Understanding Agile Methodology

**Agile** is a software development philosophy based on the **Agile Manifesto (2001)** that emphasizes iterative development, collaboration, and responsiveness to change.

#### 5.1.1 Agile Core Values

| Agile Values | Over |
|--------------|------|
| **Individuals and interactions** | Processes and tools |
| **Working software** | Comprehensive documentation |
| **Customer collaboration** | Contract negotiation |
| **Responding to change** | Following a rigid plan |

#### 5.1.2 Agile Principles Applied to This Project

| Principle | Application in aeos365 |
|-----------|------------------------|
| Deliver working software frequently | 2-week sprint cycles with deployable increments |
| Welcome changing requirements | Modular architecture allows easy feature additions |
| Business and developers work together | Regular stakeholder demos and feedback sessions |
| Build around motivated individuals | Self-organizing team with clear responsibilities |
| Face-to-face conversation | Daily standups and weekly planning sessions |
| Working software as progress measure | Each sprint delivers testable functionality |
| Sustainable development pace | Realistic sprint goals, no overtime culture |
| Continuous attention to excellence | Code reviews, testing, refactoring practices |
| Simplicity | Focus on MVP features before advanced functionality |

### 5.2 Scrum Framework

**Scrum** is an Agile framework that provides specific roles, events, and artifacts to implement Agile principles effectively.

#### 5.2.1 Scrum Roles

| Role | Team Member | Responsibility |
|------|-------------|----------------|
| **Product Owner** | Supervisor / Team Lead | Defines features, prioritizes backlog, represents stakeholders, accepts completed work |
| **Scrum Master** | Rotating among team | Facilitates Scrum events, removes blockers, ensures process adherence |
| **Development Team** | All 4 Students | Self-organizing, cross-functional team delivering increments |

#### 5.2.2 Scrum Events (Ceremonies)

| Event | Frequency | Duration | Purpose |
|-------|-----------|----------|---------|
| **Sprint** | Every 2 weeks | 2 weeks | Time-boxed iteration to deliver working increment |
| **Sprint Planning** | Start of sprint | 2-4 hours | Select backlog items, define sprint goal, plan tasks |
| **Daily Standup** | Every day | 15 minutes | Sync progress: What did I do? What will I do? Any blockers? |
| **Sprint Review** | End of sprint | 1-2 hours | Demo completed work to supervisor/stakeholders |
| **Sprint Retrospective** | End of sprint | 1 hour | Reflect: What went well? What to improve? Action items |

#### 5.2.3 Scrum Artifacts

| Artifact | Description | Tool Used |
|----------|-------------|-----------|
| **Product Backlog** | Prioritized list of all features, requirements, and enhancements | GitHub Projects / Notion |
| **Sprint Backlog** | Subset of product backlog items committed for current sprint | GitHub Issues |
| **Increment** | Sum of all completed backlog items—working, tested software | Git releases |
| **Definition of Done** | Criteria for considering work complete (coded, reviewed, tested, documented) | Team agreement |

#### 5.2.4 Scrum Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SCRUM PROCESS FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PRODUCT BACKLOG           SPRINT (2 weeks)              INCREMENT      │
│  ┌───────────────┐        ┌─────────────────┐         ┌──────────────┐  │
│  │ All Features  │ Sprint │                 │  Sprint │   Working    │  │
│  │ & User Stories│Planning│  Development    │  Review │   Software   │  │
│  │ (Prioritized) │───────►│                 │────────►│  (Tested &   │  │
│  │               │        │  Daily Standups │         │  Documented) │  │
│  │ ☐ Feature A   │        │  (15 min/day)   │         └──────────────┘  │
│  │ ☐ Feature B   │        │                 │               │           │
│  │ ☐ Feature C   │        └─────────────────┘               │           │
│  │ ☐ Feature D   │               │                          │           │
│  │     ...       │               ▼                          │           │
│  └───────────────┘        ┌─────────────────┐               │           │
│         ▲                 │  Retrospective  │               │           │
│         │                 │ ─────────────── │               │           │
│         │                 │ What went well? │               │           │
│         │                 │ What to improve?│               │           │
│         └─────────────────│ Action items    │◄──────────────┘           │
│                           └─────────────────┘                            │
│                                                                          │
│  ════════════════════════════════════════════════════════════════════   │
│                    REPEAT FOR EACH SPRINT (13 SPRINTS TOTAL)             │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Sprint Planning for aeos365

The project is divided into **13 two-week sprints** over 6 months:

| Sprint | Weeks | Phase | Focus Areas | Deliverables |
|--------|-------|-------|-------------|--------------|
| **Sprint 1** | 1-2 | Planning | Requirements, Architecture | SRS Document, System Design |
| **Sprint 2** | 3-4 | Foundation | Project setup, Database design | Monorepo structure, DB schema |
| **Sprint 3** | 5-6 | Foundation | Multi-tenancy, Authentication | Tenant isolation, Login/Register |
| **Sprint 4** | 7-8 | Foundation | RBAC Framework | Role-Module Access system |
| **Sprint 5** | 9-10 | Modules | HRM - Employee Management | Employee CRUD, Departments |
| **Sprint 6** | 11-12 | Modules | HRM - Attendance & Leave | Time tracking, Leave requests |
| **Sprint 7** | 13-14 | Modules | HRM - Payroll | Salary processing, Payslips |
| **Sprint 8** | 15-16 | Modules | CRM - Contacts & Leads | Contact management, Lead capture |
| **Sprint 9** | 17-18 | Modules | CRM - Deals & Pipeline | Sales pipeline, Deal tracking |
| **Sprint 10** | 19-20 | Modules | Finance - Core Accounting | Chart of accounts, GL entries |
| **Sprint 11** | 21-22 | Modules | Additional Modules | IMS, Project, POS (basic) |
| **Sprint 12** | 23-24 | Integration | AI Assistant, Integration | aero-assist, Cross-module testing |
| **Sprint 13** | 25-26 | Deployment | Production, Documentation | Deployment, User manual, Report |

### 5.4 Development Phases Summary

| Phase | Duration | Sprints | Activities |
|-------|----------|---------|------------|
| **Phase 1: Planning** | 2 weeks | Sprint 1 | Requirements gathering, architecture design, technology selection |
| **Phase 2: Foundation** | 6 weeks | Sprints 2-4 | Core infrastructure, multi-tenancy, authentication, RBAC framework |
| **Phase 3: Module Development** | 14 weeks | Sprints 5-11 | Iterative development of HRM, CRM, Finance, and other modules |
| **Phase 4: Integration & AI** | 2 weeks | Sprint 12 | Cross-module integration, aero-assist implementation |
| **Phase 5: Deployment** | 2 weeks | Sprint 13 | Production deployment, documentation, final presentation |

**Total Duration:** 26 weeks (approximately 6 months)

### 5.5 Why Agile-Scrum for This Project?

| Benefit | Explanation |
|---------|-------------|
| **Iterative Delivery** | Working software every 2 weeks enables early feedback and course correction |
| **Risk Mitigation** | Issues discovered early in sprints, not at project end |
| **Flexibility** | Requirements can evolve based on supervisor feedback |
| **Transparency** | Daily standups and sprint reviews keep all stakeholders informed |
| **Quality Focus** | Definition of Done ensures tested, documented code |
| **Team Collaboration** | Cross-functional work reduces silos and knowledge gaps |
| **Academic Alignment** | Sprint demos align with academic milestone reviews |

### 5.6 Comparison with Other Methodologies

| Methodology | Description | Why Not Chosen |
|-------------|-------------|----------------|
| **Waterfall** | Sequential phases (Requirements → Design → Development → Testing) | No flexibility for changes, late testing discovers issues too late |
| **Kanban** | Continuous flow without fixed iterations | Less structure for academic project milestones |
| **XP (Extreme Programming)** | Heavy emphasis on pair programming, TDD | Resource-intensive for 4-person team |
| **Spiral** | Risk-driven iterative approach | Overly complex for this project scope |
| **Scrum (Chosen)** | Time-boxed sprints, defined roles and ceremonies | ✅ Best balance of structure and flexibility |

### 5.7 Development Practices

| Practice | Implementation |
|----------|----------------|
| **Version Control** | Git with GitHub, GitFlow branching (main, develop, feature/*, release/*) |
| **Code Review** | Pull request-based workflow with mandatory peer reviews before merge |
| **Testing** | PHPUnit for backend unit/feature tests, component testing for React frontend |
| **CI/CD** | GitHub Actions for automated testing on every push |
| **Documentation** | Inline PHPDoc, API documentation (Swagger/OpenAPI), user guides |
| **Pair Programming** | Complex features developed in pairs for knowledge sharing |
| **Refactoring** | Continuous code improvement each sprint |

### 5.8 Tools and Environment

| Category | Tools | Purpose |
|----------|-------|---------|
| **IDE** | Visual Studio Code | PHP/React development with extensions |
| **Local Development** | Laragon (Windows), Docker | Consistent development environment |
| **Database Client** | TablePlus, phpMyAdmin | Database management and queries |
| **API Testing** | Postman, Insomnia | API endpoint testing and documentation |
| **Design** | Figma | UI/UX mockups and prototyping |
| **Project Management** | GitHub Projects, Notion | Sprint planning, backlog management, documentation |
| **Communication** | Discord/Slack, WhatsApp | Daily standups, async communication |
| **Version Control** | Git, GitHub | Source code management, pull requests |
| **CI/CD** | GitHub Actions | Automated testing and deployment |

### 5.9 Sample Sprint Backlog (Sprint 5: HRM - Employee Management)

| ID | User Story | Tasks | Estimate | Assigned To |
|----|------------|-------|----------|-------------|
| US-5.1 | As an HR Manager, I can add new employees | Create Employee model, migration, controller | 8 hours | Student 3 |
| US-5.2 | As an HR Manager, I can view employee list | EmployeeList page, EmployeeTable component | 6 hours | Student 2 |
| US-5.3 | As an HR Manager, I can edit employee details | AddEditEmployeeForm, validation | 6 hours | Student 2 |
| US-5.4 | As an Admin, I can manage departments | Department CRUD, DepartmentSelector | 8 hours | Student 3 |
| US-5.5 | As an Admin, I can manage designations | Designation CRUD, hierarchy support | 6 hours | Student 1 |
| US-5.6 | As a User, I can view my profile | Profile page, ProfileForm | 4 hours | Student 4 |
| | **Sprint Goal:** Complete Employee Management module | **Total:** | 38 hours | |

### 5.10 Definition of Done (DoD)

A feature/user story is considered **DONE** when:

- [ ] Code is written and follows project coding standards (PSR-12, ESLint)
- [ ] Unit tests written and passing (minimum 80% coverage for new code)
- [ ] Feature tests written for API endpoints
- [ ] Code reviewed and approved by at least one team member
- [ ] No critical or high-severity bugs
- [ ] Documentation updated (PHPDoc, README if applicable)
- [ ] Merged to develop branch
- [ ] Deployed to staging environment
- [ ] Demo-ready for Sprint Review

---

## **6. Expected Outcomes**

### 6.1 Deliverables

1. **Fully Functional SaaS Platform** (aeos365 Cloud) with multi-tenant architecture
2. **Standalone Products** (Aero HRM, Aero CRM, Aero ERP) ready for self-hosted deployment
3. **12+ Integrated Modules** covering core enterprise functions
4. **AI-Powered Assistant** (aero-assist) for user guidance
5. **Comprehensive Documentation** including user manual and API documentation
6. **Source Code Repository** with well-structured monorepo architecture

### 6.2 Key Features

| Feature | Description |
|---------|-------------|
| **Dual-Deployment** | Same codebase supports SaaS and standalone modes |
| **Module Isolation** | Each module as independent Composer package |
| **Four-Level RBAC** | Granular access control (Module → SubModule → Component → Action) |
| **Multi-Tenancy** | Secure tenant isolation with separate databases |
| **Self-Service** | Organization registration without vendor intervention |
| **White-Label** | Custom branding and domain mapping |
| **API-First** | RESTful APIs for all functionality |
| **AI Assistant** | Intelligent user guidance and task automation |

### 6.3 Benefits

1. **For SMEs:** Affordable, modular enterprise software with flexible deployment options
2. **For Large Enterprises:** Scalable platform with white-label and customization capabilities
3. **For Developers:** Modern tech stack with clean architecture and comprehensive documentation
4. **For Academia:** Reference implementation for SaaS architecture and modular design

---

## **7. Literature Review and Gap Analysis**

### 7.1 Theoretical Foundations

#### 7.1.1 Multi-Tenancy Architectural Patterns

Bezemer and Zaidman (2010) define multi-tenancy with three key properties: single software instance, high configurability, and transparent resource sharing. The literature identifies three primary implementation strategies:

| Strategy | Isolation Level | Resource Efficiency | Complexity | Use Case |
|----------|----------------|---------------------|------------|----------|
| **Shared Everything** | Low | High | Low | Low-security SaaS |
| **Shared Database, Separate Schema** | Medium | Medium | Medium | Mid-market SaaS |
| **Separate Database** | High | Low | High | Enterprise, regulated industries |

**aeos365 Contribution:** We implement a novel **adaptive tenancy strategy** where the isolation level is runtime-configurable:

```
if (config('aeos.mode') === 'saas')
    → Database-per-tenant (maximum isolation)
else
    → Single database (standalone deployment)
```

This addresses the gap identified by Krebs et al. (2012) where "tenancy models are typically hardcoded, preventing deployment flexibility."

#### 7.1.2 Role-Based Access Control Evolution

The NIST RBAC model (Ferraiolo et al., 2001) defines four levels:

| RBAC Level | Features | Limitation |
|------------|----------|------------|
| **RBAC₀** | Users, roles, permissions | Flat, no hierarchy |
| **RBAC₁** | Role hierarchies | Cannot express subscription tiers |
| **RBAC₂** | Constraints (SoD) | No data scope limitations |
| **RBAC₃** | Combined (RBAC₁ + RBAC₂) | Still permission-centric |

**aeos365 Contribution:** Our **Hierarchical Role-Module Access Control (HRMAC)** extends RBAC₃ with:

1. **Module-Centric Access:** Roles map to module hierarchies, not flat permissions
2. **Subscription Gating:** Plan-level access checked before role-level
3. **Scope Modifiers:** Data visibility (all/own/team/department) per access grant
4. **Cascading Inheritance:** Higher-level grants implicitly include children

This addresses gaps identified by Kuhn et al. (2010): "Current RBAC implementations lack support for hierarchical resource structures common in enterprise applications."

#### 7.1.3 Monorepo Architecture Patterns

Google's monorepo (Potvin & Levenberg, 2016) demonstrates benefits at scale:

| Benefit | Description | aeos365 Application |
|---------|-------------|---------------------|
| **Atomic Changes** | Cross-package changes in single commit | HRM + Finance payroll integration |
| **Code Sharing** | Reuse without versioning complexity | Shared UI components, utilities |
| **Consistent Tooling** | Unified CI/CD, linting, testing | Single `composer.json` + `package.json` |
| **Simplified Dependencies** | No diamond dependency problems | Path-based Composer repositories |

**aeos365 Contribution:** We adapt monorepo patterns (typically seen in Google/Facebook-scale) to the Laravel/Composer ecosystem using path repositories, enabling:

- Selective package composition (Aero HRM vs. Aero ERP)
- Independent versioning for distribution
- Shared test infrastructure

### 7.2 Competitive Analysis (Gap Analysis)

#### 7.2.1 Detailed Feature Comparison Matrix

| Feature | SAP S/4HANA | Microsoft Dynamics 365 | Zoho One | Odoo | ERPNext | **aeos365** |
|---------|:-----------:|:----------------------:|:--------:|:----:|:-------:|:-----------:|
| **Multi-tenant SaaS** | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| **Standalone Deployment** | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Same Codebase Dual-Mode** | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| **Database Isolation (SaaS)** | ✓ | ✓ | ✗ | ✗ | N/A | ✓ |
| **Modular Pricing** | Partial | Partial | ✓ | ✓ | ✓ | ✓ |
| **Open Source Core** | ✗ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Hierarchical RBAC (4-level)** | ✓ | ✓ | ✗ | ✗ | ✗ | **✓** |
| **Subscription-Aware Access** | ✗ | ✗ | ✗ | ✗ | ✗ | **✓** |
| **AI Assistant (Codebase-Trained)** | Partial | ✓ | ✗ | ✗ | ✗ | **✓** |
| **White-Label Support** | ✓ | ✗ | ✗ | ✓ | ✓ | ✓ |
| **Modern Tech Stack (2024)** | ✗ | ✗ | ✗ | Partial | ✗ | **✓** |
| **SME Accessibility (< $100/mo)** | ✗ | ✗ | ✓ | ✓ | ✓ | ✓ |

*Legend: ✓ = Full support, ✗ = Not supported, Partial = Limited support*

#### 7.2.2 Technical Architecture Comparison

| Aspect | Odoo | ERPNext | **aeos365** |
|--------|------|---------|-------------|
| **Backend Language** | Python 3 | Python 3 | PHP 8.2+ |
| **Backend Framework** | Custom ORM | Frappe | Laravel 11 |
| **Frontend Framework** | Owl (custom) | Vue.js 2 | React 18 |
| **Database** | PostgreSQL | MariaDB | MySQL 8 |
| **Tenancy Package** | Custom | N/A (single-tenant) | stancl/tenancy |
| **API Style** | JSON-RPC | REST | REST + Inertia |
| **Real-time** | Longpoll | Socket.io | Laravel Reverb |
| **Search** | PostgreSQL FTS | Frappe Search | Meilisearch |
| **Queue System** | Celery | Redis Queue | Laravel Horizon |
| **Learning Curve** | Steep | Very Steep | Moderate (Laravel ecosystem) |

**Key Differentiator:** aeos365 leverages the Laravel ecosystem—the most popular PHP framework with extensive documentation, packages, and community support—while competitors use custom or less-documented frameworks.

#### 7.2.3 Identified Research Gaps

| Gap | Current State | aeos365 Solution |
|-----|---------------|------------------|
| **G1: Deployment Lock-in** | SaaS vendors don't offer on-premise; on-premise solutions lack cloud option | Dual-mode architecture from single codebase |
| **G2: Coarse Authorization** | Flat permissions don't align with module subscriptions | HRMAC with subscription-aware gating |
| **G3: AI Context Gap** | Generic AI assistants lack domain knowledge | RAG trained on platform's own documentation |
| **G4: SME Accessibility** | Enterprise ERP too expensive; SME tools lack integration | Modular pricing, progressive capability |
| **G5: Technology Debt** | Legacy stacks (Python 2, jQuery) in major ERPs | Modern stack (Laravel 11, React 18, Tailwind 4) |

### 7.3 Technology Justification with Benchmarks

#### 7.3.1 Backend Framework Comparison

| Metric | Laravel 11 | Django 5 | Spring Boot 3 | Node.js (Express) |
|--------|:----------:|:--------:|:-------------:|:-----------------:|
| **Requests/sec (JSON API)** | 12,000 | 8,500 | 45,000 | 25,000 |
| **Memory Usage** | 35 MB | 45 MB | 150 MB | 25 MB |
| **Time to First Response** | 15 ms | 20 ms | 50 ms (cold) | 10 ms |
| **ORM Maturity** | ★★★★★ | ★★★★★ | ★★★★☆ | ★★★☆☆ |
| **Multi-Tenancy Packages** | stancl/tenancy | django-tenants | Custom | Custom |
| **Developer Availability** | High (PHP 80%+) | Medium | Medium | High |
| **Learning Curve** | Low | Medium | High | Low |

**Selection Rationale:** Laravel offers the best balance of performance, developer productivity, and multi-tenancy support through mature packages like stancl/tenancy.

#### 7.3.2 Frontend Framework Comparison

| Metric | React 18 | Vue 3 | Angular 17 | Svelte 5 |
|--------|:--------:|:-----:|:----------:|:--------:|
| **Bundle Size (Hello World)** | 42 KB | 34 KB | 130 KB | 2 KB |
| **Rendering Performance** | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★★ |
| **Concurrent Rendering** | ✓ | ✗ | ✗ | ✗ |
| **Ecosystem Size (npm packages)** | 1.2M+ | 300K+ | 200K+ | 50K+ |
| **Inertia.js Integration** | ★★★★★ | ★★★★★ | ✗ | ★★★☆☆ |
| **HeroUI Compatible** | ✓ | ✗ | ✗ | ✗ |
| **Job Market Demand** | #1 | #2 | #3 | Growing |

**Selection Rationale:** React 18's concurrent rendering, mature ecosystem, and excellent Inertia.js integration make it ideal for data-heavy enterprise applications.

### 7.4 Related Academic Research

| Reference | Contribution | Relation to aeos365 |
|-----------|--------------|---------------------|
| Krebs et al. (2012) | Multi-tenancy patterns in SaaS | Informs our database isolation strategy |
| Aulbach et al. (2011) | Tenant-aware query processing | Applied in tenant-scoped Eloquent queries |
| Chong & Carraro (2006) | SaaS architecture patterns | Foundation for dual-deployment design |
| Sandhu et al. (1996) | RBAC model formalization | Extended in our HRMAC system |
| Vaswani et al. (2017) | Transformer architecture (RAG basis) | Powers aero-assist embeddings |
| Potvin & Levenberg (2016) | Monorepo at scale | Adapted for Laravel/Composer ecosystem |

---

## **8. Resource Requirements**

### 8.1 Hardware Requirements

| Component | Specification |
|-----------|---------------|
| Development Machines | Intel i5/AMD Ryzen 5 or higher, 16GB RAM, 256GB SSD |
| Development Server | 4 vCPU, 8GB RAM, 100GB SSD |
| Production Server (SaaS) | 8 vCPU, 32GB RAM, 500GB SSD (scalable) |

### 8.2 Software Requirements

| Category | Software |
|----------|----------|
| Operating System | Windows 11 / Ubuntu 22.04 LTS |
| Web Server | Nginx / Apache |
| Database | MySQL 8.x |
| Runtime | PHP 8.2+, Node.js 20+ |
| Development | VS Code, Git, Docker |

### 8.3 Team Composition

| Role | Responsibility |
|------|----------------|
| **Student 1** | Backend Development, Database Design, Multi-Tenancy |
| **Student 2** | Frontend Development, UI/UX, React Components |
| **Student 3** | Module Development (HRM, CRM), Testing |
| **Student 4** | Module Development (Finance, Inventory), AI Integration |

---

## **9. Project Timeline (Gantt Chart)**

### 9.1 Sprint-Based Timeline (13 Sprints × 2 Weeks = 26 Weeks)

```
Sprint/Phase          |Wk1-2|Wk3-4|Wk5-6|Wk7-8|Wk9-10|Wk11-12|Wk13-14|Wk15-16|Wk17-18|Wk19-20|Wk21-22|Wk23-24|Wk25-26|
                      | S1  | S2  | S3  | S4  |  S5  |  S6   |  S7   |  S8   |  S9   |  S10  |  S11  |  S12  |  S13  |
----------------------|-----|-----|-----|-----|------|-------|-------|-------|-------|-------|-------|-------|-------|
Planning & Design     | ████|     |     |     |      |       |       |       |       |       |       |       |       |
Foundation Setup      |     | ████|     |     |      |       |       |       |       |       |       |       |       |
Multi-Tenancy & Auth  |     |     | ████|     |      |       |       |       |       |       |       |       |       |
RBAC Framework        |     |     |     | ████|      |       |       |       |       |       |       |       |       |
HRM - Employees       |     |     |     |     | ████ |       |       |       |       |       |       |       |       |
HRM - Attendance/Leave|     |     |     |     |      | ████  |       |       |       |       |       |       |       |
HRM - Payroll         |     |     |     |     |      |       | ████  |       |       |       |       |       |       |
CRM - Contacts/Leads  |     |     |     |     |      |       |       | ████  |       |       |       |       |       |
CRM - Deals/Pipeline  |     |     |     |     |      |       |       |       | ████  |       |       |       |       |
Finance - Accounting  |     |     |     |     |      |       |       |       |       | ████  |       |       |       |
Other Modules (IMS,   |     |     |     |     |      |       |       |       |       |       | ████  |       |       |
Project, POS)         |     |     |     |     |      |       |       |       |       |       |       |       |       |
AI Assistant &        |     |     |     |     |      |       |       |       |       |       |       | ████  |       |
Integration           |     |     |     |     |      |       |       |       |       |       |       |       |       |
Deployment & Docs     |     |     |     |     |      |       |       |       |       |       |       |       | ████  |
```

### 9.2 Monthly Overview

```
                      | Month 1   | Month 2   | Month 3   | Month 4   | Month 5   | Month 6   |
                      | (Wk 1-4)  | (Wk 5-8)  | (Wk 9-12) | (Wk 13-16)| (Wk 17-20)| (Wk 21-26)|
----------------------|-----------|-----------|-----------|-----------|-----------|-----------|
PHASE 1: Planning     | ████████  |           |           |           |           |           |
PHASE 2: Foundation   | ████████  | ████████  |           |           |           |           |
PHASE 3: HRM Module   |           | ████████  | ████████  | ████████  |           |           |
PHASE 3: CRM Module   |           |           |           | ████████  | ████████  |           |
PHASE 3: Finance      |           |           |           |           | ████████  | ████████  |
PHASE 3: Other        |           |           |           |           |           | ████████  |
PHASE 4: AI & Integ.  |           |           |           |           |           | ████████  |
PHASE 5: Deployment   |           |           |           |           |           | ████████  |
```

### 9.3 Scrum Ceremonies Schedule (Recurring)

| Day | Time | Event | Duration | Participants |
|-----|------|-------|----------|--------------|
| **Monday (Week 1)** | 10:00 AM | Sprint Planning | 2-3 hours | All team + Supervisor |
| **Daily (Mon-Fri)** | 9:30 AM | Daily Standup | 15 minutes | All team |
| **Friday (Week 2)** | 2:00 PM | Sprint Review (Demo) | 1-2 hours | All team + Supervisor |
| **Friday (Week 2)** | 4:00 PM | Sprint Retrospective | 1 hour | All team |

### 9.4 Key Milestones

| Milestone | Sprint | Date (Approx.) | Deliverable |
|-----------|--------|----------------|-------------|
| **M1: Project Kickoff** | Sprint 1 | Week 2 | Requirements document, Architecture design |
| **M2: Foundation Complete** | Sprint 4 | Week 8 | Multi-tenancy working, Auth + RBAC functional |
| **M3: HRM Module Complete** | Sprint 7 | Week 14 | Full HRM with Employees, Attendance, Payroll |
| **M4: CRM Module Complete** | Sprint 9 | Week 18 | Full CRM with Contacts, Leads, Deals |
| **M5: Finance & Others** | Sprint 11 | Week 22 | Finance module + basic IMS, Project, POS |
| **M6: AI Integration** | Sprint 12 | Week 24 | aero-assist functional, Integration tested |
| **M7: Final Delivery** | Sprint 13 | Week 26 | Production deployment, Documentation, Presentation |

---

## **10. Risk Analysis and Mitigation**

### 10.1 Technical Risks

| Risk ID | Risk Description | Probability | Impact | Mitigation Strategy | Contingency Plan |
|---------|-----------------|-------------|--------|---------------------|------------------|
| **TR-1** | Multi-tenancy database isolation causes performance overhead | Medium | High | Connection pooling, caching layer, query optimization | Fallback to shared schema for lower tiers |
| **TR-2** | Inertia.js SSR complexity with large data sets | Medium | Medium | Implement pagination, deferred props, infinite scroll | Client-side rendering fallback |
| **TR-3** | AI embedding costs exceed budget | Low | Medium | Local Ollama deployment option, caching embeddings | Reduce RAG chunk size, use cheaper models |
| **TR-4** | Package dependency conflicts in monorepo | Medium | Medium | Strict version pinning, isolated test environments | Fallback to single-app architecture |
| **TR-5** | Real-time features (WebSocket) scalability | Low | High | Laravel Reverb horizontal scaling, Redis pub/sub | Polling fallback for less critical updates |

### 10.2 Project Risks

| Risk ID | Risk Description | Probability | Impact | Mitigation Strategy |
|---------|-----------------|-------------|--------|---------------------|
| **PR-1** | Scope creep due to feature requests | High | High | Strict sprint scope, backlog prioritization, defer to Phase 2 |
| **PR-2** | Team member unavailability | Medium | High | Cross-training, documented code, pair programming |
| **PR-3** | Learning curve for new technologies | Medium | Medium | Dedicated spike sprints, external tutorials, mentor support |
| **PR-4** | Integration testing complexity | Medium | Medium | CI/CD automation, feature flags, staged rollouts |
| **PR-5** | Thesis/exam conflicts | High | Medium | Buffer time in schedule, parallel work streams |

### 10.3 Risk Probability-Impact Matrix

```
                        IMPACT
                 Low      Medium      High
            ┌─────────┬─────────┬─────────┐
      High  │         │  PR-1   │  PR-5   │
            │         │  PR-3   │         │
            ├─────────┼─────────┼─────────┤
PROBABILITY │  TR-3   │  TR-1   │  PR-2   │
   Medium   │         │  TR-2   │  TR-4   │
            ├─────────┼─────────┼─────────┤
      Low   │         │         │  TR-5   │
            │         │         │         │
            └─────────┴─────────┴─────────┘
```

---

## **11. Expected Outcomes and Evaluation Metrics**

### 11.1 Functional Deliverables

| Deliverable | Description | Success Criteria |
|-------------|-------------|------------------|
| **D1: SaaS Platform** | Multi-tenant aeos365 Cloud | 3+ tenants operating simultaneously without data leakage |
| **D2: Standalone Products** | Aero HRM, Aero CRM installable packages | Single-command installation, functional within 5 minutes |
| **D3: Core Modules (6)** | HRM, CRM, Finance, IMS, Project, POS | CRUD operations, business logic, 80%+ test coverage |
| **D4: HRMAC System** | Four-level access control | Access resolution < 5ms, correct cascading verified |
| **D5: AI Assistant** | aero-assist chatbot | Contextually accurate responses for 80%+ of queries |
| **D6: Documentation** | User manual, API docs, code docs | Complete coverage of all public APIs |

### 11.2 Non-Functional Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| **Response Time (P95)** | < 200ms | Laravel Telescope, New Relic |
| **Concurrent Users** | 100+ per tenant | Load testing (k6, Artillery) |
| **Test Coverage** | > 80% | PHPUnit coverage reports |
| **Lighthouse Score** | > 90 (Performance) | Google Lighthouse CI |
| **Accessibility** | WCAG 2.1 AA | Axe accessibility testing |
| **Security Scan** | Zero critical vulnerabilities | OWASP ZAP, Snyk |
| **Database Query Time** | < 50ms (P95) | MySQL slow query log |
| **Bundle Size** | < 500KB (initial) | Vite bundle analyzer |

### 11.3 Academic Contributions

| Contribution | Type | Potential Publication Venue |
|--------------|------|----------------------------|
| **Dual-Deployment Architecture Pattern** | Design Pattern | IEEE ICSE, ACM SIGSOFT |
| **HRMAC: Hierarchical Role-Module Access Control** | Access Control Model | ACM CCS, USENIX Security |
| **Monorepo Patterns for Laravel Ecosystem** | Best Practices | Laravel News, PHP Architecture Blog |
| **RAG-based Domain-Specific AI Assistant** | Applied ML | NeurIPS Workshop, EMNLP |

---

## **12. Conclusion and Research Significance**

### 12.1 Summary of Contributions

The **aeos365** platform makes four novel contributions to enterprise software architecture:

| # | Contribution | Innovation | Impact |
|---|--------------|------------|--------|
| **C1** | **Dual-Deployment Architecture** | Single codebase serving both SaaS and standalone deployments via runtime configuration | Eliminates deployment lock-in, enables hybrid cloud strategies |
| **C2** | **Hierarchical Role-Module Access Control (HRMAC)** | Four-level access hierarchy (Module → SubModule → Component → Action) with scope modifiers | Subscription-aware authorization, granular data visibility |
| **C3** | **Laravel Monorepo Package Composition** | Composer path repositories enabling selective module installation | Product variants (HRM, CRM, ERP) from shared codebase |
| **C4** | **Codebase-Trained AI Assistant** | RAG architecture trained on platform documentation and code | Domain-aware user guidance, reduced training costs |

### 12.2 Addressing Research Questions

| Research Question | Answer |
|-------------------|--------|
| **RQ1:** How to support dual deployment from single codebase? | Runtime tenancy detection via environment configuration, conditional package loading |
| **RQ2:** How to enable subscription-aware access control? | HRMAC with plan-level gating before role-level authorization |
| **RQ3:** How to enable flexible product composition? | Composer path repositories with selective package requirements |
| **RQ4:** How to provide domain-aware AI assistance? | RAG with vector embeddings of platform documentation |

### 12.3 Practical Significance

| Stakeholder | Benefit |
|-------------|---------|
| **SMEs in Bangladesh** | Affordable, locally-deployable enterprise software (< $100/month) |
| **Enterprise Clients** | White-label capability, data sovereignty, regulatory compliance |
| **SaaS Entrepreneurs** | Reference implementation for building multi-tenant Laravel applications |
| **Laravel Community** | Open-source patterns for monorepo, tenancy, hierarchical RBAC |
| **Academic Community** | Novel architectural patterns for further research |

### 12.4 Future Research Directions

| Direction | Description | Potential Impact |
|-----------|-------------|------------------|
| **Microservices Migration** | Decompose monolith into event-driven microservices | Infinite scalability, technology heterogeneity |
| **Edge Deployment** | Standalone mode optimized for edge/IoT devices | Offline-first manufacturing, remote sites |
| **Federated Learning** | Cross-tenant analytics without data sharing | Privacy-preserving business intelligence |
| **Blockchain Audit Trail** | Immutable, verifiable audit logs | Regulatory compliance, fraud prevention |
| **Natural Language Interfaces** | Voice commands, conversational ERP | Accessibility, hands-free operation |

### 12.5 Final Remarks

The aeos365 project demonstrates that enterprise-grade software architecture is achievable within academic project constraints by leveraging modern frameworks, established design patterns, and systematic engineering practices. The dual-deployment architecture, HRMAC system, and AI integration represent genuine innovations that advance the state of practice in SaaS development.

By open-sourcing the architectural patterns and implementation details, this project contributes to the broader software engineering community while delivering a functional platform that addresses real market needs for affordable, flexible enterprise software.

**This proposal outlines a feasible, technically rigorous project with clear contributions, measurable outcomes, and practical significance—demonstrating readiness for implementation.**

---

## **13. References**

### Academic Papers and Books

1. Ferraiolo, D. F., Sandhu, R., Gavrila, S., Kuhn, D. R., & Chandramouli, R. (2001). Proposed NIST standard for role-based access control. *ACM Transactions on Information and System Security (TISSEC)*, 4(3), 224-274.

2. Bezemer, C. P., & Zaidman, A. (2010). Multi-tenant SaaS applications: Maintenance dream or nightmare? *Proceedings of the Joint ERCIM Workshop on Software Evolution (EVOL) and International Workshop on Principles of Software Evolution (IWPSE)*, ACM, 88-92.

3. Krebs, R., Momm, C., & Kounev, S. (2012). Architectural concerns in multi-tenant SaaS applications. *Proceedings of the 2nd International Conference on Cloud Computing and Services Science*, SciTePress, 426-431.

4. Aulbach, S., Jacobs, D., Kemper, A., & Seibold, M. (2011). A comparison of flexible schemas for software as a service. *Proceedings of the 2011 ACM SIGMOD International Conference on Management of Data*, ACM, 881-892.

5. Chong, F., & Carraro, G. (2006). Architecture strategies for catching the long tail. *Microsoft Corporation MSDN Library*, 9-10.

6. Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *Computer*, 29(2), 38-47.

7. Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., ... & Polosukhin, I. (2017). Attention is all you need. *Advances in Neural Information Processing Systems*, 30.

8. Potvin, R., & Levenberg, J. (2016). Why Google stores billions of lines of code in a single repository. *Communications of the ACM*, 59(7), 78-87.

9. Kuhn, D. R., Coyne, E. J., & Weil, T. R. (2010). Adding attributes to role-based access control. *Computer*, 43(6), 79-81.

10. Gamma, E., Helm, R., Johnson, R., & Vlissides, J. (1994). *Design patterns: Elements of reusable object-oriented software*. Addison-Wesley.

11. Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.

12. Fowler, M. (2002). *Patterns of Enterprise Application Architecture*. Addison-Wesley.

### Industry Reports and Standards

13. Gartner. (2024). *Market Guide for Cloud ERP for Product-Centric Enterprises*. Gartner Research.

14. Grand View Research. (2023). *Enterprise Resource Planning Market Size Report, 2023-2030*. Grand View Research, Inc.

15. IDC. (2024). *Worldwide Software as a Service Forecast, 2024-2028*. International Data Corporation.

16. NIST. (2004). *Role Based Access Control (ANSI INCITS 359-2004)*. National Institute of Standards and Technology.

17. OWASP. (2023). *OWASP Top Ten Web Application Security Risks*. Open Web Application Security Project.

### Technical Documentation

18. Laravel Documentation. (2024). *Laravel 11.x - The PHP Framework for Web Artisans*. Retrieved from https://laravel.com/docs/11.x

19. React Documentation. (2024). *React 18 - A JavaScript Library for Building User Interfaces*. Retrieved from https://react.dev/

20. Inertia.js Documentation. (2024). *Inertia.js - The Modern Monolith*. Retrieved from https://inertiajs.com/

21. stancl/tenancy. (2024). *Tenancy for Laravel - Multi-tenancy Package*. Retrieved from https://tenancyforlaravel.com/docs/v3

22. Spatie. (2024). *Laravel-Permission - Associate Users with Permissions and Roles*. Retrieved from https://spatie.be/docs/laravel-permission

23. OpenAI. (2024). *OpenAI API Documentation*. Retrieved from https://platform.openai.com/docs

24. HeroUI. (2024). *HeroUI - Modern React UI Library*. Retrieved from https://heroui.com/docs

25. Tailwind CSS. (2024). *Tailwind CSS v4 Documentation*. Retrieved from https://tailwindcss.com/docs

---

## **Appendices**

### Appendix A: Detailed System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          aeos365 Platform Architecture                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         Frontend (React 18)                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────┐    │   │
│  │  │Dashboard│ │   HRM   │ │   CRM   │ │ Finance │ │ aero-assist │    │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                            Inertia.js Bridge                                │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Backend (Laravel 11)                           │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │  aero-core  │ │aero-platform│ │  aero-hrm   │ │  aero-crm   │    │   │
│  │  │  (Auth,     │ │  (Tenancy,  │ │ (Employees, │ │  (Leads,    │    │   │
│  │  │   RBAC)     │ │   Billing)  │ │   Payroll)  │ │   Deals)    │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      Database Layer (MySQL 8)                        │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │   Central   │ │  Tenant 1   │ │  Tenant 2   │ │  Tenant N   │    │   │
│  │  │  Database   │ │  Database   │ │  Database   │ │  Database   │    │   │
│  │  │ (landlord)  │ │             │ │             │ │             │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Appendix B: Monorepo Package Structure

```
aeos365/
├── apps/
│   ├── saas-host/              # Multi-tenant SaaS application
│   └── standalone-host/        # Single-tenant standalone application
│
├── packages/
│   ├── aero-core/              # Core functionality (auth, users, RBAC)
│   ├── aero-platform/          # SaaS-specific (tenancy, billing)
│   ├── aero-hrm/               # Human Resources module
│   ├── aero-crm/               # Customer Relations module
│   ├── aero-finance/           # Finance & Accounting module
│   ├── aero-ims/               # Inventory Management module
│   ├── aero-project/           # Project Management module
│   ├── aero-pos/               # Point of Sale module
│   ├── aero-scm/               # Supply Chain module
│   ├── aero-dms/               # Document Management module
│   ├── aero-quality/           # Quality Management module
│   ├── aero-compliance/        # Compliance module
│   ├── aero-assist/            # AI Assistant module
│   └── aero-ui/                # Shared UI components
│
├── config/                     # Shared configuration
├── docs/                       # Documentation
└── tests/                      # Shared test utilities
```

### Appendix C: Role-Module Access Hierarchy

```
Module (e.g., HRM)
  └── SubModule (e.g., Payroll)
        └── Component (e.g., Salary Processing)
              └── Action (e.g., view, create, approve)

Access Examples:
┌─────────────────────────────────────────────────────────────────┐
│ Role: HR Manager                                                 │
│   ├── HRM (Full Access) → All SubModules, Components, Actions   │
│                                                                  │
│ Role: Payroll Specialist                                         │
│   ├── HRM.Payroll (SubModule Access) → All Payroll Components   │
│                                                                  │
│ Role: Payroll Viewer                                             │
│   ├── HRM.Payroll.SalaryProcessing.view (Action Access)         │
└─────────────────────────────────────────────────────────────────┘
```

---

**Prepared By:**

| Name | Student ID | Signature | Date |
|------|------------|-----------|------|
| [Student 1] | [ID] | _____________ | _______ |
| [Student 2] | [ID] | _____________ | _______ |
| [Student 3] | [ID] | _____________ | _______ |
| [Student 4] | [ID] | _____________ | _______ |

**Approved By:**

| | |
|---|---|
| _________________________ | **Supervisor** |
| [Supervisor Name] | |
| [Designation] | |
| Department of Computer Science and Engineering | |
| Uttara University | |
