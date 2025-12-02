import React, { useMemo } from 'react';
import { Link, usePage, Head } from '@inertiajs/react';
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
} from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';

const iconMap = {
  people: (
    <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493m-6.564-3.07A6.375 6.375 0 0115 19.235V19.128m0 .106A12.318 12.318 0 018.625 21c-2.331 0-4.512-.645-6.375-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
    </svg>
  ),
  project: (
    <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5A1.125 1.125 0 0121.375 4.125v1.5c0 .621-.504 1.125-1.125 1.125H3.75A1.125 1.125 0 012.625 5.625v-1.5C2.625 3.504 3.129 3 3.75 3zM6 7.5v9a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 16.5v-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11.25v1.5M12 9v4.5m3-6V15" />
    </svg>
  ),
  'shield-check': (
    <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  'inbox-stack': (
    <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h18m-16.5 0L4 17.25a2.25 2.25 0 002.247 2.118h11.506A2.25 2.25 0 0020 17.25L20.5 7.5M8.25 7.5L9 3.75h6L14.25 7.5" />
    </svg>
  ),
  'chart-bar': (
    <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m0 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 015.058 2.772m-10.116 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.941-3.197a5.971 5.971 0 00-.941 3.197" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  chat: (
    <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  ),
  'shopping-cart': (
    <svg className="w-5 h-5 md:w-8 md:h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
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
  
  // Get platform settings from Inertia props
  const { platformSettings } = usePage().props;
  const { metadata = {}, branding = {}, site = {} } = platformSettings || {};
  
  // Use platform settings with fallbacks
  const heroTitle = metadata.hero_title || "All your enterprise modules. One unified platform. No juggling, no silos.";
  const heroSubtitle = metadata.hero_subtitle || "HRM, CRM, ERP, DMS, POS, and more. Purpose-built for midsized organizations that want speed, clarity, and control.";
  const siteName = site.name || "Aero";
  const primaryColor = branding.primary_color || '#3b82f6';
  const accentColor = branding.accent_color || '#8b5cf6';

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
    <PublicLayout mainClassName="pt-0">
      <Head>
        <title>{metadata.meta_title || 'Home'}</title>
        <meta name="description" content={metadata.meta_description || "HRM, CRM, ERP, DMS, POS, and more. Purpose-built for organizations that want speed, clarity, and control."} />
        {metadata.meta_keywords && <meta name="keywords" content={metadata.meta_keywords} />}
        {branding.favicon && <link rel="icon" type="image/x-icon" href={branding.favicon} />}
      </Head>
      
      <div className={`relative ${palette.baseText}`}>
        <section id="hero" className="relative px-4 md:px-6 pt-20 md:pt-32 pb-12 md:pb-24 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? 'bg-gradient-to-br from-blue-600/20 via-purple-500/10 to-cyan-500/10'
                  : 'bg-gradient-to-br from-sky-200/60 via-indigo-100/40 to-cyan-100/40'
              }`}
            />
            <div className="absolute -right-32 top-8 w-48 md:w-72 h-48 md:h-72 bg-blue-500/20 blur-[100px] md:blur-[140px]" />
            <div className="absolute -left-24 bottom-0 w-48 md:w-72 h-48 md:h-72 bg-emerald-400/20 blur-[80px] md:blur-[120px]" />
          </div>
          <div className="relative max-w-6xl mx-auto grid items-center gap-8 md:gap-16 lg:grid-cols-2">
            <div>
              <Chip color="success" variant="flat" className="uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[11px] mb-3 md:mb-6">
                Enterprise ready
              </Chip>
              <h1 className="text-2xl md:text-4xl lg:text-6xl font-bold leading-tight mb-3 md:mb-6">
                {heroTitle}
              </h1>
              <p className={`text-sm md:text-lg ${palette.mutedText} mb-4 md:mb-8`}>
                {heroSubtitle}
              </p>
              <div className="flex flex-wrap gap-2 md:gap-4">
                <Button 
                  as={Link} 
                  href={route('platform.register.index')} 
                  size="sm" 
                  className="text-white font-semibold px-4 md:px-10 py-2 md:py-7 rounded-lg md:rounded-2xl text-xs md:text-base"
                  style={{
                    background: `linear-gradient(to right, ${primaryColor}, ${accentColor})`
                  }}
                >
                  Start Free Trial
                </Button>
                <Button as={Link} href={route('demo')} size="sm" variant="bordered" className="px-3 md:px-9 py-2 md:py-7 rounded-lg md:rounded-2xl border-current text-xs md:text-base">
                  Watch demo
                </Button>
                <Button as="a" href="#modules" size="sm" variant="light" className="px-3 md:px-9 py-2 md:py-7 text-xs md:text-base">
                  Modules
                </Button>
              </div>
              <div className={`mt-3 md:mt-6 text-[10px] md:text-sm ${palette.mutedText}`}>
                No payment required. A rollout architect works with your admins on day one.
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mt-6 md:mt-12">
                {heroStats.map((stat) => (
                  <Card key={stat.label} className={`${palette.card} text-center`}>
                    <CardBody className="p-2 md:p-4">
                      <div className="text-lg md:text-3xl font-bold">{stat.value}</div>
                      <p className={`text-[9px] md:text-xs mt-0.5 md:mt-1 ${palette.mutedText}`}>{stat.label}</p>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
            <motion.div
              initial={{ rotateX: 15, rotateY: -15, opacity: 0 }}
              animate={{ rotateX: 0, rotateY: 0, opacity: 1 }}
              transition={{ duration: 0.9 }}
              className="relative hidden md:block"
            >
              <Card className={palette.panel}>
                <CardBody className="p-3 md:p-6">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <div>
                      <p className={`text-xs md:text-sm ${palette.mutedText}`}>Live operational map</p>
                      <h3 className="text-lg md:text-2xl font-semibold">Command board</h3>
                    </div>
                    <Chip color="secondary" variant="flat" size="sm" className="text-[10px] md:text-xs">
                      Realtime
                    </Chip>
                  </div>
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    {platformModules.slice(0, 4).map((module) => (
                      <Card key={module.name} className={palette.card}>
                        <CardBody className="p-2 md:p-4">
                          <div className={`w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl mb-2 md:mb-3 bg-gradient-to-br ${module.color} flex items-center justify-center text-white`}>
                            {iconMap[module.icon]}
                          </div>
                          <p className="font-semibold text-xs md:text-sm">{module.name}</p>
                          <p className={`text-[10px] md:text-xs mt-0.5 md:mt-1 ${palette.mutedText} line-clamp-2`}>{module.description}</p>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <Divider className={`my-3 md:my-6 ${palette.divider}`} />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm md:text-lg font-semibold">Pulse automations</p>
                      <p className={`text-[10px] md:text-sm ${palette.mutedText}`}>Escalations fire automatically when KPIs drift.</p>
                    </div>
                    <Chip color="primary" variant="flat" size="sm" className="text-[10px] md:text-xs">
                      AI Assist
                    </Chip>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="py-8 md:py-20 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6 md:mb-14">
              <Chip variant="faded" color="success" className="uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[11px] mb-2 md:mb-4">
                Why teams switch
              </Chip>
              <h2 className="text-xl md:text-4xl font-bold">Operations stay in sync when everyone shares the same record.</h2>
              <p className={`mt-2 md:mt-3 text-xs md:text-lg ${palette.mutedText}`}>
                Ready-to-run playbooks and shared dashboards remove the late-night spreadsheet scramble.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
              {productHighlights.map((highlight) => (
                <Card key={highlight.title} className={`${palette.card} h-full`}>
                  <CardBody className="p-3 md:p-6">
                    <p className={`text-xs md:text-sm font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>{highlight.stat}</p>
                    <h3 className="text-sm md:text-xl font-semibold mt-1 md:mt-3">{highlight.title}</h3>
                    <p className={`mt-1 md:mt-2 text-xs md:text-base ${palette.mutedText}`}>{highlight.description}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="problems" className={`py-8 md:py-20 px-4 md:px-6 ${palette.tint}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4 md:mb-12">
              <Chip variant="faded" color="warning" className="uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[11px] mb-2 md:mb-4">
                Reality check
              </Chip>
              <h2 className="text-xl md:text-4xl font-bold">The blockers we keep hearing.</h2>
              <p className={`mt-1 md:mt-3 text-xs md:text-base ${palette.mutedText}`}>We built Aero to remove the friction that slows down enterprise execution.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-6">
              {problemStatements.map((problem) => (
                <Card key={problem.title} className={`${palette.card} h-full`}>
                  <CardBody className="p-2 md:p-6">
                    <h3 className="text-xs md:text-xl font-semibold mb-1 md:mb-2">{problem.title}</h3>
                    <p className={`text-[10px] md:text-base ${palette.mutedText} leading-tight`}>{problem.detail}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section id="modules" className="py-8 md:py-20 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6 md:mb-16">
              <Chip color="secondary" variant="flat" className="mb-2 md:mb-4 text-[10px] md:text-xs">
                Modular Platform
              </Chip>
              <h2 className="text-xl md:text-4xl font-bold">Complete enterprise coverage, modular by design.</h2>
              <p className={`mt-1 md:mt-3 text-xs md:text-lg ${palette.mutedText}`}>
                Each module includes specialized submodules. Activate what you need, expand as you grow.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
              {platformModules.map((module) => (
                <Card key={module.name} className={`${palette.card} h-full group hover:scale-[1.02] transition-transform`}>
                  <CardBody className="p-2 md:p-6">
                    <div className={`w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white mb-2 md:mb-4`}>
                      {iconMap[module.icon]}
                    </div>
                    <h3 className="text-xs md:text-xl font-semibold">{module.name}</h3>
                    <p className={`text-[9px] md:text-xs ${palette.mutedText} mb-1 md:mb-2`}>{module.shortName}</p>
                    <p className={`mt-1 md:mt-2 text-[10px] md:text-base ${palette.mutedText} leading-tight line-clamp-2`}>{module.description}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6 md:mt-10">
              <Button as={Link} href={route('features')} variant="bordered" className="border-current text-xs md:text-base px-4 md:px-8 py-2 md:py-6">
                Explore all module features
              </Button>
            </div>
          </div>
        </section>

        <section className={`py-8 md:py-20 px-4 md:px-6 ${isDarkMode ? 'bg-slate-950/50' : 'bg-white'}`}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6 md:mb-14">
              <Chip color="primary" variant="flat" className="mb-2 md:mb-4 text-[10px] md:text-xs">
                Rollout framework
              </Chip>
              <h2 className="text-xl md:text-4xl font-bold">From discovery to scale with one guided runway.</h2>
            </div>
            <div className="space-y-2 md:space-y-6">
              {rolloutPhases.map((phase, index) => (
                <Card key={phase.title} className={palette.card}>
                  <CardBody className="flex flex-col gap-2 md:gap-4 lg:flex-row lg:items-center lg:justify-between p-3 md:p-6">
                    <div>
                      <p className={`text-[10px] md:text-sm ${palette.mutedText}`}>Phase {index + 1}</p>
                      <h3 className="text-sm md:text-2xl font-semibold mb-1 md:mb-2">{phase.title}</h3>
                      <p className={`text-[10px] md:text-base ${palette.mutedText} leading-tight`}>{phase.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {phase.artifacts.map((artifact) => (
                        <Chip key={artifact} size="sm" color="secondary" variant="flat" className="text-[9px] md:text-xs h-5 md:h-6">
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

        <section className="py-8 md:py-20 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4 md:mb-12">
              <Chip color="secondary" variant="faded" className="mb-2 md:mb-4 text-[10px] md:text-xs">
                Sense → Sync loop
              </Chip>
              <h2 className="text-xl md:text-4xl font-bold">How the Aero signal loop keeps everyone aligned.</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {workflowTimeline.map((stage, index) => (
                <Card key={stage.step} className={`${palette.card} h-full`}>
                  <CardBody className="space-y-1 md:space-y-3 p-2 md:p-4">
                    <div className="flex items-center gap-1 md:gap-3">
                      <Chip size="sm" color="secondary" variant="flat" className="text-[9px] md:text-xs h-4 md:h-6 min-w-0 px-1.5 md:px-2">
                        {index + 1}
                      </Chip>
                      <h3 className="text-xs md:text-lg font-semibold">{stage.step}</h3>
                    </div>
                    <p className={`text-[10px] md:text-sm ${palette.mutedText} leading-tight`}>{stage.caption}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className={`py-8 md:py-20 px-4 md:px-6 ${palette.tint}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4 md:mb-12">
              <Chip color="primary" variant="flat" className="mb-2 md:mb-4 text-[10px] md:text-xs">
                Vertical starter packs
              </Chip>
              <h2 className="text-xl md:text-4xl font-bold">Industry templates that ship with relevant automations.</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-2 md:gap-6">
              {industryStarters.map((starter) => (
                <Card key={starter.industry} className={`${palette.card} h-full`}>
                  <CardBody className="space-y-2 md:space-y-4 p-3 md:p-6">
                    <div>
                      <p className={`text-[10px] md:text-sm ${palette.mutedText}`}>Starter pack</p>
                      <h3 className="text-sm md:text-2xl font-semibold">{starter.industry}</h3>
                    </div>
                    <p className={`text-[10px] md:text-base ${palette.mutedText} leading-tight`}>{starter.description}</p>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {starter.badges.map((badge) => (
                        <span key={badge} className={`text-[9px] md:text-xs font-semibold px-1.5 md:px-3 py-0.5 md:py-1 rounded-full ${palette.badge}`}>
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

        <section className="py-8 md:py-20 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col gap-3 md:gap-6 md:flex-row md:items-center md:justify-between mb-4 md:mb-12">
              <div>
                <Chip variant="flat" color="secondary" className="mb-2 md:mb-4 text-[10px] md:text-xs">
                  Customer stories
                </Chip>
                <h2 className="text-xl md:text-4xl font-bold">Trusted by builders, hospitals, and public agencies.</h2>
              </div>
              <Button as={Link} href={route('resources')} variant="bordered" className="border-current text-xs md:text-base px-3 md:px-6 py-2 md:py-4">
                Browse case studies
              </Button>
            </div>
            <div className="grid md:grid-cols-3 gap-2 md:gap-6">
              {testimonialSlides.map((testimonial) => (
                <Card key={testimonial.author} className={`${palette.card} h-full`}>
                  <CardBody className="flex flex-col gap-2 md:gap-4 p-3 md:p-6">
                    <p className={`text-xs md:text-lg ${palette.mutedText}`}>"{testimonial.quote}"</p>
                    <div className="flex items-center gap-2 md:gap-4">
                      <Avatar name={testimonial.author} color="secondary" size="sm" className="w-6 h-6 md:w-10 md:h-10" />
                      <div>
                        <p className="font-semibold text-xs md:text-base">{testimonial.author}</p>
                        <p className={`text-[10px] md:text-sm ${palette.mutedText}`}>{testimonial.role}</p>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8 md:py-20 px-4 md:px-6">
          <div className="max-w-6xl mx-auto text-center">
            <Chip color="success" variant="bordered" className="mb-2 md:mb-4 text-[10px] md:text-xs">
              Integrations
            </Chip>
            <h2 className="text-xl md:text-3xl lg:text-4xl font-bold">Connect the tools your teams already live in.</h2>
            <p className={`mt-2 md:mt-4 mb-4 md:mb-10 text-xs md:text-base ${palette.mutedText}`}>
              Seamless data sync keeps Aero aligned with your finance, sales, and collaboration tools.
            </p>
            <div className="grid grid-cols-4 md:grid-cols-4 gap-2 md:gap-4">
              {integrations.map((logo) => (
                <div key={logo} className={`rounded-lg md:rounded-2xl px-2 md:px-6 py-2 md:py-4 text-[10px] md:text-sm font-semibold tracking-wide ${palette.badge}`}>
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="py-8 md:py-20 px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6 md:mb-14">
              <Chip variant="shadow" color="primary" className="mb-2 md:mb-4 text-[10px] md:text-xs">
                Pricing that scales with you
              </Chip>
              <h2 className="text-xl md:text-4xl font-bold">Transparent, modular, enterprise-ready.</h2>
              <p className={`mt-1 md:mt-3 text-xs md:text-base ${palette.mutedText}`}>
                Only pay for the modules and environments you activate. Cancel or expand anytime.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-2 md:gap-6">
              {pricingPlans.map((plan) => (
                <Card key={plan.name} className={`${plan.highlight ? palette.highlightCard : palette.card} h-full`}>
                  <CardBody className="flex flex-col gap-2 md:gap-4 p-3 md:p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg md:text-2xl font-semibold">{plan.name}</h3>
                      {plan.highlight && (
                        <Chip color="secondary" variant="flat" size="sm" className="text-[9px] md:text-xs">
                          Most popular
                        </Chip>
                      )}
                    </div>
                    <div>
                      <span className="text-2xl md:text-4xl font-extrabold">{plan.price}</span>
                      <span className={`ml-1 md:ml-2 text-xs md:text-base ${palette.mutedText}`}>{plan.period}</span>
                    </div>
                    <p className={`${palette.mutedText} flex-1 text-xs md:text-base`}>{plan.description}</p>
                    <Button as={Link} href={route('platform.register.index')} className={`py-2 md:py-6 font-semibold text-xs md:text-base ${plan.highlight ? 'bg-white text-slate-900' : 'bg-white/10 text-current'}`} size="sm">
                      Start now
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8 md:py-24 px-4 md:px-6">
          <Card className={`max-w-5xl mx-auto text-center ${palette.highlightCard}`}>
            <CardBody className="space-y-3 md:space-y-8 py-6 md:py-14 px-4 md:px-8">
              <Chip variant="flat" color="success" className="text-[10px] md:text-xs">
                Next step
              </Chip>
              <h2 className="text-xl md:text-4xl font-bold">See Aero in action.</h2>
              <p className={`text-xs md:text-lg ${palette.mutedText}`}>
                Book a personalized demo or start your free trial in 60 seconds. We handle data import, connect your tools, and set up automations so your teams focus on impact.
              </p>
              <div className="flex flex-wrap gap-2 md:gap-4 justify-center">
                <Button as={Link} href={route('platform.register.index')} size="sm" className="bg-white text-slate-900 font-semibold px-4 md:px-10 py-2 md:py-6 text-xs md:text-base">
                  Start free trial
                </Button>
                <Button as={Link} href={route('contact')} size="sm" variant="bordered" className="border-current px-4 md:px-10 py-2 md:py-6 text-xs md:text-base">
                  Talk to sales
                </Button>
              </div>
              <div className="grid gap-2 md:gap-4 grid-cols-3 text-left">
                {demoStats.map((stat) => (
                  <div key={stat.label} className={`rounded-lg md:rounded-2xl px-2 md:px-4 py-1.5 md:py-3 text-[9px] md:text-sm ${palette.badge}`}>
                    <p className="text-[8px] md:text-xs uppercase tracking-wide opacity-80">{stat.label}</p>
                    <p className="text-sm md:text-xl font-semibold mt-0.5 md:mt-1">{stat.value}</p>
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
