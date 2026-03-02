export const heroStats = [
  { value: '10', label: 'Integrated Business Suites' },
  { value: '140+', label: 'Functional Submodules' },
  { value: '99.96%', label: 'Rolling 24-Month Uptime SLA' },
  { value: '38 days', label: 'Median Production Go-Live' },
];

export const platformModules = [
  {
    key: 'hrm',
    name: 'HRM',
    shortName: 'Human Resources',
    description: 'End-to-end workforce lifecycle management: employees, attendance, leave, payroll processing, recruitment pipelines, performance cycles, training programmes, and HR analytics.',
    color: 'from-blue-500 to-cyan-500',
    icon: 'people',
  },
  {
    key: 'crm',
    name: 'CRM',
    shortName: 'Customer Relations',
    description: 'Unified revenue and service management: lead pipelines, contacts, deal forecasting, activity tracking, multi-channel campaigns, SLA-governed support desk, knowledge base, and CRM analytics.',
    color: 'from-indigo-500 to-violet-500',
    icon: 'users',
  },
  {
    key: 'finance',
    name: 'Finance',
    shortName: 'Accounting & Finance',
    description: 'Full-spectrum financial management: chart of accounts, general ledger, AP/AR, bank reconciliation, multi-entity budgeting, fixed assets, tax filing, financial statements, and audit trails.',
    color: 'from-emerald-600 to-teal-500',
    icon: 'bank',
  },
  {
    key: 'project',
    name: 'Projects',
    shortName: 'Project Management',
    description: 'Integrated project delivery: Gantt timelines, task boards, sprint management, resource allocation, risk registers, project financials, document control, and executive reporting.',
    color: 'from-purple-500 to-pink-500',
    icon: 'project',
  },
  {
    key: 'ims',
    name: 'Inventory',
    shortName: 'Inventory & Warehouse',
    description: 'Precision inventory control: multi-warehouse management, stock movement tracking, barcode operations, automated reorder planning, serial and batch traceability, and cycle counts.',
    color: 'from-amber-500 to-orange-500',
    icon: 'cube',
  },
  {
    key: 'scm',
    name: 'Supply Chain',
    shortName: 'Procurement & SCM',
    description: 'End-to-end procurement orchestration: vendor onboarding, RFQ and award workflows, purchase order management, inbound quality inspection, freight tracking, and vendor scorecards.',
    color: 'from-sky-500 to-cyan-500',
    icon: 'truck',
  },
  {
    key: 'pos',
    name: 'POS',
    shortName: 'Point of Sale',
    description: 'Omnichannel retail operations: terminal configuration, dynamic price lists, promotional engine, tax profiles, receipt management, cash drawer reconciliation, and day-end settlement.',
    color: 'from-pink-500 to-rose-500',
    icon: 'shopping-cart',
  },
  {
    key: 'quality',
    name: 'Quality',
    shortName: 'Quality Management',
    description: 'Structured quality assurance: non-conformance and CAPA management, incoming and in-process inspections, control plans, laboratory test management, calibration workflows, and audit scheduling.',
    color: 'from-green-600 to-emerald-500',
    icon: 'shield-check',
  },
  {
    key: 'dms',
    name: 'DMS',
    shortName: 'Document Management',
    description: 'Controlled document lifecycle: version-managed repository, structured approval and publishing workflows, e-signature integration, retention policy enforcement, and access governance.',
    color: 'from-slate-600 to-gray-700',
    icon: 'document',
  },
  {
    key: 'compliance',
    name: 'Compliance',
    shortName: 'Compliance & EHS',
    description: 'Enterprise governance and EHS management: policy libraries, enterprise risk registers, internal and external audit management, incident investigation, CAPA workflows, and training evidence records.',
    color: 'from-red-500 to-amber-500',
    icon: 'badge',
  },
];

// Detailed module features for Features page
export const moduleFeatures = {
  hrm: {
    name: 'HRM',
    fullName: 'Human Resource Management',
    color: 'from-blue-500 to-cyan-500',
    icon: 'people',
    submodules: [
      {
        name: 'Employees',
        features: ['Employee directory', 'Departments & designations', 'Onboarding/offboarding', 'Document vault'],
      },
      {
        name: 'Attendance',
        features: ['Shift rules & devices', 'Geolocation/IP rules', 'Overtime policies', 'Adjustment requests'],
      },
      {
        name: 'Leaves',
        features: ['Leave types & balances', 'Holiday calendar', 'Conflict checks', 'Approvals & accruals'],
      },
      {
        name: 'Payroll',
        features: ['Salary structures', 'Allowances/deductions', 'Payroll run & locking', 'Payslips & bank files'],
      },
      {
        name: 'Recruitment',
        features: ['Job posts & ATS', 'Pipelines & scoring', 'Interview scheduling', 'Offer workflows'],
      },
      {
        name: 'Performance',
        features: ['KPI groups', 'Appraisal cycles', '360° feedback', 'Performance insights'],
      },
      {
        name: 'Training & Skills',
        features: ['Training calendar', 'Skill matrix', 'Certification tracking', 'Attendance & outcomes'],
      },
      {
        name: 'HR Analytics',
        features: ['Turnover & absenteeism', 'Payroll cost analysis', 'Recruitment funnel', 'Performance dashboards'],
      },
    ],
  },
  crm: {
    name: 'CRM',
    fullName: 'Customer Relationship Management',
    color: 'from-indigo-500 to-violet-500',
    icon: 'users',
    submodules: [
      {
        name: 'Leads',
        features: ['Capture & import', 'Pipelines/stages', 'Lead scoring', 'Assignment & routing'],
      },
      {
        name: 'Contacts & Accounts',
        features: ['Account hierarchy', 'Interaction history', 'Notes & tags', 'Segmentation'],
      },
      {
        name: 'Deals & Opportunities',
        features: ['Forecasting', 'Products & quotes', 'Probability tracking', 'Revenue projections'],
      },
      {
        name: 'Activities & Tasks',
        features: ['Meetings/calls/logs', 'Reminders & follow-ups', 'Templates', 'Calendar sync'],
      },
      {
        name: 'Campaigns & Journeys',
        features: ['Email/SMS campaigns', 'Source tracking', 'A/B templates', 'Analytics'],
      },
      {
        name: 'Support Desk',
        features: ['Tickets & SLAs', 'Canned responses', 'Feedback/CSAT', 'Escalation workflows'],
      },
      {
        name: 'Knowledge & Chat',
        features: ['Knowledge base', 'Live chat widget', 'Chatbot handoff', 'Visitor tracking'],
      },
      {
        name: 'CRM Analytics',
        features: ['Pipeline health', 'Win/loss analysis', 'Agent performance', 'Campaign ROI'],
      },
    ],
  },
  finance: {
    name: 'Finance',
    fullName: 'Accounting & Finance',
    color: 'from-emerald-600 to-teal-500',
    icon: 'bank',
    submodules: [
      {
        name: 'Dashboard',
        features: ['Income/expense tiles', 'Cashflow snapshot', 'Aging widgets', 'Downloadable PDF'],
      },
      {
        name: 'Chart of Accounts',
        features: ['Account hierarchy', 'Types & groups', 'Opening balances', 'Imports'],
      },
      {
        name: 'General Ledger & Journals',
        features: ['Ledger drill-down', 'Manual journals', 'Accruals & reversals', 'Approvals'],
      },
      {
        name: 'Accounts Payable/Receivable',
        features: ['Vendor/customer invoices', 'Credit/debit notes', 'Aging & collections', 'Write-off rules'],
      },
      {
        name: 'Banking & Cash',
        features: ['Bank feeds/imports', 'Reconciliation', 'Cash registers', 'Transfers'],
      },
      {
        name: 'Budgeting',
        features: ['Budget versions', 'Branch/department budgets', 'Variance reports', 'Locking'],
      },
      {
        name: 'Fixed Assets',
        features: ['Asset registry', 'Depreciation schedules', 'Revaluation/disposal', 'Capital work-in-progress'],
      },
      {
        name: 'Tax & Compliance',
        features: ['Multi-tax rules', 'Withholding/VAT', 'E-filing exports', 'Audit trail'],
      },
    ],
  },
  project: {
    name: 'Projects',
    fullName: 'Project Management',
    color: 'from-purple-500 to-pink-500',
    icon: 'project',
    submodules: [
      {
        name: 'Projects',
        features: ['Gantt & timelines', 'Members & roles', 'Budgets & status', 'Activity feed'],
      },
      {
        name: 'Tasks & Boards',
        features: ['Kanban & sprints', 'Dependencies', 'Subtasks/checklists', 'File attachments'],
      },
      {
        name: 'Teams & Resources',
        features: ['Workload view', 'Capacity & allocation', 'Skills tagging', 'Utilization insights'],
      },
      {
        name: 'Time Tracking',
        features: ['Timers & timesheets', 'Billable rates', 'Approvals', 'Exports'],
      },
      {
        name: 'Risks & Issues',
        features: ['Risk register', 'Issue logs', 'Mitigation plans', 'SLA tracking'],
      },
      {
        name: 'Project Financials',
        features: ['Cost codes', 'Purchase links', 'Change orders', 'Revenue recognition hooks'],
      },
      {
        name: 'Reports & Dashboards',
        features: ['Velocity & burn-down', 'Budget vs actuals', 'Milestone health', 'Export packs'],
      },
    ],
  },
  ims: {
    name: 'Inventory',
    fullName: 'Inventory & Warehouse',
    color: 'from-amber-500 to-orange-500',
    icon: 'cube',
    submodules: [
      {
        name: 'Catalog',
        features: ['Items & variants', 'Units of measure', 'Attributes & barcodes', 'Opening stock'],
      },
      {
        name: 'Warehouses & Bins',
        features: ['Multi-warehouse', 'Bins/shelves', 'Put-away rules', 'Location transfers'],
      },
      {
        name: 'Stock Operations',
        features: ['Issues/receipts', 'Returns & adjustments', 'Stock reconciliation', 'Serial/batch tracking'],
      },
      {
        name: 'Planning',
        features: ['Reorder levels', 'Safety stock', 'Procurement suggestions', 'Lead-time buffers'],
      },
      {
        name: 'Inventory Analytics',
        features: ['Ageing & valuation', 'Movement history', 'Cycle count variance', 'Stock availability'],
      },
    ],
  },
  scm: {
    name: 'Supply Chain',
    fullName: 'Procurement & Supply Chain',
    color: 'from-sky-500 to-cyan-500',
    icon: 'truck',
    submodules: [
      {
        name: 'Suppliers & Contracts',
        features: ['Supplier onboarding', 'Vendor grading', 'Contract terms', 'Performance scoring'],
      },
      {
        name: 'Planning & RFQ',
        features: ['Procurement plans', 'RFQ & comparisons', 'Award workflows', 'Budget checks'],
      },
      {
        name: 'Purchase Orders',
        features: ['PO creation', 'Receipts & GRN', 'Returns', 'Pricing & taxes'],
      },
      {
        name: 'Logistics',
        features: ['Freight & carrier management', 'Shipment tracking', 'Last-mile confirmations', 'Cost analysis'],
      },
      {
        name: 'Inbound Quality',
        features: ['Inspection plans', 'Hold/release', 'Non-conformance', 'Supplier CAPA'],
      },
    ],
  },
  pos: {
    name: 'POS',
    fullName: 'Point of Sale',
    color: 'from-pink-500 to-rose-500',
    icon: 'shopping-cart',
    submodules: [
      {
        name: 'Counters & Terminals',
        features: ['Register setup', 'User roles', 'Shift management', 'Hardware profiles'],
      },
      {
        name: 'Pricing & Promotions',
        features: ['Price lists', 'Discount rules', 'Coupons & loyalty', 'Tax profiles'],
      },
      {
        name: 'Billing',
        features: ['Barcode billing', 'Receipts & invoices', 'Refunds/returns', 'Split payments'],
      },
      {
        name: 'Cash & Settlement',
        features: ['Cash drawer logs', 'Day-end close', 'Settlement reports', 'Bank deposit prep'],
      },
    ],
  },
  quality: {
    name: 'Quality',
    fullName: 'Quality Management',
    color: 'from-green-600 to-emerald-500',
    icon: 'shield-check',
    submodules: [
      {
        name: 'Non-conformance & CAPA',
        features: ['NC logging', 'Root cause & 5-Why', 'Corrective actions', 'Effectiveness checks'],
      },
      {
        name: 'Control & Inspection',
        features: ['Control plans', 'Sampling & inspections', 'Hold/release', 'Defect codes'],
      },
      {
        name: 'Lab & Testing',
        features: ['Test methods', 'Lab worksheets', 'Result entry', 'COA generation'],
      },
      {
        name: 'Calibration & Audit',
        features: ['Equipment calibration', 'Audit schedules', 'Findings & actions', 'Compliance checklists'],
      },
    ],
  },
  dms: {
    name: 'DMS',
    fullName: 'Document Management',
    color: 'from-slate-600 to-gray-700',
    icon: 'document',
    submodules: [
      {
        name: 'Document Library',
        features: ['Categories & tags', 'Versioning', 'Check-in/out', 'Download controls'],
      },
      {
        name: 'Approvals & Publishing',
        features: ['Review workflows', 'E-signature/acknowledge', 'Effective dates', 'Change logs'],
      },
      {
        name: 'Retention & Compliance',
        features: ['Retention rules', 'Auto-expiry', 'Access policies', 'Audit trail'],
      },
    ],
  },
  compliance: {
    name: 'Compliance',
    fullName: 'Compliance & EHS',
    color: 'from-red-500 to-amber-500',
    icon: 'badge',
    submodules: [
      {
        name: 'Policies & Controls',
        features: ['Policy library', 'Control mappings', 'Acknowledgements', 'Exceptions'],
      },
      {
        name: 'Risk & Registers',
        features: ['Enterprise risk register', 'Likelihood/impact scoring', 'Mitigation plans', 'Heatmaps'],
      },
      {
        name: 'Audits & Checklists',
        features: ['Internal/external audits', 'Audit schedules', 'Findings & remediation', 'Export packs'],
      },
      {
        name: 'Incidents & EHS',
        features: ['Incident logging', 'Investigations', 'CAPA workflows', 'Permit to work & safety forms'],
      },
      {
        name: 'Training Evidence',
        features: ['Competency records', 'Assessment logs', 'Certificates', 'Renewal alerts'],
      },
    ],
  },
};

export const rolloutPhases = [
  {
    title: 'Discover & Configure',
    description: 'We conduct structured process-mapping workshops to identify target workflows, define success KPIs, and establish the data migration and security baseline before any environment build commences.',
    artifacts: ['Process deep dives', 'Data migration plan', 'Security checklist'],
  },
  {
    title: 'Pilot & Automate',
    description: 'A designated pilot cohort operates on a fully configured Aero environment with live integrations, approval workflows, and reporting pipelines validated against real business data.',
    artifacts: ['Pilot runbook', 'Integration connectors', 'Automation library'],
  },
  {
    title: 'Scale & Optimise',
    description: 'Phased rollout to additional business units and geographies using validated playbooks, with structured monthly performance reviews and continuous optimisation cycles.',
    artifacts: ['Executive scorecards', 'Training programmes', 'Quarterly optimisation reviews'],
  },
];

export const industryStarters = [
  {
    industry: 'Construction & EPC',
    description: 'Field diary management, subcontractor compliance tracking, and asset maintenance workflows engineered for high-complexity project operations.',
    badges: ['QS connectors', 'IoT telemetry', 'HSE playbooks'],
  },
  {
    industry: 'Healthcare Networks',
    description: 'Credential lifecycle management, roster optimisation, and regulatory audit preparation for multi-site hospital and clinical network operations.',
    badges: ['HIPAA-ready', 'Lab feeds', 'Clinical analytics'],
  },
  {
    industry: 'Manufacturing & SCM',
    description: 'Supplier performance scorecards, digital inventory control, and PFMEA-aligned quality workflows synchronised with MES and shop-floor systems.',
    badges: ['SAP connectors', 'Recall kits', 'Plant KPIs'],
  },
  {
    industry: 'Public Sector & Smart Cities',
    description: 'Citizen request management, grant programme administration, and cross-agency operational coordination within a unified, residency-compliant workspace.',
    badges: ['Data residency', 'Zero trust ready', 'GovCloud'],
  },
];

export const productHighlights = [
  {
    title: 'Complete Module Coverage',
    description: 'All ten product suites and 140+ submodules are represented with accurate, depth-verified feature mapping — engineered for technical buyers and procurement teams.',
    stat: '10 suites aligned',
  },
  {
    title: 'Pre-Configured Tenant Environments',
    description: 'Each module provisions with reference datasets, pre-built approval hierarchies, and live analytics dashboards, enabling immediate end-to-end workflow validation.',
    stat: 'Preloaded environment',
  },
  {
    title: 'Audit-Grade Compliance Controls',
    description: 'Policy libraries, risk registers, CAPA workflows, and financial audit trails are first-class capabilities — not add-ons — fully aligned with regulatory and internal audit requirements.',
    stat: 'Compliance built-in',
  },
];

export const workflowTimeline = [
  {
    step: 'Ingest',
    caption: 'IoT telemetry, structured checklists, and ERP transaction events stream into the Aero Pulse event bus in real time.',
  },
  {
    step: 'Detect',
    caption: 'AI-driven anomaly detection surfaces schedule deviations, budget variances, and compliance gaps with prescriptive remediation guidance.',
  },
  {
    step: 'Orchestrate',
    caption: 'Automated workflows propagate updates across HR, project, and financial records, eliminating manual cross-system reconciliation.',
  },
  {
    step: 'Govern',
    caption: 'Executive stakeholders review live operational dashboards, drill into root-cause metrics, and authorise corrective actions from any device.',
  },
];

export const testimonialSlides = [
  {
    quote: 'Headquarters, field sites, and partner organisations now operate from a single source of truth. Consolidated reporting cycles reduced from ten business days to a single afternoon.',
    author: 'Anika Rahman',
    role: 'Chief Operating Officer, Velocity Build Co.',
  },
  {
    quote: 'Clinical operations, HR, and compliance teams now share a unified workflow platform, eliminating the manual handoffs and version-control issues that previously impeded cross-functional execution.',
    author: 'Dr. Omar Chowdhury',
    role: 'Group Director of Operations, Nimbus Hospitals',
  },
  {
    quote: 'The modular pricing model enabled a controlled regional rollout without service interruption or unanticipated infrastructure costs.',
    author: 'Liam Carter',
    role: 'VP of Operations, Atlas Logistics',
  },
];

export const missionValues = [
  {
    title: 'Operational Transparency',
    description: 'Every stakeholder accesses the same live operational dashboard, making accountability a structural property of the platform rather than a cultural aspiration.',
  },
  {
    title: 'Governed Automation',
    description: 'Automation handles high-volume, rules-based processing while structured approval gates and immutable audit trails maintain full organisational accountability.',
  },
  {
    title: 'Global-First Reliability',
    description: 'Multi-region tenancy, data residency controls, and 99.95% SLA-backed uptime are foundational platform requirements, not optional enterprise add-ons.',
  },
];

export const timelineMilestones = [
  { year: '2019', headline: 'Platform Architecture Established', detail: 'Initial deployment conducted with three construction enterprises requiring integrated HR and project management capabilities within a single operational environment.' },
  { year: '2021', headline: 'Multi-Organisation Tenancy', detail: 'Platform extended to support enterprise organisations across eight countries with full data isolation and regional compliance controls.' },
  { year: '2023', headline: 'AI-Driven Signal Intelligence', detail: 'Aero Pulse intelligent event processing introduced to proactively identify schedule deviations, compliance violations, and cost overrun risks.' },
  { year: '2024', headline: 'Enterprise UX Modernisation', detail: 'Complete front-end architecture rebuild delivering improved performance, accessibility compliance, and operational efficiency across all modules.' },
  { year: '2025', headline: 'Global Enterprise Deployment Programme', detail: 'Expanded to twenty-two enterprise rollouts with GovCloud-ready deployment configurations and advanced multi-region data residency controls.' },
];

export const leadershipTeam = [
  { name: 'Maya Iqbal', title: 'Chief Executive Officer', focus: 'Scaled distributed operations programmes across APAC enterprises prior to founding Aero, with deep expertise in high-growth B2B SaaS.', avatar: 'MI' },
  { name: 'Ethan Cho', title: 'Chief Product Officer', focus: 'Previously led data platform and developer tooling programmes at Atlassian and HashiCorp, driving platform-level product strategy.', avatar: 'EC' },
  { name: 'Sara Velasquez', title: 'VP Engineering', focus: 'Cloud infrastructure architect specialising in multi-region reliability engineering, platform scalability, and enterprise-grade security compliance.', avatar: 'SV' },
  { name: 'Rafi Tan', title: 'Head of Customer Success', focus: 'Directs enterprise onboarding programmes, executive business reviews, and structured adoption frameworks across all client deployments.', avatar: 'RT' },
];

export const globalImpactStats = [
  { label: 'Operational sites orchestrated', value: '180+', detail: 'Construction, healthcare, and public sector campuses under active management' },
  { label: 'Automated process workflows', value: '1,400+', detail: 'HR, compliance, and field operations workflows live in production' },
  { label: 'Supported languages', value: '12', detail: 'Full localisation including RTL language support' },
  { label: 'Average production go-live', value: '6 weeks', detail: 'From programme commencement to first automated production workflow in live operation' },
];

export const partnerLogos = ['AWS', 'Microsoft', 'Google Cloud', 'Atlassian', 'Snowflake', 'Netsuite'];

export const resourceFilters = ['All', 'Case Study', 'Playbook', 'Product Update', 'Webinar', 'Guide'];

export const resourceLibrary = [
  {
    title: 'Atlas Logistics: Compliance Consolidation Across 42 Sites',
    summary: 'Atlas decommissioned seven legacy compliance tools and automated ISO audit workflows across all sites within a ten-week implementation programme.',
    type: 'Case Study',
    readingTime: '6 min read',
    tag: 'Operations',
  },
  {
    title: 'Executive Operations Dashboard Blueprint',
    summary: 'Structured implementation workbook for building an enterprise command dashboard spanning HR, Project, and Finance operational metrics.',
    type: 'Playbook',
    readingTime: '11 min read',
    tag: 'Strategy',
  },
  {
    title: 'Release 2025.4: Platform Capability Summary',
    summary: 'AI-assisted incident management, field operation checklists, and expanded data residency controls introduced in this release cycle.',
    type: 'Product Update',
    readingTime: '4 min read',
    tag: 'Product',
  },
  {
    title: 'Healthcare Credentialing Automation: Technical Deep Dive',
    summary: 'Recorded session with Nimbus Hospitals detailing credential lifecycle automation, renewal workflows, and compliance verification integration.',
    type: 'Webinar',
    readingTime: '45 min session',
    tag: 'Healthcare',
  },
  {
    title: 'Smart City Grant Programme Operations Guide',
    summary: 'Implementation templates for cross-agency operational workflows, programme performance reporting, and audit readiness documentation.',
    type: 'Guide',
    readingTime: '9 min read',
    tag: 'Public Sector',
  },
  {
    title: 'Manufacturing Operations Playbook Collection',
    summary: 'Production-ready PFMEA workflow templates, supplier performance scorecards, and structured product recall playbooks for immediate deployment.',
    type: 'Playbook',
    readingTime: '12 min read',
    tag: 'Manufacturing',
  },
];

export const docQuickLinks = [
  {
    label: 'Implementation guides',
    href: '/docs/implementation',
    description: 'Deployment blueprints covering PFMEA workflows, vendor scorecard configuration, and regulatory recall playbooks.',
  },
  {
    label: 'API reference',
    href: '/docs/api',
    description: 'Comprehensive endpoint documentation, webhook event schemas, and versioned code samples maintained with every release.',
  },
  {
    label: 'Security centre',
    href: '/docs/security',
    description: 'Certification registry, data residency configuration guides, and encryption architecture deep dives.',
  },
  {
    label: 'Release notes',
    href: '/docs/releases',
    description: 'Monthly release documentation covering new capabilities, resolved defects, and structured upgrade guidance.',
  },
];

export const supportChannels = [
  {
    label: '24/7 Chat & Email Support',
    description: 'Priority-routed incident queues with full context handoff, contractual SLA adherence, and structured escalation pathways.',
    response: '< 15 minutes avg.',
  },
  {
    label: 'Phone & WhatsApp Support',
    description: 'Dedicated telephony and messaging lines for production incident response and deployment-critical guidance.',
    response: '< 30 minutes avg.',
  },
  {
    label: 'Slack Connect',
    description: 'Embed Aero platform engineers and solution architects directly within your operational Slack workspace for real-time collaboration.',
    response: 'Real-time',
  },
  {
    label: 'Customer Academy',
    description: 'Role-specific training programmes, certification pathways, and live lab environments for administrators, end-users, and integration teams.',
    response: 'Self-paced',
  },
];

export const slaMatrix = [
  { severity: 'Critical (P1)', launch: '4 hrs', scale: '2 hrs', enterprise: '30 min + bridge' },
  { severity: 'High (P2)', launch: '8 hrs', scale: '4 hrs', enterprise: '1 hr' },
  { severity: 'Medium (P3)', launch: '24 hrs', scale: '12 hrs', enterprise: '4 hrs' },
  { severity: 'Low (P4)', launch: '48 hrs', scale: '24 hrs', enterprise: '8 hrs' },
];

export const demoSteps = [
  {
    step: 'Discover',
    description: 'Share your operational landscape and priority workflows in a structured 30-minute requirements mapping session with our solutions team.',
  },
  {
    step: 'Configure',
    description: 'We provision a dedicated environment with your selected modules, representative data sets, and pre-configured automation blueprints.',
  },
  {
    step: 'Validate',
    description: 'Observe the complete signal-to-governance workflow across HR, Projects, Compliance, and SCM — validated against your specific business scenarios.',
  },
];

export const demoStats = [
  { label: 'Average time-to-value', value: '6 weeks' },
  { label: 'Business functions orchestrated', value: '5+' },
  { label: 'Pre-certified integrations', value: '20+' },
];

export const legalPrinciples = [
  {
    title: 'Data stewardship',
    detail: 'Your data is your property. We never sell it and only process it to deliver contracted services.',
  },
  {
    title: 'Regional compliance',
    detail: 'EU, UK, Middle East, and APAC residency options with dedicated encryption and retention controls.',
  },
  {
    title: 'Continuous audits',
    detail: 'SOC 2 Type II, ISO 27001, ISO 27701, and HIPAA-aligned controls verified annually.',
  },
];

export const privacySections = [
  {
    heading: '1. Data collection',
    body: 'We collect account, usage, and diagnostic data to deliver and improve Aero. Customer admins control retention policies.',
  },
  {
    heading: '2. Processing & sub-processors',
    body: 'Processing is limited to contract scope. We maintain a public list of sub-processors with regional duplication.',
  },
  {
    heading: '3. Security',
    body: 'Encryption in transit and at rest, data isolation, and continuous security monitoring protect your information.',
  },
  {
    heading: '4. Rights & controls',
    body: 'Admins can export, rectify, and delete data at any time. We respond to DSRs within statutory timelines.',
  },
];

export const termsSections = [
  {
    heading: '1. Agreement scope',
    body: 'These Terms govern access to Aero modules and services. Supplemental agreements cover implementation.',
  },
  {
    heading: '2. Customer obligations',
    body: 'Provide accurate account information, maintain user access controls, and comply with usage guidelines.',
  },
  {
    heading: '3. Service commitments',
    body: 'We provide 99.95% uptime backed by credits, with maintenance windows announced at least 7 days prior.',
  },
  {
    heading: '4. Liability',
    body: 'Direct damages capped at 12 months of fees. No consequential damages except where prohibited.',
  },
];

export const securityHighlights = [
  'Advanced security architecture with device verification.',
  'Automated backups every 15 minutes with cross-region replication.',
  'Enterprise single sign-on and automated user provisioning.',
  'Comprehensive audit logs with data export.',
];

export const cookieCategories = [
  {
    name: 'Essential',
    usage: 'Authentication sessions, fraud prevention, and load balancing.',
  },
  {
    name: 'Analytics',
    usage: 'Aggregated telemetry to improve reliability and navigation.',
  },
  {
    name: 'Preferences',
    usage: 'Language, theme, and product tour state per user.',
  },
];
