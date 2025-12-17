export const heroStats = [
  { value: '10', label: 'Business Solutions' },
  { value: '140+', label: 'Integrated Features' },
  { value: '99.96%', label: 'Rolling 24‑month uptime' },
  { value: '38 days', label: 'Median go-live' },
];

export const platformModules = [
  {
    key: 'hrm',
    name: 'HRM',
    shortName: 'Human Resources',
    description: 'Employees, attendance, leave, payroll, recruitment, performance, training, and HR analytics.',
    color: 'from-blue-500 to-cyan-500',
    icon: 'people',
  },
  {
    key: 'crm',
    name: 'CRM',
    shortName: 'Customer Relations',
    description: 'Leads, contacts, deals, activities, campaigns, support desk, knowledge base, chat, and analytics.',
    color: 'from-indigo-500 to-violet-500',
    icon: 'users',
  },
  {
    key: 'finance',
    name: 'Finance',
    shortName: 'Accounting & Finance',
    description: 'COA, GL, AP/AR, banking, budgeting, fixed assets, tax, statements, and audits.',
    color: 'from-emerald-600 to-teal-500',
    icon: 'bank',
  },
  {
    key: 'project',
    name: 'Projects',
    shortName: 'Project Management',
    description: 'Projects, tasks, sprints, resources, documents, risks, budgets, and reporting.',
    color: 'from-purple-500 to-pink-500',
    icon: 'project',
  },
  {
    key: 'ims',
    name: 'Inventory',
    shortName: 'Inventory & Warehouse',
    description: 'Items, warehouses, stock moves, barcodes, reorder planning, and cycle counts.',
    color: 'from-amber-500 to-orange-500',
    icon: 'cube',
  },
  {
    key: 'scm',
    name: 'Supply Chain',
    shortName: 'Procurement & SCM',
    description: 'Suppliers, RFQ, purchase planning, freight, inbound QC, and vendor scorecards.',
    color: 'from-sky-500 to-cyan-500',
    icon: 'truck',
  },
  {
    key: 'pos',
    name: 'POS',
    shortName: 'Point of Sale',
    description: 'Terminals, price lists, promotions, taxes, receipts, cash drawers, and day-end.',
    color: 'from-pink-500 to-rose-500',
    icon: 'shopping-cart',
  },
  {
    key: 'quality',
    name: 'Quality',
    shortName: 'Quality Management',
    description: 'NC/CAPA, inspections, control plans, lab tests, audits, and calibration.',
    color: 'from-green-600 to-emerald-500',
    icon: 'shield-check',
  },
  {
    key: 'dms',
    name: 'DMS',
    shortName: 'Document Management',
    description: 'Repository, versioning, approvals, publishing, retention, and sign-offs.',
    color: 'from-slate-600 to-gray-700',
    icon: 'document',
  },
  {
    key: 'compliance',
    name: 'Compliance',
    shortName: 'Compliance & EHS',
    description: 'Policies, risk register, audits, incidents, corrective actions, and training evidence.',
    color: 'from-red-500 to-amber-500',
    icon: 'badge',
  },
];

// Detailed module features for Features page (aligned with products.php)
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
    description: 'We map your processes, pick the right modules, and agree on success metrics before building.',
    artifacts: ['Process deep dives', 'Data migration plan', 'Security checklist'],
  },
  {
    title: 'Pilot & Automate',
    description: 'A lighthouse group runs on Aero with integrations, approvals, and reporting wired up.',
    artifacts: ['Pilot runbook', 'Integration connectors', 'Automation library'],
  },
  {
    title: 'Scale & Optimize',
    description: 'Roll out to new regions and functions with shared playbooks and monthly reviews.',
    artifacts: ['Exec scorecards', 'Training sessions', 'Quarterly tune-ups'],
  },
];

export const industryStarters = [
  {
    industry: 'Construction & EPC',
    description: 'Field diaries, contractor compliance, and asset maintenance built for busy project teams.',
    badges: ['QS connectors', 'IoT telemetry', 'HSE playbooks'],
  },
  {
    industry: 'Healthcare Networks',
    description: 'Credentialing, roster automation, and audit prep for multi-site hospitals.',
    badges: ['HIPAA-ready', 'Lab feeds', 'Clinical analytics'],
  },
  {
    industry: 'Manufacturing & SCM',
    description: 'Supplier scorecards, digital inventory, and PFMEA workflows synced to MES.',
    badges: ['SAP connectors', 'Recall kits', 'Plant KPIs'],
  },
  {
    industry: 'Public Sector & Smart Cities',
    description: 'Citizen requests, grant programs, and cross-agency coordination in one workspace.',
    badges: ['Data residency', 'Zero trust ready', 'GovCloud'],
  },
];

export const productHighlights = [
  {
    title: 'Products.php parity',
    description: 'Public pages mirror the ten modules and 140+ submodules defined in the catalog—no vague marketing gloss.',
    stat: '10 suites aligned',
  },
  {
    title: 'Ready tenants',
    description: 'Every module ships with seeded data, approval chains, and dashboards so prospects see working flows immediately.',
    stat: 'Preloaded demo',
  },
  {
    title: 'Audit-grade controls',
    description: 'Policies, risk registers, CAPA, and financial audit trails are first-class, matching the compliance module in the product file.',
    stat: 'Compliance built-in',
  },
];

export const workflowTimeline = [
  {
    step: 'Signals',
    caption: 'IoT events, checklists, and ERP updates flow into Aero Pulse.',
  },
  {
    step: 'Sense',
    caption: 'AI flags schedule, budget, or compliance risks and suggests next steps.',
  },
  {
    step: 'Synchronize',
    caption: 'Automations update HR, project, and finance records in the background.',
  },
  {
    step: 'Show',
    caption: 'Leaders review live boards, drill into issues, and approve fixes from any device.',
  },
];

export const testimonialSlides = [
  {
    quote: 'HQ, field sites, and partners now work from the same numbers. Reporting dropped from 10 days to an afternoon.',
    author: 'Anika Rahman',
    role: 'COO, Velocity Build Co.',
  },
  {
    quote: 'Clinical, HR, and compliance teams finally share one playbook instead of passing spreadsheets around.',
    author: 'Dr. Omar Chowdhury',
    role: 'Group Director, Nimbus Hospitals',
  },
  {
    quote: 'Modular pricing let us roll out region by region without downtime or surprise costs.',
    author: 'Liam Carter',
    role: 'VP Operations, Atlas Logistics',
  },
];

export const missionValues = [
  {
    title: 'Radical Transparency',
    description: 'Everyone sees the same live dashboard, so accountability feels normal—not forced.',
  },
  {
    title: 'Automation with Safeguards',
    description: 'Automation handles the busywork while approvals and audit trails keep people in charge.',
  },
  {
    title: 'Global-first Reliability',
    description: 'Multi-region tenancy, residency controls, and 99.95% uptime are table stakes for us.',
  },
];

export const timelineMilestones = [
  { year: '2019', headline: 'Blueprint drafted', detail: 'Prototype launched with three construction firms that needed HR plus project oversight in one place.' },
  { year: '2021', headline: 'Multi-organization support', detail: 'Enhanced platform to serve customers across eight countries seamlessly.' },
  { year: '2023', headline: 'AI signal loop', detail: 'Introduced Aero Pulse to flag schedule, compliance, and cost risks early.' },
  { year: '2024', headline: 'Interface redesign', detail: 'Rebuilt the user experience with modern design for faster, cleaner pages.' },
  { year: '2025', headline: 'Global mission control', detail: 'Twenty-two enterprise rollouts later, we added GovCloud-ready deployments.' },
];

export const leadershipTeam = [
  { name: 'Maya Iqbal', title: 'Chief Executive Officer', focus: 'Scaled distributed ops programs across APAC before building Aero.', avatar: 'MI' },
  { name: 'Ethan Cho', title: 'Chief Product Officer', focus: 'Led data platform teams at Atlassian and HashiCorp.', avatar: 'EC' },
  { name: 'Sara Velasquez', title: 'VP Engineering', focus: 'Former cloud infrastructure lead focused on multi-region reliability.', avatar: 'SV' },
  { name: 'Rafi Tan', title: 'Head of Customer Impact', focus: 'Runs adoption squads and exec workshops for every rollout.', avatar: 'RT' },
];

export const globalImpactStats = [
  { label: 'Sites orchestrated', value: '180+', detail: 'Construction, hospital, and public sector campuses' },
  { label: 'Process automations', value: '1,400+', detail: 'HR, compliance, and field workflows live today' },
  { label: 'Languages supported', value: '12', detail: 'Localization plus RTL support built in' },
  { label: 'Avg. go-live', value: '6 weeks', detail: 'From kickoff to the first automated workflow' },
];

export const partnerLogos = ['AWS', 'Microsoft', 'Google Cloud', 'Atlassian', 'Snowflake', 'Netsuite'];

export const resourceFilters = ['All', 'Case Study', 'Playbook', 'Product Update', 'Webinar', 'Guide'];

export const resourceLibrary = [
  {
    title: 'Atlas Logistics scaled compliance across 42 sites',
    summary: 'Atlas retired seven legacy tools and automated ISO audits in ten weeks.',
    type: 'Case Study',
    readingTime: '6 min read',
    tag: 'Operations',
  },
  {
    title: 'Executive dashboard blueprint',
    summary: 'Workbook for building a practical command center for HR, Projects, and Finance.',
    type: 'Playbook',
    readingTime: '11 min read',
    tag: 'Strategy',
  },
  {
    title: 'Release 2025.4 highlights',
    summary: 'AI incident assistant, field checklists, and new data residency controls.',
    type: 'Product Update',
    readingTime: '4 min read',
    tag: 'Product',
  },
  {
    title: 'Healthcare credentialing masterclass',
    summary: 'Webinar replay with Nimbus Hospitals on automating credential renewals.',
    type: 'Webinar',
    readingTime: '45 min session',
    tag: 'Healthcare',
  },
  {
    title: 'Smart city grant tracking guide',
    summary: 'Templates for cross-agency workflows, reporting, and audit readiness.',
    type: 'Guide',
    readingTime: '9 min read',
    tag: 'Public Sector',
  },
  {
    title: 'Manufacturing playbooks pack',
    summary: 'PFMEA workflows, supplier scorecards, and recall playbooks ready to deploy.',
    type: 'Playbook',
    readingTime: '12 min read',
    tag: 'Manufacturing',
  },
];

export const docQuickLinks = [
  {
    label: 'Implementation guides',
    href: '/docs/implementation',
    description: 'Blueprints for PFMEA workflows, supplier scorecards, and recall playbooks.',
  },
  {
    label: 'API reference',
    href: '/docs/api',
    description: 'Endpoints, webhook events, and code examples kept current each release.',
  },
  {
    label: 'Security center',
    href: '/docs/security',
    description: 'Certifications, data residency, and encryption deep dives.',
  },
  {
    label: 'Release notes',
    href: '/docs/releases',
    description: 'Monthly drops covering features, fixes, and rollout guidance.',
  },
];

export const supportChannels = [
  {
    label: '24/7 Chat & Email',
    description: 'Priority routing with context, SLAs, and clear escalation paths.',
    response: '< 15 minutes avg',
  },
  {
    label: 'Phone & WhatsApp',
    description: 'Dedicated lines for incident response and rollout guidance.',
    response: '< 30 minutes avg',
  },
  {
    label: 'Slack Connect',
    description: 'Embed Aero experts in your channels for fast collaboration.',
    response: 'Real-time',
  },
  {
    label: 'Customer Academy',
    description: 'Courses, certifications, and live labs for every role.',
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
    description: 'Share your operations landscape and must-win workflows during a 30-minute mapping session.',
  },
  {
    step: 'Configure',
    description: 'We spin up an environment with your modules, data samples, and automation blueprints.',
  },
  {
    step: 'Launch',
    description: 'See the end-to-end signal loop across HR, projects, compliance, and SCM in action.',
  },
];

export const demoStats = [
  { label: 'Avg. time to value', value: '6 weeks' },
  { label: 'Departments orchestrated', value: '5+' },
  { label: 'Integrations wired', value: '20+' },
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
