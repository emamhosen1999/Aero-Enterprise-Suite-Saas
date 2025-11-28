import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
  Button,
  Card,
  CardBody,
  Chip,
  Avatar,
  Divider,
} from '@heroui/react';
import { motion } from 'framer-motion';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import {
  heroStats,
  platformModules,
  productHighlights,
  rolloutPhases,
  workflowTimeline,
  industryStarters,
  testimonialSlides,
  demoStats,
} from '../../constants/marketing';
import PublicLayout from '../../Layouts/PublicLayout';

const iconMap = {
  people: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493m-6.564-3.07A6.375 6.375 0 0115 19.235V19.128m0 .106A12.318 12.318 0 018.625 21c-2.331 0-4.512-.645-6.375-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
    </svg>
  ),
  project: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5A1.125 1.125 0 0121.375 4.125v1.5c0 .621-.504 1.125-1.125 1.125H3.75A1.125 1.125 0 012.625 5.625v-1.5C2.625 3.504 3.129 3 3.75 3zM6 7.5v9a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 16.5v-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11.25v1.5M12 9v4.5m3-6V15" />
    </svg>
  ),
  'shield-check': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  'inbox-stack': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h18m-16.5 0L4 17.25a2.25 2.25 0 002.247 2.118h11.506A2.25 2.25 0 0020 17.25L20.5 7.5M8.25 7.5L9 3.75h6L14.25 7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h18" />
    </svg>
  ),
  'chart-bar': (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  users: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m0 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 015.058 2.772m-10.116 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.941-3.197a5.971 5.971 0 00-.941 3.197" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

const problemStatements = [
  {
    title: 'Uneven visibility',
    detail: 'HR, compliance, and field ops update different trackers, so executives wait on recap decks instead of seeing live metrics.',
  },
  {
    title: 'Audit prep consumes weeks',
    detail: 'Evidence gathering for ISO, OSHA, or internal audits still happens over email which stalls day-to-day work.',
  },
  {
    title: 'Too many brittle tools',
    detail: 'Overlapping systems create duplicate entry, expiring licenses, and automations that never quite match.',
  },
  {
    title: 'Slow handoffs',
    detail: 'Finance, project, and workforce data needs manual reconciliation before decisions reach steering meetings.',
  },
];

const integrations = ['Slack', 'Teams', 'SAP', 'QuickBooks', 'Salesforce', 'Oracle', 'Jira', 'HubSpot'];

const pricingPlans = [
  {
    name: 'Launch',
    price: 'Custom',
    period: '',
    description: 'Pilot two modules with guided onboarding, sample data, and a success architect.',
    highlight: false,
  },
  {
    name: 'Scale',
    price: '$20',
    period: '/module/month',
    description: 'Core suite, automation playbooks, premium support, and integration connectors.',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Let’s Talk',
    period: '',
    description: 'Dedicated CSM, GovCloud or private cloud, custom SLAs, and residency controls.',
    highlight: false,
  },
];

export default function Landing() {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur-xl'
      : 'bg-white border border-slate-200 shadow-sm',
    panel: isDarkMode
      ? 'bg-slate-950/70 border border-white/10 backdrop-blur-2xl'
      : 'bg-white border border-slate-200 shadow-xl',
    highlightCard: isDarkMode
      ? 'bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-500/10 border border-white/20'
      : 'bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-50 border border-slate-200 shadow-lg',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    divider: isDarkMode ? 'bg-white/10' : 'bg-slate-200',
    badge: isDarkMode
      ? 'bg-white/10 border border-white/20 text-white'
      : 'bg-white border border-slate-200 text-slate-700',
  }), [isDarkMode]);

  const anchorNavLinks = [
    { type: 'anchor', href: '#modules', label: 'Modules' },
    { type: 'anchor', href: '#pricing', label: 'Plans' },
  ];

  return (
    <PublicLayout extraNavLinks={anchorNavLinks} mainClassName="pt-0">
      <div className={`relative ${palette.baseText}`}>
        <section id="hero" className="relative px-6 pt-32 pb-24 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-blue-600/20 via-purple-500/10 to-cyan-500/10'
                  : 'bg-gradient-to-br from-sky-200/60 via-indigo-100/40 to-cyan-100/40'
              }`}
            />
            <div className="absolute -right-32 top-8 w-72 h-72 bg-blue-500/20 blur-[140px]" />
            <div className="absolute -left-24 bottom-0 w-72 h-72 bg-emerald-400/20 blur-[120px]" />
          </div>
          <div className="relative max-w-6xl mx-auto grid items-center gap-16 lg:grid-cols-2">
            <div>
              <Chip color="success" variant="flat" className="uppercase tracking-[0.3em] text-[11px] mb-6">
                Multi-tenant ready
              </Chip>
              <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                Run HR, projects, compliance, and partner work from the same system.
              </h1>
              <p className={`text-lg ${palette.mutedText} mb-8`}>
                Aero combines HR, project tracking, compliance, and supplier workflows on one Laravel + Inertia stack so every team works from the same data without stitching spreadsheets together.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-10 py-7 rounded-2xl">
                    Start Free Trial
                  </Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="bordered" className="px-9 py-7 rounded-2xl border-current">
                    Watch the demo
                  </Button>
                </Link>
                <a href="#modules">
                  <Button size="lg" variant="light" className="px-9 py-7">
                    Explore modules
                  </Button>
                </a>
              </div>
              <div className={`mt-6 text-sm ${palette.mutedText}`}>
                No payment is required for the trial. A rollout architect works with your admins on day one.
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                {heroStats.map((stat) => (
                  <Card key={stat.label} className={`${palette.card} text-center`}>
                    <CardBody>
                      <div className="text-3xl font-bold">{stat.value}</div>
                      <p className={`text-xs mt-1 ${palette.mutedText}`}>{stat.label}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ rotateX: 15, rotateY: -15, opacity: 0 }}
              animate={{ rotateX: 0, rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.9 }}
              className="relative"
            >
              <Card className={palette.panel}>
                <CardBody>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className={`text-sm ${palette.mutedText}`}>Live operational map</p>
                      <h3 className="text-2xl font-semibold">Command board</h3>
                    </div>
                    <Chip color="secondary" variant="flat">
                      Realtime
                    </Chip>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {platformModules.slice(0, 4).map((module) => (
                      <Card key={module.name} className={palette.card}>
                        <CardBody className="p-4">
                          <div className={`w-12 h-12 rounded-xl mb-3 bg-gradient-to-br ${module.color} flex items-center justify-center text-white`}>
                            {iconMap[module.icon]}
                          </div>
                          <p className="font-semibold text-sm">{module.name}</p>
                          <p className={`text-xs mt-1 ${palette.mutedText}`}>{module.description}</p>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <Divider className={`my-6 ${palette.divider}`} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">Pulse automations</p>
                      <p className={`text-sm ${palette.mutedText}`}>Escalations fire automatically when KPIs drift.</p>
                    </div>
                    <Chip color="primary" variant="flat">
                      AI Assist
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <Chip variant="faded" color="success" className="uppercase tracking-[0.3em] text-[11px] mb-4">
                Why teams switch
              </Chip>
              <h2 className="text-4xl font-bold">Operations stay in sync when everyone shares the same record.</h2>
              <p className={`mt-3 text-lg ${palette.mutedText}`}>
                Ready-to-run playbooks and shared dashboards remove the late-night spreadsheet scramble.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {productHighlights.map((highlight) => (
                <Card key={highlight.title} className={`${palette.card} h-full`}>
                  <CardBody>
                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>{highlight.stat}</p>
                    <h3 className="text-xl font-semibold mt-3">{highlight.title}</h3>
                    <p className={`mt-2 ${palette.mutedText}`}>{highlight.description}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="problems" className={`py-20 px-6 ${palette.tint}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Chip variant="faded" color="warning" className="uppercase tracking-[0.3em] text-[11px] mb-4">
                Reality check
              </Chip>
              <h2 className="text-4xl font-bold">The blockers we keep hearing.</h2>
              <p className={`mt-3 ${palette.mutedText}`}>We built Aero to remove the friction that slows down enterprise execution.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {problemStatements.map((problem) => (
                <Card key={problem.title} className={`${palette.card} h-full`}>
                  <CardBody>
                    <h3 className="text-xl font-semibold mb-2">{problem.title}</h3>
                    <p className={palette.mutedText}>{problem.detail}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="modules" className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Chip color="secondary" variant="flat" className="mb-4">
                Modular architecture
              </Chip>
              <h2 className="text-4xl font-bold">Every department, one visual command center.</h2>
              <p className={`mt-3 text-lg ${palette.mutedText}`}>
                Activate only the modules you need today. Add more without migrations or rework.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformModules.map((module) => (
                <Card key={module.name} className={`${palette.card} h-full`}>
                  <CardBody>
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white mb-4`}>
                      {iconMap[module.icon]}
                    </div>
                    <h3 className="text-xl font-semibold">{module.name}</h3>
                    <p className={`mt-2 ${palette.mutedText}`}>{module.description}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className={`py-20 px-6 ${isDarkMode ? 'bg-slate-950/50' : 'bg-white'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <Chip color="primary" variant="flat" className="mb-4">
                Rollout framework
              </Chip>
              <h2 className="text-4xl font-bold">From discovery to scale with one guided runway.</h2>
            </div>
            <div className="space-y-6">
              {rolloutPhases.map((phase, index) => (
                <Card key={phase.title} className={palette.card}>
                  <CardBody className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className={`text-sm ${palette.mutedText}`}>Phase {index + 1}</p>
                      <h3 className="text-2xl font-semibold mb-2">{phase.title}</h3>
                      <p className={palette.mutedText}>{phase.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {phase.artifacts.map((artifact) => (
                        <Chip key={artifact} size="sm" color="secondary" variant="flat">
                          {artifact}
                        </Chip>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Chip color="secondary" variant="faded" className="mb-4">
                Sense → Sync loop
              </Chip>
              <h2 className="text-4xl font-bold">How the Aero signal loop keeps everyone aligned.</h2>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              {workflowTimeline.map((stage, index) => (
                <Card key={stage.step} className={`${palette.card} h-full`}>
                  <CardBody className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Chip size="sm" color="secondary" variant="flat">
                        {index + 1}
                      </Chip>
                      <h3 className="text-lg font-semibold">{stage.step}</h3>
                    </div>
                    <p className={palette.mutedText}>{stage.caption}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className={`py-20 px-6 ${palette.tint}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Chip color="primary" variant="flat" className="mb-4">
                Vertical starter packs
              </Chip>
              <h2 className="text-4xl font-bold">Industry templates that ship with relevant automations.</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {industryStarters.map((starter) => (
                <Card key={starter.industry} className={`${palette.card} h-full`}>
                  <CardBody className="space-y-4">
                    <div>
                      <p className={`text-sm ${palette.mutedText}`}>Starter pack</p>
                      <h3 className="text-2xl font-semibold">{starter.industry}</h3>
                    </div>
                    <p className={palette.mutedText}>{starter.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {starter.badges.map((badge) => (
                        <span key={badge} className={`text-xs font-semibold px-3 py-1 rounded-full ${palette.badge}`}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-12">
              <div>
                <Chip variant="flat" color="secondary" className="mb-4">
                  Customer stories
                </Chip>
                <h2 className="text-4xl font-bold">Trusted by builders, hospitals, and public agencies.</h2>
              </div>
              <Link href="/resources">
                <Button variant="bordered" className="border-current">
                  Browse case studies
                </Button>
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonialSlides.map((testimonial) => (
                <Card key={testimonial.author} className={`${palette.card} h-full`}>
                  <CardBody className="flex flex-col gap-4">
                    <p className={`text-lg ${palette.mutedText}`}>“{testimonial.quote}”</p>
                    <div className="flex items-center gap-4">
                      <Avatar name={testimonial.author} color="secondary" />
                      <div>
                        <p className="font-semibold">{testimonial.author}</p>
                        <p className={`text-sm ${palette.mutedText}`}>{testimonial.role}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto text-center">
            <Chip color="success" variant="bordered" className="mb-4">
              Integrations
            </Chip>
            <h2 className="text-3xl md:text-4xl font-bold">Connect the tools your teams already live in.</h2>
            <p className={`mt-4 mb-10 ${palette.mutedText}`}>
              Two-way sync, events, and APIs keep Aero aligned with finance, CRM, and collaboration stacks.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {integrations.map((logo) => (
                <div key={logo} className={`rounded-2xl px-6 py-4 text-sm font-semibold tracking-wide ${palette.badge}`}>
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <Chip variant="shadow" color="primary" className="mb-4">
                Pricing that scales with you
              </Chip>
              <h2 className="text-4xl font-bold">Transparent, modular, enterprise-ready.</h2>
              <p className={`mt-3 ${palette.mutedText}`}>
                Only pay for the modules and environments you activate. Cancel or expand anytime.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {pricingPlans.map((plan) => (
                <Card key={plan.name} className={`${plan.highlight ? palette.highlightCard : palette.card} h-full`}>
                  <CardBody className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-semibold">{plan.name}</h3>
                      {plan.highlight && (
                        <Chip color="secondary" variant="flat">
                          Most popular
                        </Chip>
                      )}
                    </div>
                    <div>
                      <span className="text-4xl font-extrabold">{plan.price}</span>
                      <span className={`ml-2 ${palette.mutedText}`}>{plan.period}</span>
                    </div>
                    <p className={`${palette.mutedText} flex-1`}>{plan.description}</p>
                    <Link href="/register">
                      <Button className={`py-6 font-semibold ${plan.highlight ? 'bg-white text-slate-900' : 'bg-white/10 text-current'}`}>
                        Start now
                      </Button>
                    </Link>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 px-6">
          <Card className={`max-w-5xl mx-auto text-center ${palette.highlightCard}`}>
            <CardBody className="space-y-8 py-14">
              <Chip variant="flat" color="success">
                Next step
              </Chip>
              <h2 className="text-4xl font-bold">See Aero in action.</h2>
              <p className={`text-lg ${palette.mutedText}`}>
                Book a white-glove demo or spin up a tenant sandbox in 60 seconds. We import data, wire integrations, and configure automations so your teams focus on impact.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-slate-900 font-semibold px-10 py-6">
                    Start free trial
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="bordered" className="border-current px-10 py-6">
                    Talk to sales
                  </Button>
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 text-left">
                {demoStats.map((stat) => (
                  <div key={stat.label} className={`rounded-2xl px-4 py-3 text-sm ${palette.badge}`}>
                    <p className="text-xs uppercase tracking-wide opacity-80">{stat.label}</p>
                    <p className="text-xl font-semibold mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </PublicLayout>
  );
}
