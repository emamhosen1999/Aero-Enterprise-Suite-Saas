export const heroStats = [
  { value: '18', label: 'Modules shipped' },
  { value: '99.96%', label: 'Rolling 24‑month uptime' },
  { value: '22', label: 'Countries live' },
  { value: '38 days', label: 'Median go-live' },
];

export const platformModules = [
  {
    name: 'HRM',
    shortName: 'Human Resource Management',
    description: 'Complete workforce management from hiring to retirement with attendance, payroll, and performance reviews.',
    color: 'from-blue-500 to-cyan-500',
    icon: 'people',
  },
  {
    name: 'CRM',
    shortName: 'Customer Relationship Management',
    description: 'Lead capture, deal pipelines, marketing campaigns, support desk, and live chat integration.',
    color: 'from-indigo-500 to-violet-500',
    icon: 'users',
  },
  {
    name: 'ERP',
    shortName: 'Enterprise Resource Planning',
    description: 'Inventory, purchasing, sales, warehouse, accounting, expenses, fixed assets, and procurement.',
    color: 'from-emerald-500 to-teal-500',
    icon: 'inbox-stack',
  },
  {
    name: 'Project Management',
    shortName: 'Project & Task Management',
    description: 'Projects, tasks, Kanban boards, time tracking, sprints, and workload reports.',
    color: 'from-purple-500 to-pink-500',
    icon: 'project',
  },
  {
    name: 'Collaboration',
    shortName: 'Collaboration & Communication',
    description: 'Messaging, video meetings, document management, and multi-level approval workflows.',
    color: 'from-orange-500 to-amber-500',
    icon: 'chat',
  },
  {
    name: 'E-commerce',
    shortName: 'E-commerce Platform',
    description: 'Product catalog, cart & checkout, order management, and payment gateway integrations.',
    color: 'from-pink-500 to-rose-500',
    icon: 'shopping-cart',
  },
  {
    name: 'Analytics',
    shortName: 'Analytics & Intelligence',
    description: 'Dashboards, KPI tiles, tabular reports, and predictive analytics with AI insights.',
    color: 'from-rose-500 to-red-500',
    icon: 'chart-bar',
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
        name: 'Employee Information System',
        features: ['Employee profile', 'Department & designation', 'Joining/exit workflow', 'Document vault'],
      },
      {
        name: 'Attendance',
        features: ['Time-in/time-out', 'IP/device restrictions', 'Geolocation attendance', 'Manual adjustment requests'],
      },
      {
        name: 'Leave Management',
        features: ['Leave types', 'Leave request workflow', 'Balance calculation', 'Calendar integration'],
      },
      {
        name: 'Payroll',
        features: ['Salary structure', 'Allowances & deductions', 'Payslip generator', 'Payment disbursement logs'],
      },
      {
        name: 'Recruitment',
        features: ['Job posts', 'Applicant tracking', 'Interview scheduling', 'Evaluation scoring'],
      },
      {
        name: 'Performance Management',
        features: ['KPI groups', 'Appraisal cycles', '360° feedback', 'Performance reports'],
      },
      {
        name: 'Training & Development',
        features: ['Training calendar', 'Skill matrix', 'Certification tracking'],
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
        features: ['Lead capture', 'Lead scoring', 'Lead assignment', 'Lead pipeline'],
      },
      {
        name: 'Contacts & Accounts',
        features: ['Customer/company profiles', 'Contact linking', 'Interaction logs'],
      },
      {
        name: 'Deals/Pipelines',
        features: ['Stages', 'Deal forecasting', 'Deal probability', 'Revenue estimation'],
      },
      {
        name: 'Marketing',
        features: ['Email/SMS campaigns', 'Audience segmentation', 'Template builder', 'Campaign analytics'],
      },
      {
        name: 'Support Desk',
        features: ['Ticket submission', 'Priority/SLA rules', 'Canned responses', 'Ticket workflows', 'Feedback/rating'],
      },
      {
        name: 'Live Chat/Widget',
        features: ['Chat inbox', 'Visitor tracking', 'Chatbot integration'],
      },
    ],
  },
  erp: {
    name: 'ERP',
    fullName: 'Enterprise Resource Planning',
    color: 'from-emerald-500 to-teal-500',
    icon: 'inbox-stack',
    submodules: [
      {
        name: 'Inventory',
        features: ['Items & categories', 'Units of measure', 'Stock movements', 'Opening balance', 'Multi-warehouse support'],
      },
      {
        name: 'Purchase Management',
        features: ['Purchase requests', 'Purchase order creation', 'Supplier comparison', 'Goods received note'],
      },
      {
        name: 'Sales Management',
        features: ['Sales orders', 'Quotations', 'Delivery notes', 'Customer credit limit'],
      },
      {
        name: 'Warehouse',
        features: ['Bins & shelves', 'Put-away rules', 'Stock transfer', 'Cycle counting'],
      },
      {
        name: 'Accounting & Finance',
        features: ['Chart of accounts', 'Journal entries', 'Invoices', 'Payments', 'Bank reconciliation', 'VAT/Tax rules'],
      },
      {
        name: 'Expense Management',
        features: ['Expense categories', 'Expense claim workflow', 'Reimbursements'],
      },
      {
        name: 'Fixed Assets',
        features: ['Asset registration', 'Depreciation schedules', 'Disposal tracking'],
      },
      {
        name: 'Procurement',
        features: ['Supplier directory', 'Tender management', 'Approval workflow'],
      },
    ],
  },
  project: {
    name: 'Project Management',
    fullName: 'Project & Task Management',
    color: 'from-purple-500 to-pink-500',
    icon: 'project',
    submodules: [
      {
        name: 'Projects',
        features: ['Project creation', 'Milestones', 'Member assignment'],
      },
      {
        name: 'Tasks',
        features: ['Task creation', 'Subtasks', 'Checklists', 'Attachments'],
      },
      {
        name: 'Boards',
        features: ['Kanban board', 'Sprint planning', 'Backlogs'],
      },
      {
        name: 'Time Tracking',
        features: ['Timers', 'Timesheets', 'Billing rates'],
      },
      {
        name: 'Reports',
        features: ['Velocity', 'Workload', 'Burn-down charts'],
      },
    ],
  },
  collaboration: {
    name: 'Collaboration',
    fullName: 'Collaboration & Communication',
    color: 'from-orange-500 to-amber-500',
    icon: 'chat',
    submodules: [
      {
        name: 'Messaging',
        features: ['Direct messages', 'Group channels', 'Attachments'],
      },
      {
        name: 'Meetings',
        features: ['Video call integration', 'Calendar sync', 'Meeting notes'],
      },
      {
        name: 'Document Management',
        features: ['File repository', 'Versioning', 'Share permissions'],
      },
      {
        name: 'Approvals',
        features: ['Multi-level approvals', 'Dynamic workflow builder', 'Approval history'],
      },
    ],
  },
  ecommerce: {
    name: 'E-commerce',
    fullName: 'E-commerce Platform',
    color: 'from-pink-500 to-rose-500',
    icon: 'shopping-cart',
    submodules: [
      {
        name: 'Catalog',
        features: ['Products', 'Variants', 'Attributes'],
      },
      {
        name: 'Cart & Checkout',
        features: ['Cart logic', 'Shipping rules', 'Coupons'],
      },
      {
        name: 'Orders',
        features: ['Order lifecycle', 'Cancellations/returns', 'Fulfillment'],
      },
      {
        name: 'Payment Integrations',
        features: ['Gateways', 'Wallets', 'Refund logs'],
      },
    ],
  },
  analytics: {
    name: 'Analytics',
    fullName: 'Analytics & Intelligence',
    color: 'from-rose-500 to-red-500',
    icon: 'chart-bar',
    submodules: [
      {
        name: 'Dashboards',
        features: ['Widgets', 'KPI tiles', 'Visualization engine'],
      },
      {
        name: 'Reports',
        features: ['Tabular reports', 'Exporter (PDF, Excel)', 'Scheduler'],
      },
      {
        name: 'Predictive Analytics',
        features: ['Demand forecasting', 'Customer churn model', 'Anomaly detection'],
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
    title: 'Unified Data Fabric',
    description: 'People, projects, finance, and compliance share the same live record instead of emailing sheets around.',
    stat: '3x faster reviews',
  },
  {
    title: 'Automation Playbooks',
    description: 'We bring ready-to-run workflows for onboarding, audits, change orders, and vendor reviews.',
    stat: '120+ blueprints',
  },
  {
    title: 'AI-Assisted Ops',
    description: 'Variance alerts and natural language summaries highlight issues before weekly reviews.',
    stat: '92% risk matches',
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
