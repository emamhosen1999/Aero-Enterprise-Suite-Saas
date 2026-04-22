// ─── AEOS Static Page Data ────────────────────────────────────────────────────

export const NAV_LINKS = [
  { label: "Platform",     href: "#features" },
  { label: "Modules",      href: "#modules" },
  { label: "Enterprise",   href: "#enterprise" },
  { label: "Pricing",      href: "#pricing" },
  { label: "Docs",         href: "/docs" },
];

export const FEATURES = [
  {
    id: "hrm",
    icon: "UsersGroup",
    size: "large",          // bento: spans 2 cols
    label: "Core Module",
    title: "Human Resource Management",
    description: "End-to-end workforce lifecycle — from onboarding to payroll automation with multi-tenant role isolation.",
    accent: "cyan",
    stat: "99.9% uptime",
  },
  {
    id: "analytics",
    icon: "ChartBarSquare",
    size: "medium",
    label: "Intelligence",
    title: "Real-Time Analytics",
    description: "Live dashboards with role-based data visibility, KPI drill-downs, and AI-assisted forecasting.",
    accent: "amber",
    stat: "< 80ms latency",
  },
  {
    id: "payroll",
    icon: "CurrencyDollar",
    size: "medium",
    label: "Finance Module",
    title: "Payroll Engine",
    description: "Automated payroll with tax slabs, deduction rules, and multi-currency disbursement per tenant.",
    accent: "indigo",
    stat: "40+ tax rules",
  },
  {
    id: "security",
    icon: "ShieldCheck",
    size: "small",
    label: "Security",
    title: "Zero-Trust Architecture",
    description: "Per-tenant data isolation with RBAC, MFA, and audit trail on every critical action.",
    accent: "cyan",
  },
  {
    id: "api",
    icon: "CodeBracketSquare",
    size: "small",
    label: "Developer",
    title: "Headless API-First",
    description: "RESTful + GraphQL endpoints. Full SDK with Webhook support and rate limiting.",
    accent: "amber",
  },
  {
    id: "workflow",
    icon: "Bolt",
    size: "small",
    label: "Automation",
    title: "Smart Workflows",
    description: "Visual flow builder for approval chains, notifications, and task delegation.",
    accent: "indigo",
  },
];

export const STATS = [
  { value: 250,   suffix: "+",  label: "Enterprise Clients",    prefix: "" },
  { value: 99.97, suffix: "%",  label: "Guaranteed Uptime SLA", prefix: "" },
  { value: 4.2,   suffix: "M+", label: "Records Processed/Day", prefix: "" },
  { value: 38,    suffix: "+",  label: "Active Modules",        prefix: "" },
];

export const NARRATIVE_STEPS = [
  {
    tag: "01 / Foundation",
    title: "One Platform.",
    highlight: "Infinite Configurations.",
    body: "AEOS is not a monolith. Each module—HR, Payroll, Inventory, CRM—runs as an independently deployable service with shared auth and tenant context.",
  },
  {
    tag: "02 / Multi-Tenancy",
    title: "Thousands of Organizations.",
    highlight: "Zero Data Crossover.",
    body: "Row-level security enforced at the database layer. Every query is tenant-scoped. No custom installs, no shared schemas—each client gets a fully isolated logical environment.",
  },
  {
    tag: "03 / Scale",
    title: "Built for Peak Load.",
    highlight: "Async by Design.",
    body: "Heavy operations run as queued jobs—payroll runs, report generation, bulk imports. Your UI stays responsive. Background workers handle the volume.",
  },
  {
    tag: "04 / Extensibility",
    title: "Your Rules.",
    highlight: "Your Workflows.",
    body: "Custom fields, approval chains, role definitions, and module permissions are configurable per tenant via the admin interface—no code required.",
  },
];

export const TESTIMONIALS = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "VP Engineering",
    company: "Vertex Systems",
    avatar: "SC",
    avatarColor: "#00E5FF",
    quote: "AEOS replaced three disparate SaaS tools and cut our operational overhead by 40%. The multi-tenant architecture is exactly what a B2B platform needs.",
    rating: 5,
  },
  {
    id: 2,
    name: "Rahel Haile",
    role: "Chief People Officer",
    company: "Meridian Group",
    avatar: "RH",
    avatarColor: "#FFB347",
    quote: "Payroll configuration that used to take our team a full day now runs in minutes. The automation rules engine is genuinely exceptional engineering.",
    rating: 5,
  },
  {
    id: 3,
    name: "James Okoye",
    role: "CTO",
    company: "Cascade Logistics",
    avatar: "JO",
    avatarColor: "#6366F1",
    quote: "We onboarded 1,200 employees across six subsidiaries in under two weeks. The zero-trust security model gave our compliance team everything they asked for.",
    rating: 5,
  },
  {
    id: 4,
    name: "Priya Nair",
    role: "Director of Operations",
    company: "Solaris Tech",
    avatar: "PN",
    avatarColor: "#00E5FF",
    quote: "The analytics dashboards have completely changed how we present workforce data to the board. Real-time KPIs with role-based visibility—flawless.",
    rating: 5,
  },
];

export const TRUST_LOGOS = [
  "Nexacore", "Vertex Systems", "Meridian Group",
  "Cascade Logistics", "Solaris Tech", "Atlas Capital",
  "Prism Works", "Ironhold", "Zephyr AI", "Continuum",
  "Quanta Labs", "Orbis Consulting",
];

export const FOOTER_LINKS = {
  Platform: [
    "Human Resources", "Payroll Engine", "Analytics Suite",
    "Inventory Control", "CRM Module", "Workflow Builder",
  ],
  Developers: [
    "API Reference", "SDKs & Libraries", "Webhooks",
    "Changelog", "Status Page", "Open Source",
  ],
  Company: [
    "About AEOS", "Careers", "Blog",
    "Press Kit", "Contact", "Legal",
  ],
  Resources: [
    "Documentation", "Community", "Case Studies",
    "Roadmap", "Security", "Compliance",
  ],
};

export const SOCIAL_LINKS = [
  { name: "GitHub",   href: "#", icon: "GitHub" },
  { name: "Twitter",  href: "#", icon: "Twitter" },
  { name: "LinkedIn", href: "#", icon: "LinkedIn" },
  { name: "Discord",  href: "#", icon: "Discord" },
];
