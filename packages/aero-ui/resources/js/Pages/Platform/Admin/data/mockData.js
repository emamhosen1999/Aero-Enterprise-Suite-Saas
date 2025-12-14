export const planCatalog = [
  {
    id: 'starter',
    name: 'Starter',
    headline: 'Operational launchpad for seed-stage teams.',
    price: 499,
    currency: 'USD',
    cadence: 'month',
    seatsIncluded: 50,
    storage: '250 GB',
    apiCalls: '1M',
    badge: 'Launch',
    description: 'Essential HR, attendance, and workspace automation with concierge onboarding.',
    target: 'Seed to Series A teams modernising ops',
    features: [
      'Core HR + Document management',
      'Guided provisioning checklist',
      'Shared support channel',
      '99.5% uptime SLA'
    ],
    activeTenants: 45,
    avgSeatUtilization: 0.72
  },
  {
    id: 'growth',
    name: 'Growth',
    headline: 'Cross-functional automation with governance guardrails.',
    price: 2200,
    cadence: 'month',
    seatsIncluded: 250,
    storage: '1.5 TB',
    apiCalls: '6M',
    badge: 'Most adopted',
    description: 'Adds project portfolio, CRM signals, and adaptive workflows for scaling companies.',
    target: 'High-velocity teams with multi-region ops',
    features: [
      'Advanced automation rules',
      'Regional compliance pack',
      'Playbook library',
      '99.9% uptime SLA'
    ],
    activeTenants: 62,
    avgSeatUtilization: 0.81
  },
  {
    id: 'professional',
    name: 'Professional',
    headline: 'Multi-entity orchestration with AI-first insights.',
    price: 5200,
    cadence: 'month',
    seatsIncluded: 600,
    storage: '4 TB',
    apiCalls: '18M',
    badge: 'AI Suite',
    description: 'Dedicated infrastructure, predictive analytics, and embedded security reviews.',
    target: 'Platform teams aligning global subsidiaries',
    features: [
      'Private data lake connectors',
      'Predictive retention scores',
      'Dedicated solutions engineer',
      'Active-active failover'
    ],
    activeTenants: 38,
    avgSeatUtilization: 0.87
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    headline: 'Regulated industry stack with bespoke controls.',
    price: 10800,
    cadence: 'month',
    seatsIncluded: 'Unlimited',
    storage: 'Custom',
    apiCalls: 'Unlimited',
    badge: 'Regulated',
    description: 'Joint roadmap governance, compliance pods, and on-prem AD bridges.',
    target: 'Global enterprises with layered subsidiaries',
    features: [
      'Dedicated tenant shards',
      'Custom data residency',
      'Quarterly resilience drills',
      'Named TAM + compliance pod'
    ],
    activeTenants: 11,
    avgSeatUtilization: 0.91
  }
];

export const addOnCatalog = [
  {
    id: 'compliance-pack',
    name: 'Regulatory Compliance Pack',
    description: 'Audit templates, evidence locker, and automated attestation reminders.',
    price: 399,
    cadence: 'month',
    attachmentRate: 0.58,
    popularWith: ['professional', 'enterprise']
  },
  {
    id: 'ai-coach',
    name: 'AI Workforce Coach',
    description: 'Skill graphs, coaching nudges, and AI-authored reviews.',
    price: 249,
    cadence: 'month',
    attachmentRate: 0.34,
    popularWith: ['growth', 'professional']
  },
  {
    id: 'obsidian-support',
    name: 'Obsidian Support',
    description: '24/7 follow-the-sun pod with 30-minute SLA guarantees.',
    price: 899,
    cadence: 'month',
    attachmentRate: 0.16,
    popularWith: ['professional', 'enterprise']
  }
];

export const planMetrics = {
  totalPlans: planCatalog.length,
  averageContractValue: 4280,
  medianSeatUtilization: 0.82,
  expansionRate: 0.19,
  downgradeRate: 0.04,
  trialConversion: 0.67
};

export const moduleCatalog = [
  {
    id: 'hr-core',
    name: 'People OS',
    category: 'Core',
    description: 'Unified employee graph, lifecycle journeys, and service desk automations.',
    icon: 'UserGroupIcon',
    activeTenants: 156,
    adoption: 100,
    owner: 'People Cloud',
    status: 'stable',
    lastRelease: '2025-11-12',
    roadmap: ['Skill graph v3', 'AI onboarding copilots']
  },
  {
    id: 'project-suite',
    name: 'Project Portfolio',
    category: 'Operations',
    description: 'Cross-team workstreams, dependency heatmaps, and risk telemetry.',
    icon: 'ClipboardDocumentCheckIcon',
    activeTenants: 134,
    adoption: 86,
    owner: 'Delivery Hub',
    status: 'stable',
    lastRelease: '2025-10-30',
    roadmap: ['Edge approvals', 'Adaptive WIP limits']
  },
  {
    id: 'crm-insights',
    name: 'Revenue Intelligence',
    category: 'Go-to-market',
    description: 'Signals from pipeline, voice-of-customer loops, and play intelligence.',
    icon: 'ChartBarSquareIcon',
    activeTenants: 98,
    adoption: 63,
    owner: 'Growth Studio',
    status: 'beta',
    lastRelease: '2025-11-05',
    roadmap: ['Lead scoring v2', 'RevOps API pack']
  },
  {
    id: 'compliance-hub',
    name: 'Compliance Control Center',
    category: 'Governance',
    description: 'Mapped controls, audit readiness workspace, and regulator portal.',
    icon: 'ShieldCheckIcon',
    activeTenants: 89,
    adoption: 57,
    owner: 'GRC Guild',
    status: 'stable',
    lastRelease: '2025-09-22',
    roadmap: ['Multi-framework inheritance', 'Zero-copy attestation share']
  },
  {
    id: 'finance-suite',
    name: 'Finance & Billing',
    category: 'Revenue',
    description: 'Usage metering, quote-to-cash bridges, and expense intelligence.',
    icon: 'CurrencyDollarIcon',
    activeTenants: 112,
    adoption: 71,
    owner: 'Monetisation Lab',
    status: 'stable',
    lastRelease: '2025-10-18',
    roadmap: ['Usage arbitrage alerts', 'Embedded ledgers']
  }
];

export const billingSummary = {
  mrr: 428500,
  arr: 5142000,
  netRevenueRetention: 108,
  grossMargin: 82,
  activeSubscriptions: 148,
  expansionMRR: 72000,
  contractionMRR: 18000,
  overdueInvoices: 7,
  failedPaymentsRate: 0.9
};

export const transactionHistory = [
  {
    id: 'TX-4812',
    tenant: 'Northwind Retail',
    type: 'Subscription',
    amount: 11800,
    currency: 'USD',
    status: 'settled',
    method: 'Stripe ACH',
    date: '2025-11-27T13:09:00Z'
  },
  {
    id: 'TX-4807',
    tenant: 'Waypoint Logistics',
    type: 'Addon',
    amount: 1200,
    currency: 'USD',
    status: 'pending',
    method: 'Stripe Card',
    date: '2025-11-26T09:45:00Z'
  },
  {
    id: 'TX-4800',
    tenant: 'Summit Manufacturing',
    type: 'Subscription',
    amount: 5200,
    currency: 'USD',
    status: 'failed',
    method: 'Wire',
    date: '2025-11-25T18:22:00Z'
  },
  {
    id: 'TX-4794',
    tenant: 'Aero Health',
    type: 'True-up',
    amount: 8700,
    currency: 'USD',
    status: 'settled',
    method: 'Stripe Card',
    date: '2025-11-24T07:18:00Z'
  }
];

export const invoiceCollection = [
  {
    number: 'INV-2083',
    tenant: 'Northwind Retail',
    issueDate: '2025-11-01',
    dueDate: '2025-11-15',
    amount: 11800,
    currency: 'USD',
    status: 'paid',
    owner: 'Billing pod',
    channel: 'Auto-pay'
  },
  {
    number: 'INV-2081',
    tenant: 'Waypoint Logistics',
    issueDate: '2025-11-04',
    dueDate: '2025-11-19',
    amount: 5200,
    currency: 'USD',
    status: 'open',
    owner: 'Finance pod',
    channel: 'Email + ACH'
  },
  {
    number: 'INV-2074',
    tenant: 'Summit Manufacturing',
    issueDate: '2025-10-28',
    dueDate: '2025-11-12',
    amount: 10800,
    currency: 'USD',
    status: 'overdue',
    owner: 'Finance pod',
    channel: 'Manual wire'
  },
  {
    number: 'INV-2070',
    tenant: 'Aero Health',
    issueDate: '2025-10-20',
    dueDate: '2025-11-04',
    amount: 8700,
    currency: 'USD',
    status: 'paid',
    owner: 'Billing pod',
    channel: 'Card vault'
  }
];

export const paymentProfiles = [
  {
    id: 'stripe',
    name: 'Stripe',
    status: 'active',
    mode: 'live',
    lastSync: '2 min ago',
    settlementTime: 'T+2',
    fee: '2.9% + $0.30',
    managedCurrencies: ['USD', 'EUR', 'GBP']
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    status: 'active',
    mode: 'live',
    lastSync: '12 min ago',
    settlementTime: 'T+3',
    fee: '2.1% + ₹3',
    managedCurrencies: ['INR']
  },
  {
    id: 'paypal',
    name: 'PayPal Braintree',
    status: 'sandbox',
    mode: 'sandbox',
    lastSync: '38 min ago',
    settlementTime: 'T+1',
    fee: '2.6% + $0.30',
    managedCurrencies: ['USD', 'EUR']
  }
];

export const emailTransports = [
  {
    id: 'postmark',
    name: 'Postmark',
    status: 'connected',
    throughput: '12k/hr',
    ipPool: 'Transactional',
    authenticatedDomains: 4,
    lastHealthCheck: '5 min ago'
  },
  {
    id: 'ses',
    name: 'AWS SES',
    status: 'connected',
    throughput: '50k/hr',
    ipPool: 'Shared',
    authenticatedDomains: 7,
    lastHealthCheck: '11 min ago'
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    status: 'disconnected',
    throughput: '—',
    ipPool: 'Marketing',
    authenticatedDomains: 2,
    lastHealthCheck: '3 days ago'
  }
];

export const emailTemplates = [
  { id: 'tenant-welcome', name: 'Tenant welcome', category: 'Lifecycle', status: 'active', updatedAt: '2025-11-15' },
  { id: 'invoice-reminder', name: 'Invoice reminder', category: 'Billing', status: 'active', updatedAt: '2025-11-22' },
  { id: 'trial-conversion', name: 'Trial conversion', category: 'Growth', status: 'draft', updatedAt: '2025-11-05' },
  { id: 'downtime-notice', name: 'Downtime notice', category: 'Operations', status: 'archived', updatedAt: '2025-09-18' }
];

export const analyticsTimeSeries = {
  mrr: [
    { month: 'Jun', value: 382000 },
    { month: 'Jul', value: 395500 },
    { month: 'Aug', value: 402300 },
    { month: 'Sep', value: 414900 },
    { month: 'Oct', value: 423400 },
    { month: 'Nov', value: 428500 }
  ],
  newTenants: [
    { month: 'Jun', value: 18 },
    { month: 'Jul', value: 21 },
    { month: 'Aug', value: 24 },
    { month: 'Sep', value: 22 },
    { month: 'Oct', value: 25 },
    { month: 'Nov', value: 27 }
  ],
  churn: [
    { month: 'Jun', value: 2.4 },
    { month: 'Jul', value: 2.3 },
    { month: 'Aug', value: 2.1 },
    { month: 'Sep', value: 2.0 },
    { month: 'Oct', value: 1.9 },
    { month: 'Nov', value: 1.8 }
  ],
  geoSplit: [
    { name: 'Asia Pacific', value: 43.6 },
    { name: 'North America', value: 27.1 },
    { name: 'Europe', value: 20.4 },
    { name: 'Middle East', value: 5.8 },
    { name: 'Other', value: 3.1 }
  ],
  revenueMix: [
    { name: 'Subscriptions', value: 68 },
    { name: 'Add-ons', value: 17 },
    { name: 'Services', value: 10 },
    { name: 'Usage', value: 5 }
  ]
};

export const usageHeatmap = [
  { module: 'HR Core', weeklyActive: 12840, peakHour: '10:00 UTC', apdex: 0.96 },
  { module: 'Projects', weeklyActive: 10980, peakHour: '14:00 UTC', apdex: 0.93 },
  { module: 'CRM', weeklyActive: 7120, peakHour: '16:00 UTC', apdex: 0.9 },
  { module: 'Compliance', weeklyActive: 4860, peakHour: '12:00 UTC', apdex: 0.95 },
  { module: 'Analytics', weeklyActive: 13860, peakHour: '09:00 UTC', apdex: 0.92 }
];

export const ticketQueues = [
  {
    id: 'platform',
    name: 'Platform Ops',
    open: 12,
    slaBreaches: 0,
    medianFirstResponse: '7m',
    satisfaction: 98
  },
  {
    id: 'billing',
    name: 'Billing',
    open: 8,
    slaBreaches: 1,
    medianFirstResponse: '19m',
    satisfaction: 94
  },
  {
    id: 'security',
    name: 'Security',
    open: 3,
    slaBreaches: 0,
    medianFirstResponse: '11m',
    satisfaction: 99
  }
];

export const supportTickets = [
  {
    id: 'TCK-4821',
    subject: 'Webhook retries for finance exports',
    tenant: 'Waypoint Logistics',
    priority: 'high',
    status: 'open',
    owner: 'Ivy Ross',
    queue: 'platform',
    channel: 'email',
    updatedAt: '2h ago',
    impact: 'Integration delay',
    tags: ['webhooks', 'finance'],
    slaDeadline: '2025-11-30T16:00:00Z'
  },
  {
    id: 'TCK-4813',
    subject: 'Invoice numbering mismatch',
    tenant: 'Summit Manufacturing',
    priority: 'medium',
    status: 'waiting_on_customer',
    owner: 'Noah Reyes',
    queue: 'billing',
    channel: 'portal',
    updatedAt: '35m ago',
    impact: 'Finance workflow',
    tags: ['billing'],
    slaDeadline: '2025-12-01T09:00:00Z'
  },
  {
    id: 'TCK-4809',
    subject: 'SCIM provisioning stuck',
    tenant: 'Aero Health',
    priority: 'urgent',
    status: 'escalated',
    owner: 'Security pod',
    queue: 'security',
    channel: 'pager',
    updatedAt: '11m ago',
    impact: 'Identity sync',
    tags: ['scim', 'identity'],
    slaDeadline: '2025-11-30T12:30:00Z'
  }
];

export const ticketThreads = {
  'TCK-4821': [
    {
      id: 'msg-1',
      author: 'Avery Holt',
      role: 'tenant',
      timestamp: '2025-11-29T07:34:00Z',
      body: 'Seeing repeated retries on the finance export webhook. Need confirmation if payload changed.'
    },
    {
      id: 'msg-2',
      author: 'Ivy Ross',
      role: 'support',
      timestamp: '2025-11-29T08:02:00Z',
      body: 'Confirmed schema is unchanged. Investigating elevated latency on the billing worker shard.'
    }
  ],
  'TCK-4813': [
    {
      id: 'msg-1',
      author: 'Dana Kingsley',
      role: 'tenant',
      timestamp: '2025-11-29T05:11:00Z',
      body: 'Invoice numbers are skipping sequences when PDF is regenerated.'
    }
  ],
  'TCK-4809': [
    {
      id: 'msg-1',
      author: 'Security pod',
      role: 'support',
      timestamp: '2025-11-29T08:55:00Z',
      body: 'Escalated to identity bridge team. Monitoring SCIM queue depth.'
    }
  ]
};
