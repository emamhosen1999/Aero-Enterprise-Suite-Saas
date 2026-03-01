# aeos365 — Modular Enterprise Platform
## Final Year Project Proposal

---

# Chapter 1: Introduction

## 1.1 Introduction

aeos365 is a modular enterprise platform designed to unify core business operations—HR, CRM, finance, inventory, and more—under a single, flexible system. It supports both multi-tenant SaaS and self-hosted standalone deployment from a shared codebase, bridging the gap between expensive legacy ERPs and limited small-business tools.

## 1.2 Background of the Study

Enterprise Resource Planning (ERP) systems are essential for managing business operations, yet adoption remains a challenge for most organisations. Traditional solutions from vendors like SAP, Oracle, and Microsoft Dynamics require investments exceeding $100,000 with deployment timelines of 14–25 months. Cloud SaaS alternatives reduce upfront costs but lack deployment flexibility—organisations cannot easily switch between hosted and on-premises models. Small and medium enterprises (SMEs) are particularly underserved: either priced out of enterprise software or forced into fragmented point solutions that create data silos and costly integration overhead. The post-pandemic shift to remote work has further amplified demand for accessible, browser-based solutions. This project proposes aeos365 to bridge these gaps through a novel dual-deployment architecture built on modern open-source technology.

## 1.3 Problem Statement

Three core problems justify this project:

1. **Deployment Inflexibility**: Vendors enforce a single deployment model (SaaS or on-premises), leaving organisations with evolving compliance requirements—such as those starting on cloud and later needing on-premises for data sovereignty—without a clear migration path.

2. **Fragmentation vs. Monolithism**: Organisations must choose between over-bundled ERPs (purchasing the entire suite even when only specific modules are needed) or disconnected point solutions (separate HR, CRM, and accounting tools) that require costly integrations and deliver inconsistent user experiences.

3. **Limited Access Control and SME Accessibility**: Most enterprise systems provide only 2–3 permission levels, which is insufficient for fine-grained organisational policies. Enterprise pricing and implementation complexity simultaneously remain out of reach for SMEs, leaving a significant market segment underserved.

## 1.4 Objectives

1. **Dual-Deployment Architecture**: Build a single codebase supporting both multi-tenant SaaS hosting and standalone self-hosted distribution, with seamless migration paths between modes.
2. **Integrated Modular Platform**: Deliver independent functional packages (HRM, CRM, Finance, etc.) under a unified authentication and UI framework, eliminating data silos and inconsistent user experiences.
3. **Four-Level RBAC**: Implement granular access control following the hierarchy Module → SubModule → Component → Action with cascading permissions and configurable data visibility scopes.
4. **AI-Powered Assistance**: Integrate an intelligent assistant to guide users, automate analytical tasks, and provide contextual help without requiring external training resources.
5. **SME-Accessible Pricing and Onboarding**: Offer tiered subscription plans with self-service registration, enabling organisations to start with specific modules and expand incrementally.

## 1.5 Scope

1. **Deployment Modes**: Two configurations from one codebase — **SaaS** (multi-tenant, subdomain-based, dedicated database per tenant, integrated billing) and **Standalone** (single-tenant, customer-managed infrastructure, manual updates).

2. **Functional Coverage**: Eleven independent business modules — HRM, CRM, Finance, Inventory, POS, Project Management, Document Management, Quality, Compliance, Supply Chain, and an AI Assistant — plus three platform foundation packages (core, platform, UI).

3. **Out of Scope**: Native mobile applications (iOS/Android), multi-language interfaces, offline Progressive Web App mode, and blockchain audit trails are excluded from the initial release.

---

# Chapter 2: Literature Review

## 2.1 ERP Evolution and Cloud-Native Architecture

Enterprise Resource Planning has evolved from Material Requirements Planning (MRP) in the 1960s through to today's AI-integrated cloud platforms. Gartner (2024) projects the global ERP market will reach $78.4 billion by 2026, with over 65% of new implementations on cloud platforms. Traditional ERP vendors (SAP, Oracle, Microsoft Dynamics) target mid-to-large enterprises with average implementations costing $1.1 million over 14–25 months (Panorama Consulting, 2024). Cloud SaaS alternatives like Odoo and ERPNext reduce costs but still impose deployment rigidity. Odoo's 30+ module ecosystem serves SMBs competitively but suffers from UI inconsistency across modules and an enterprise paywall for advanced features. ERPNext is fully open-source with a modern REST API but has a steep learning curve and documentation gaps. Commercial platforms (Salesforce, Zoho One) offer polished interfaces and broad integrations but enforce vendor lock-in, per-user pricing, and no self-hosted option.

**Research Paper 1 — Bezemer & Zaidman (2010)**

*"Multi-Tenant SaaS Applications: Maintenance Dream or Nightmare?"* (ERCIM Workshop on Software Evolution) examines the trade-offs of multi-tenancy strategies: shared schema, shared database with separate schema, and separate database per tenant. The study concludes that the **separate-database** approach, while more infrastructure-intensive, delivers superior data isolation, compliance readiness, and per-tenant customisation potential. It also identifies that SaaS maintainability improves significantly when the tenancy layer is cleanly abstracted from business logic—a principle directly reflected in aeos365's `aero-platform` package design. This research validates the architectural decision to use a dedicated database per tenant for the SaaS deployment mode.

**Research Paper 2 — Ferraiolo & Kuhn (1992) + NIST ANSI INCITS 359-2004**

The foundational work on Role-Based Access Control (RBAC) by Ferraiolo and Kuhn, formalised as NIST ANSI INCITS 359-2004, defines Users, Roles, Permissions, and Sessions as the core model. Most commercial ERP implementations flatten this to 2–3 levels. Research on RBAC scalability documents *permission explosion* in large organisations (thousands of individual permissions required) and significant audit complexity. The aeos365 platform extends standard RBAC with a four-level hierarchy (Module → SubModule → Component → Action), cascading permissions, scope-based data visibility, and plan-based module filtering. This directly addresses the documented limitations while reducing administrative overhead.

**Research Gap Summary**: No existing solution simultaneously provides (a) dual-deployment from a single codebase with a migration path, (b) standalone modular products with optional add-ons, (c) four-level RBAC with cascading and data scopes, (d) a natively integrated AI assistant, and (e) SME-accessible self-service onboarding. aeos365 is designed specifically to close these gaps.

---

# Chapter 3: Proposed System

## 3.1 System Overview

aeos365 is a comprehensive enterprise operating system that unifies business functions under a single, cohesive platform. Its core innovation is the **dual-deployment architecture**: the same codebase operates as either a multi-tenant SaaS platform (multiple organisations sharing infrastructure with isolated databases) or as standalone single-tenant products deployed on customer infrastructure.

### 3.1.1 Design Principles

| Principle | Description |
|---|---|
| Modularity First | Each functional area is an independent Composer package, installable and removable independently |
| Separation of Concerns | Platform concerns (tenancy, billing) are cleanly separated from business logic (HRM, CRM) |
| Convention over Configuration | Sensible defaults with extensible customisation options for advanced users |
| API-First | All functionality exposed via RESTful APIs for third-party integration and extensibility |
| Security by Design | Multi-layered: tenant database isolation, four-level RBAC, and comprehensive audit logging |

### 3.1.2 Deployment Architecture

**SaaS Mode** operates as a multi-tenant platform at `{tenant}.aeos365.com`. Each tenant receives a dedicated database provisioned automatically on registration. Billing, plan management, and updates are vendor-managed.

**Standalone Mode** distributes individual products (Aero HRM, Aero CRM, Aero ERP) as Composer packages installed on customer infrastructure. A single database serves the organisation; updates are applied manually.

### 3.1.3 Module Overview

| # | Module | Package | Core Functionality |
|---|---|---|---|
| 1 | Human Resource Management | aero-hrm | Employee lifecycle, attendance, leave, payroll, recruitment, performance |
| 2 | Customer Relationship Management | aero-crm | Contacts, leads, deal pipeline, campaigns, ticketing |
| 3 | Project Management | aero-project | Tasks, agile boards, Gantt charts, time tracking |
| 4 | Accounting & Finance | aero-finance | Ledger, AP/AR, bank reconciliation, financial reporting |
| 5 | Inventory Management | aero-ims | Warehousing, stock movements, reorder automation |
| 6 | Point of Sale | aero-pos | POS terminals, receipts, payment processing, sales reporting |
| 7 | Supply Chain Management | aero-scm | Purchase orders, vendor management, logistics coordination |
| 8 | Document Management | aero-dms | File storage, versioning, workflows, digital signatures |
| 9 | Quality Management | aero-quality | Inspections, non-conformance reports, corrective actions |
| 10 | Compliance Management | aero-compliance | Policies, risk assessment, audit scheduling |
| 11 | AI Assistant | aero-assist | Contextual help, natural language queries, workflow guidance |

**Foundation Packages**: `aero-core` (auth, RBAC, audit logging), `aero-platform` (multi-tenancy, billing), `aero-ui` (shared React component library and design system).

### 3.1.4 Four-Level RBAC

Access is governed by a four-level hierarchy:

1. **Module Level** — Access to an entire functional area (e.g., HRM)
2. **SubModule Level** — Access within a module (e.g., Payroll within HRM)
3. **Component Level** — Access to a specific feature (e.g., Salary Processing)
4. **Action Level** — Specific operations (View, Create, Edit, Delete, Approve)

Permissions **cascade downward**: granting Module access automatically permits all child levels unless explicitly overridden. Each access entry carries a **data scope** (All Records / Own Records / Team Records / Department Records), enabling precise visibility control without permission explosion.

## 3.2 Technology Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Backend Framework | Laravel | 11.x | MVC, routing, ORM, queues |
| PHP Runtime | PHP | 8.2+ | Server-side processing |
| Frontend Library | React | 18.x | Component-based UI development |
| SPA Bridge | Inertia.js | 2.x | Server-side routing with SPA experience |
| UI Components | HeroUI | Latest | Pre-built React component library |
| CSS Framework | Tailwind CSS | 4.x | Utility-first responsive styling |
| Database | MySQL | 8.x | Relational data storage |
| Multi-Tenancy | stancl/tenancy | 3.x | Tenant management and database isolation |
| Authentication | Laravel Fortify | 1.x | Authentication backend |
| API Auth | Laravel Sanctum | 4.x | Token and session authentication |
| Authorization | Spatie Permission | 6.x | Role management (extended with Role-Module Access) |
| Payments | Laravel Cashier | 15.x | Stripe subscription billing |
| Caching & Sessions | Redis | Latest | Performance caching and session storage |
| Queue Management | Laravel Horizon | Latest | Background job processing and monitoring |
| Real-Time | Laravel Reverb | Latest | WebSocket communications |
| AI Integration | OpenAI API | Latest | AI assistant capabilities |
| File Storage | Laravel Filesystem | Built-in | S3 / local file management |

---

# Chapter 4: Implementation Methodology

## 4.1 Development Approach

The project follows an **Agile-Scrum methodology** with two-week sprints, adapted for a single-developer academic context. Development is iterative, with working software delivered at the end of each sprint. Code is maintained in a Git monorepo on GitHub using a GitFlow branching strategy. All PHP code is formatted with Laravel Pint to enforce consistent style.

## 4.2 Resource Requirements

### 4.2.1 Hardware

| Resource | Specification | Purpose |
|---|---|---|
| Development Machine | Core i7 / Ryzen 7, 16 GB RAM, SSD | Local development and testing |
| Local Server | Laragon (Windows) with PHP 8.2, MySQL 8, Redis | Simulates production environment |
| Staging Server | VPS — 2 vCPU, 4 GB RAM, 40 GB SSD | Pre-production testing and demo hosting |
| Production Server | Cloud VPS — 4 vCPU, 8 GB RAM | Live SaaS instance for final demonstration |

### 4.2.2 Software and Tools

| Category | Tool | Role |
|---|---|---|
| IDE | Visual Studio Code | Code editing and debugging |
| Database Client | TablePlus / phpMyAdmin | Schema inspection and management |
| API Testing | Postman | Endpoint testing and documentation |
| Version Control | Git + GitHub | Source control and history |
| UI Design | Figma | Wireframes and design reference |
| Package Management | Composer + npm | PHP and JavaScript dependency management |
| Code Formatting | Laravel Pint | Consistent PHP code style enforcement |

### 4.2.3 External Services

| Service | Provider | Purpose |
|---|---|---|
| Payment Processing | Stripe (via Laravel Cashier) | Subscription billing for SaaS mode |
| AI Capabilities | OpenAI API | Powers the aero-assist module |
| Email Delivery | Mailtrap (dev) / Mailgun (production) | Transactional emails |
| File Storage | Local (dev) / AWS S3 (production) | Document and asset storage |

### 4.2.4 Knowledge Requirements

The developer must command the following technical domains:
- Full-stack Laravel 11 + React 18 development
- Multi-tenancy configuration using stancl/tenancy
- MySQL schema design for isolated multi-tenant databases
- DevOps basics: VPS setup, Nginx, environment configuration
- OpenAI API integration for the AI assistant module

## 4.3 Implementation Phases

**Phase 1 — Planning & Design (Weeks 1–3)**
Requirements documentation, database schema design, and UI/UX wireframing are completed. The monorepo package structure (`packages/aero-*`) is scaffolded, and the host application is configured with Composer path repositories pointing to local packages.

**Phase 2 — Foundation (Weeks 4–7)**
Core infrastructure is built: multi-tenancy via stancl/tenancy, authentication via Laravel Fortify, and the four-level Role-Module Access framework. The `aero-core` and `aero-platform` packages are completed, covering tenant provisioning, user management, RBAC, audit logging, and subscription management.

**Phase 3 — Core Modules (Weeks 8–15)**
The `aero-hrm` and `aero-crm` packages are developed as the primary showcased modules. HRM covers employee lifecycle, attendance clock-in/out, leave request and approval workflows, payroll calculation, payslip generation, and performance reviews. CRM covers contacts, lead pipeline, deal management, and campaign tracking.

**Phase 4 — Extended Modules (Weeks 16–21)**
Additional modules are implemented to demonstrate platform breadth: `aero-finance` (general ledger, AP/AR), `aero-ims` (stock management and reorder alerts), `aero-pos` (point of sale terminals), and `aero-project` (task management and agile boards).

**Phase 5 — AI Integration (Weeks 22–24)**
The `aero-assist` module is built, integrating the OpenAI API to deliver an in-platform assistant capable of answering natural language queries, providing contextual help, and interpreting analytics across all modules.

**Phase 6 — Testing & Refinement (Weeks 25–27)**
PHPUnit feature and unit tests are written for all critical execution paths. Security testing covers tenant isolation, CSRF protection, and SQL injection prevention. Performance profiling is conducted and bottlenecks addressed. UI/UX is reviewed against the design system.

**Phase 7 — Documentation & Deployment (Weeks 28–29)**
A user manual, administrator guide, and developer API documentation are produced. The system is deployed to the production VPS for live demonstration and final project submission.

## 4.4 Testing Strategy

| Test Type | Tool | Scope |
|---|---|---|
| Unit Tests | PHPUnit | Service classes, models, helpers |
| Feature Tests | PHPUnit + Laravel HTTP testing | Controllers, RBAC, tenant isolation |
| API Tests | Postman Collections | All REST endpoints |
| Security Tests | Manual review + automated scans | Tenant isolation, injection, CSRF |

---

# Chapter 5: Expected Outcomes

## 5.1 Functional Platform

Upon completion, aeos365 will be a fully operational enterprise platform demonstrating the following capabilities:

### 5.1.1 SaaS Deployment

A live multi-tenant SaaS instance where organisations can self-register, receive an isolated subdomain and dedicated database, select a subscription plan, and immediately access their chosen modules. The platform handles automatic tenant provisioning, billing cycles, and module access gating based on the active plan—confirming that the proposed architecture works end-to-end without manual vendor intervention.

### 5.1.2 Standalone Products

Two standalone product packages—**Aero HRM** and **Aero CRM**—distributed as installable Composer packages. Each is deployable on a fresh server environment with a single setup sequence and includes a seeded demo dataset, validating the feasibility of the standalone distribution model as an independent product.

### 5.1.3 Core Module Functionality

All implemented modules will be fully functional end-to-end:

| Module | Key Deliverable |
|---|---|
| HRM | Complete employee lifecycle; attendance clock-in/out; leave request, approval, and balance tracking; payroll calculation and payslip generation; performance review cycle |
| CRM | Lead pipeline with stage progression; contact and account management; deal tracking with probability forecasting; activity logging |
| Finance | Chart of accounts; journal entry recording; accounts payable and receivable; basic balance sheet and income statement |
| Inventory | Warehouse and stock management; reorder point alerts; inventory valuation report |
| AI Assistant | Natural language queries answered within platform context; contextual help available across all modules |

### 5.1.4 RBAC Demonstration

A demonstrable access control system where different roles produce visibly different interfaces and permissions. The deliverable will showcase: (a) module-level gating based on subscription plan, (b) four-level permission grants with automatic cascading, and (c) data visibility scopes restricting records shown to each user—confirming the Role-Module Access design functions correctly in both SaaS and standalone deployment modes.

### 5.1.5 Technical Quality Standards

The codebase will meet the following quality benchmarks:

- PHP compliant with Laravel Pint formatting standards throughout
- PHPUnit test suite with a minimum of 80% coverage on critical service classes
- RESTful API fully documented in Postman for all implemented endpoints
- Database migrations enabling repeatable, version-controlled schema deployment
- Git history with clean, descriptive commits aligned to GitFlow conventions
- No cross-tenant data leakage confirmed by automated isolation tests

---

# Chapter 6: Project Timeline

## 6.1 Gantt Chart Overview

The project spans **29 weeks (~7 months)** across 13 two-week sprints.

| Phase | Activity | Wk 1–3 | Wk 4–7 | Wk 8–11 | Wk 12–15 | Wk 16–18 | Wk 19–21 | Wk 22–24 | Wk 25–27 | Wk 28–29 |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | Planning & Design | ████ | | | | | | | | |
| 2 | Foundation (Core + Platform) | | ████ | | | | | | | |
| 3 | HRM Module | | | ████ | ████ | | | | | |
| 3 | CRM Module | | | | ████ | | | | | |
| 4 | Extended Modules | | | | | ████ | ████ | | | |
| 5 | AI Integration | | | | | | | ████ | | |
| 6 | Testing & Refinement | | | | | | | | ████ | |
| 7 | Docs & Deployment | | | | | | | | ████ | ████ |

### Key Milestones

| Milestone | Week | Deliverable |
|---|---|---|
| M1: Project Kickoff | Week 2 | Requirements document and architecture design complete |
| M2: Foundation Complete | Week 7 | Multi-tenancy, authentication, and RBAC fully functional |
| M3: HRM Module Complete | Week 14 | Full HRM — employees, attendance, leave, payroll, performance |
| M4: CRM Module Complete | Week 16 | Full CRM — contacts, leads, deals, pipeline management |
| M5: Extended Modules | Week 21 | Finance, Inventory, POS, and Project Management functional |
| M6: AI Integration | Week 24 | aero-assist operational and integrated across all modules |
| M7: Final Delivery | Week 29 | Production deployed, fully documented, ready for presentation |

### Sprint Ceremony Schedule (Recurring)

| Day | Time | Event | Duration |
|---|---|---|---|
| Monday (Sprint Start) | 10:00 AM | Sprint Planning | 2–3 hours |
| Daily (Mon–Fri) | 9:30 AM | Daily Standup | 15 minutes |
| Friday (Sprint End) | 2:00 PM | Sprint Review / Demo | 1–2 hours |
| Friday (Sprint End) | 4:00 PM | Sprint Retrospective | 1 hour |

### Phase Duration Summary

| Phase | Weeks | Duration |
|---|---|---|
| Phase 1: Planning & Design | 1–3 | 3 weeks |
| Phase 2: Foundation | 4–7 | 4 weeks |
| Phase 3: Core Modules (HRM + CRM) | 8–16 | 9 weeks |
| Phase 4: Extended Modules | 16–21 | 6 weeks |
| Phase 5: AI Integration | 22–24 | 3 weeks |
| Phase 6: Testing & Refinement | 25–27 | 3 weeks |
| Phase 7: Documentation & Deployment | 28–29 | 2 weeks |
| **Total** | | **29 weeks** |

---

# Chapter 7: Conclusion

The aeos365 project proposes a modular enterprise platform that directly addresses three major gaps in the current enterprise software market: deployment inflexibility, fragmentation between monolithic ERPs and disconnected point solutions, and insufficient access control granularity for growing organisations and SMEs.

The dual-deployment architecture—supporting multi-tenant SaaS and standalone self-hosted products from a single Laravel 11 + React 18 codebase—represents a meaningful contribution to enterprise software design. By packaging each functional area as an independent Composer package, the platform enables organisations to adopt precisely the capabilities they need, at a price point accessible to SMEs, while retaining a clear path to comprehensive ERP functionality as they scale. The `stancl/tenancy` library, combined with a dedicated database per tenant, provides the isolation guarantees required for compliance-conscious organisations without sacrificing the operational economics of shared infrastructure.

The four-level Role-Module Access system (Module → SubModule → Component → Action) with cascading permissions and data visibility scopes advances beyond conventional RBAC implementations documented in the NIST standard and Ferraiolo & Kuhn's foundational research. It reduces administrative overhead while delivering finer-grained access governance than the 2–3 level systems common in competing products.

The integrated AI assistant (aero-assist) lowers the adoption barrier further by providing contextual, in-platform guidance without requiring extensive onboarding training or external support. Combined with self-service registration and tiered pricing, this positions aeos365 as a genuinely accessible enterprise solution for the SME market.

The project is technically grounded in a proven, industry-standard stack and is structured for delivery within seven months through Agile-Scrum practices. Upon completion, it will serve both as a functional enterprise tool and as a reference implementation for dual-deployment SaaS architecture, four-level RBAC, and modular package-based Laravel development—contributing practical patterns to the broader developer community.

---

## References

1. Bezemer, C.P., & Zaidman, A. (2010). *Multi-Tenant SaaS Applications: Maintenance Dream or Nightmare?* Proceedings of the Joint ERCIM Workshop on Software Evolution.
2. Ferraiolo, D.F., & Kuhn, D.R. (1992). *Role-Based Access Control.* 15th National Computer Security Conference.
3. NIST. (2004). *ANSI INCITS 359-2004: Role-Based Access Control.* National Institute of Standards and Technology.
4. Gartner. (2024). *Forecast: Enterprise Application Software, Worldwide, 2022–2028.* Gartner Research.
5. Panorama Consulting Group. (2024). *ERP Report: Trends in Enterprise Software.*
6. Laravel Documentation. (2024). https://laravel.com/docs/11.x
7. React Documentation. (2024). https://react.dev/
8. Inertia.js Documentation. (2024). https://inertiajs.com/
9. stancl/tenancy Documentation. (2024). https://tenancyforlaravel.com/

---

*This document is submitted as a Final Year Project Proposal for the Bachelor of Science in Computer Science and Engineering program.*
