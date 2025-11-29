import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import App from '@/Layouts/App.jsx';
import { motion } from 'framer-motion';
import { Button, Chip, Card, CardBody, CardHeader, Input, Divider, Progress } from '@heroui/react';
import {
  BuildingOffice2Icon,
  Squares2X2Icon,
  BoltIcon,
  LifebuoyIcon,
  UsersIcon,
  ArrowUpRightIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const defaultStats = [
  {
    label: 'Active tenants',
    value: '128',
    change: '+6 this week',
    trend: 'up',
    meta: '99.1% health score',
    icon: BuildingOffice2Icon,
  },
  {
    label: 'Provisioned seats',
    value: '8,420',
    change: '+412 vs last month',
    trend: 'up',
    meta: '74% capacity utilized',
    icon: Squares2X2Icon,
  },
  {
    label: 'Monthly recurring',
    value: '$214k',
    change: '+4.5%',
    trend: 'up',
    meta: 'Net MRR after churn',
    icon: BoltIcon,
  },
  {
    label: 'Open tickets',
    value: '37',
    change: '5 urgent',
    trend: 'down',
    meta: 'Avg. response 21m',
    icon: LifebuoyIcon,
  },
];

const defaultUsage = [
  { label: 'Active seats', metric: '4,230', progress: 86 },
  { label: 'Automation runs', metric: '12,940', progress: 68 },
  { label: 'Storage footprint', metric: '6.7 TB', progress: 54 },
  { label: 'API throughput', metric: '2.8M calls', progress: 73 },
];

const defaultPipeline = [
  { stage: 'New trials', count: 38, conversion: '52%' },
  { stage: 'Engaged', count: 24, conversion: '67%' },
  { stage: 'Security review', count: 11, conversion: '82%' },
  { stage: 'Contracting', count: 6, conversion: '91%' },
];

const defaultIncidents = [
  { title: 'SLA watch · AMS cluster', time: '12m ago', description: 'Node 5 memory pressure recovered automatically.' },
  { title: 'Billing webhook delay', time: '1h ago', description: 'Stripe retries succeeded. Monitoring throughput.' },
  { title: 'Support backlog cleared', time: '3h ago', description: 'All P1 tickets answered within SLA.' },
];

const defaultTickets = [
  { id: 'TCK-4821', tenant: 'Waypoint Logistics', impact: 'Billing lock', owner: 'Dana', status: 'Investigating' },
  { id: 'TCK-4819', tenant: 'Northwind Retail', impact: 'Email sync', owner: 'Chris', status: 'Escalated' },
  { id: 'TCK-4812', tenant: 'Aero Health', impact: 'HR workflows', owner: 'Priya', status: 'Monitoring' },
];

const defaultHero = {
  status: { label: 'Platform stable', color: 'success', note: '99.98% uptime' },
  title: 'Command center overview',
  subtitle: 'Monitor tenant health, infrastructure, and live workloads in one canvas.',
  primaryMetric: { label: 'Live tenants', value: '128', meta: '+6 this week' },
  highlights: [
    { label: 'Next maintenance', value: 'Dec 03 · 02:00 UTC', icon: CalendarDaysIcon },
    { label: 'Last deploy', value: '14 minutes ago', icon: ArrowPathIcon },
    { label: 'SLA compliance', value: '99.982%', icon: ShieldCheckIcon },
  ],
};

const defaultSchedule = [
  {
    title: 'Today',
    description: '1 tenant running change freeze',
    meta: 'Arrival review 15:00 UTC',
    accent: 'primary',
  },
  {
    title: 'Tomorrow',
    description: 'No maintenance windows booked',
    meta: 'Escalations: none',
    accent: 'success',
  },
  {
    title: 'Next seven days',
    description: '3 enterprise cutovers on deck',
    meta: '2 require security sign-off',
    accent: 'warning',
  },
];

const defaultDailySummary = {
  date: 'November 30, 2025',
  present: 42,
  absent: 3,
  total: 45,
  updatedAt: '00:56 AM UTC',
  people: [
    { name: 'Waypoint Logistics', status: 'On schedule', tag: 'Enterprise' },
    { name: 'Northwind Retail', status: 'Awaiting billing review', tag: 'Growth' },
    { name: 'Aero Health', status: 'Expansion kickoff', tag: 'Enterprise' },
  ],
};

const DiagonalAccent = ({ color = 'var(--theme-primary)' }) => (
  <span
    aria-hidden
    className="pointer-events-none absolute -right-16 top-0 h-full w-2/3 opacity-30"
    style={{
      background: `linear-gradient(135deg, transparent 0%, ${color} 100%)`,
      filter: 'blur(4px)',
    }}
  />
);

const HeroPulseCard = ({ hero, themeRadius, analyticsUrl }) => (
  <Card
    className="relative overflow-hidden border-none"
    style={{
      borderRadius: `var(--borderRadius, 18px)` ,
      background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 35%, transparent) 0%, color-mix(in srgb, var(--theme-content1) 85%, transparent) 65%)',
      color: 'var(--theme-primary-foreground, #fff)',
    }}
  >
    <DiagonalAccent color="color-mix(in srgb, var(--theme-primary) 90%, transparent)" />
    <CardHeader className="flex flex-col gap-4 text-white">
      <Chip color={hero.status.color} variant="flat" radius={themeRadius} className="w-fit bg-white/20 text-white">
        {hero.status.label}
      </Chip>
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-white">{hero.title}</h1>
        <p className="text-sm text-white/80">{hero.subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button as={Link} href={analyticsUrl ?? '#'} color="primary" radius={themeRadius} className="bg-white/20 text-white">
          <ArrowUpRightIcon className="h-4 w-4" />
          <span className="ml-2">Open analytics</span>
        </Button>
        <Button variant="flat" color="default" radius={themeRadius} className="bg-white/10 text-white border-white/20" startContent={<DocumentArrowDownIcon className="h-4 w-4" />}>
          Export snapshot
        </Button>
      </div>
    </CardHeader>
    <CardBody className="grid gap-4 border-t border-white/10 pt-4 text-white md:grid-cols-3">
      <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
        <p className="text-sm text-white/80">{hero.primaryMetric.label}</p>
        <p className="text-3xl font-bold">{hero.primaryMetric.value}</p>
        <p className="text-xs text-white/70">{hero.primaryMetric.meta}</p>
      </div>
      {hero.highlights.map((item) => (
        <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="rounded-xl bg-white/20 p-2">
            <item.icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-white/70">{item.label}</p>
            <p className="font-semibold text-white">{item.value}</p>
          </div>
        </div>
      ))}
    </CardBody>
  </Card>
);

const StatHighlightCard = ({ stat }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
    <Card
      className="relative overflow-hidden border border-divider/80"
      style={{
        borderRadius: `var(--borderRadius, 16px)` ,
        background: 'linear-gradient(135deg, var(--theme-content1) 0%, color-mix(in srgb, var(--theme-content3) 40%, transparent) 100%)',
      }}
    >
      <DiagonalAccent color={`color-mix(in srgb, ${stat.accent} 80%, transparent)`} />
      <CardBody className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-default-500">{stat.label}</p>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
          <div className="rounded-2xl border border-divider/60 p-2" style={{ background: `color-mix(in srgb, ${stat.accent} 12%, transparent)` }}>
            <stat.icon className="h-6 w-6" style={{ color: stat.accent }} />
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-default-500">
          <SparklesIcon className="h-4 w-4" />
          <span>{stat.meta}</span>
        </div>
      </CardBody>
    </Card>
  </motion.div>
);

const ScheduleCard = ({ entry }) => {
  const accentColor = `var(--theme-${entry.accent}, #0ea5e9)`;

  return (
    <Card
      className="relative overflow-hidden border border-divider/60"
      style={{
        borderRadius: `var(--borderRadius, 16px)` ,
        background: `linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 95%, transparent) 0%, color-mix(in srgb, ${accentColor} 20%, transparent) 60%, color-mix(in srgb, ${accentColor} 35%, transparent) 100%)`,
      }}
    >
      <DiagonalAccent color={accentColor} />
    <CardBody className="relative z-10 space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircleIcon className="h-4 w-4 text-foreground/70" />
        <p className="text-sm font-semibold text-foreground">{entry.title}</p>
      </div>
      <p className="text-sm text-default-500">{entry.description}</p>
      <Chip variant="flat" color={entry.accent} size="sm" className="w-fit">
        {entry.meta}
      </Chip>
    </CardBody>
    </Card>
  );
};

const FrostedSectionCard = ({ title, description, children }) => (
  <Card
    className="border border-divider/70"
    style={{
      borderRadius: `var(--borderRadius, 16px)` ,
      background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 80%, transparent) 0%, color-mix(in srgb, var(--theme-content3) 40%, transparent) 100%)',
    }}
  >
    <CardHeader className="flex-col items-start gap-1 pb-0">
      <p className="text-xs uppercase tracking-wide text-default-500">{title}</p>
      <h2 className="text-xl font-semibold text-foreground">{description}</h2>
    </CardHeader>
    <CardBody className="pt-4">{children}</CardBody>
  </Card>
);

const DailySummaryCard = ({ summary, themeRadius }) => (
  <Card
    className="relative border border-divider/70"
    style={{
      borderRadius: `var(--borderRadius, 18px)` ,
      background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-content1) 95%, transparent) 0%, color-mix(in srgb, var(--theme-content3) 35%, transparent) 100%)',
    }}
  >
    <CardHeader className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-default-500">Daily timesheet</p>
          <h3 className="text-lg font-semibold text-foreground">{summary.date}</h3>
        </div>
        <Chip color="success" variant="flat" radius={themeRadius}>
          Updated {summary.updatedAt}
        </Chip>
      </div>
      <div className="grid gap-4 text-center md:grid-cols-3">
        <div>
          <p className="text-xs text-default-500">Present</p>
          <p className="text-2xl font-bold text-success">{summary.present}</p>
        </div>
        <div>
          <p className="text-xs text-default-500">Absent</p>
          <p className="text-2xl font-bold text-danger">{summary.absent}</p>
        </div>
        <div>
          <p className="text-xs text-default-500">Total</p>
          <p className="text-2xl font-bold text-foreground">{summary.total}</p>
        </div>
      </div>
    </CardHeader>
    <CardBody className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Search tenant" radius={themeRadius} />
        <Input type="date" radius={themeRadius} />
      </div>
      <Divider />
      <div className="space-y-3">
        {summary.people.map((item) => (
          <div key={item.name} className="flex items-center justify-between rounded-2xl border border-divider/70 bg-content1/40 p-3">
            <div>
              <p className="font-semibold text-foreground">{item.name}</p>
              <p className="text-xs text-default-500">{item.status}</p>
            </div>
            <Chip size="sm" variant="flat" color="primary">
              {item.tag}
            </Chip>
          </div>
        ))}
      </div>
    </CardBody>
  </Card>
);

const Dashboard = () => {
  const { adminDashboard = {} } = usePage().props;
  const stats = adminDashboard.stats ?? defaultStats;
  const usage = adminDashboard.usage ?? defaultUsage;
  const pipeline = adminDashboard.pipeline ?? defaultPipeline;
  const incidents = adminDashboard.incidents ?? defaultIncidents;
  const tickets = adminDashboard.tickets ?? defaultTickets;
  const hero = adminDashboard.hero ?? defaultHero;
  const schedule = adminDashboard.schedule ?? defaultSchedule;
  const summary = adminDashboard.summary ?? defaultDailySummary;

  const [themeRadius, setThemeRadius] = useState('lg');

  const getThemeRadius = () => {
    if (typeof window === 'undefined') {
      return 'lg';
    }

    const rootStyles = getComputedStyle(document.documentElement);
    const borderRadius = rootStyles.getPropertyValue('--borderRadius')?.trim() || '12px';
    const radiusValue = parseInt(borderRadius, 10);

    if (radiusValue === 0) {
      return 'none';
    }

    if (radiusValue <= 4) {
      return 'sm';
    }

    if (radiusValue <= 8) {
      return 'md';
    }

    if (radiusValue <= 12) {
      return 'lg';
    }

    return 'xl';
  };

  useEffect(() => {
    const updateRadius = () => setThemeRadius(getThemeRadius());
    updateRadius();
    window.addEventListener('resize', updateRadius);

    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  const statHighlights = useMemo(
    () =>
      stats.map((stat) => ({
        label: stat.label,
        value: stat.value,
        meta: stat.meta ?? stat.change,
        icon: stat.icon ?? UsersIcon,
        accent: stat.trend === 'down' ? 'var(--theme-danger, #f31260)' : 'var(--theme-primary, #006FEE)',
      })),
    [stats],
  );

  const fadeIn = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay },
  });

  return (
    <>
      <Head title="Admin Dashboard" />
      <div className="flex h-full w-full flex-col gap-6 p-4" role="main" aria-label="Platform overview">
        <motion.div {...fadeIn(0)}>
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <HeroPulseCard hero={hero} themeRadius={themeRadius} analyticsUrl={route('admin.analytics.index')} />
            <div className="space-y-4">
              {schedule.map((entry) => (
                <ScheduleCard key={entry.title} entry={entry} />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...fadeIn(0.05)}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {statHighlights.map((stat) => (
              <StatHighlightCard key={stat.label} stat={stat} />
            ))}
          </div>
        </motion.div>

        <motion.div {...fadeIn(0.1)}>
          <DailySummaryCard summary={summary} themeRadius={themeRadius} />
        </motion.div>

        <motion.div {...fadeIn(0.15)}>
          <div className="grid gap-6 lg:grid-cols-3">
            <FrostedSectionCard title="Engagement signal" description="24h consumption heatmap">
              <div className="space-y-4">
                {usage.map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="text-default-600">{item.label}</span>
                      <span className="text-foreground">{item.metric}</span>
                    </div>
                    <Progress aria-label={item.label} value={item.progress} color="primary" className="h-2" />
                  </div>
                ))}
              </div>
            </FrostedSectionCard>

            <FrostedSectionCard title="Go-to-market pipeline" description="Enterprise procurement">
              <div className="space-y-4">
                {pipeline.map((stage) => (
                  <div key={stage.stage} className="flex items-center justify-between gap-4 rounded-2xl border border-divider/60 p-3">
                    <div>
                      <p className="font-semibold text-foreground">{stage.stage}</p>
                      <p className="text-sm text-default-500">{stage.count} active evaluations</p>
                    </div>
                    <Chip color="primary" variant="flat">
                      {stage.conversion} conversion
                    </Chip>
                  </div>
                ))}
              </div>
            </FrostedSectionCard>

            <FrostedSectionCard title="Operational status" description="Reliability feed">
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.title} className="flex gap-3 rounded-2xl border border-divider/50 bg-content1/50 p-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{incident.title}</p>
                        <span className="text-xs text-default-500">{incident.time}</span>
                      </div>
                      <p className="text-sm text-default-500">{incident.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FrostedSectionCard>
          </div>
        </motion.div>

        <motion.div {...fadeIn(0.2)}>
          <FrostedSectionCard title="Critical support tickets" description="High-touch queue">
            <div className="flex flex-col gap-4 pb-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm text-default-500">Live view of customers currently needing manual intervention.</p>
              <div className="flex flex-wrap gap-2">
                <Button as={Link} href={route('admin.support.index')} color="primary" radius={themeRadius}>
                  View queue
                </Button>
                <Button variant="bordered" radius={themeRadius}>
                  Export list
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-divider/70">
              <table className="min-w-full text-sm">
                <thead className="bg-content2/60 text-left text-xs font-semibold uppercase tracking-wide text-default-500">
                  <tr>
                    <th className="px-6 py-3">Ticket</th>
                    <th className="px-6">Tenant</th>
                    <th className="px-6">Impact</th>
                    <th className="px-6">Owner</th>
                    <th className="px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider/70 bg-content1">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="px-6 py-4 font-semibold text-foreground">{ticket.id}</td>
                      <td className="px-6">{ticket.tenant}</td>
                      <td className="px-6">{ticket.impact}</td>
                      <td className="px-6">{ticket.owner}</td>
                      <td className="px-6 text-right">
                        <Chip color="warning" variant="flat" size="sm">
                          {ticket.status}
                        </Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FrostedSectionCard>
        </motion.div>
      </div>
    </>
  );
};

Dashboard.layout = (page) => <App>{page}</App>;

export default Dashboard;
