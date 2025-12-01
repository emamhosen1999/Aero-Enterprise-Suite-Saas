import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Tabs,
  Tab,
} from '@heroui/react';
import {
  platformModules,
  productHighlights,
  rolloutPhases,
  workflowTimeline,
  industryStarters,
  testimonialSlides,
} from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Contexts/ThemeContext.jsx';

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

const sectionTitle = (label, eyebrow) => (
  <div className="max-w-4xl mx-auto text-center mb-14">
    <Chip variant="faded" color="secondary" className="mb-3 uppercase tracking-[0.25em] text-[11px]">
      {eyebrow}
    </Chip>
    <h2 className="text-4xl font-semibold text-white leading-tight">{label}</h2>
  </div>
);

export default function Product() {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur-xl'
      : 'bg-white border border-slate-200 shadow-sm',
    panel: isDarkMode
      ? 'bg-slate-950/80 border border-white/10 shadow-2xl'
      : 'bg-white border border-slate-200 shadow-xl',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    highlight: isDarkMode
      ? 'bg-gradient-to-br from-blue-600/20 via-purple-600/15 to-cyan-500/10 border border-white/20'
      : 'bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-50 border border-slate-200 shadow-lg',
    badge: isDarkMode
      ? 'bg-white/10 border border-white/20 text-white'
      : 'bg-white border border-slate-200 text-slate-700',
    divider: isDarkMode ? 'bg-white/10' : 'bg-slate-200',
  }), [isDarkMode]);

  return (
    <PublicLayout mainClassName="pt-0">
      <div className={`relative ${palette.baseText}`}>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className={`absolute inset-0 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-600/20 via-indigo-500/10 to-cyan-500/10'
                : 'bg-gradient-to-br from-sky-200/60 via-indigo-100/40 to-cyan-100/40'
            }`}
          />
          <div className="absolute -right-32 top-8 w-72 h-72 bg-blue-500/20 blur-[140px]" />
          <div className="absolute -left-24 bottom-0 w-72 h-72 bg-emerald-400/20 blur-[120px]" />
        </div>
        <section className="relative max-w-6xl mx-auto px-6 pt-28 pb-20 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <Chip color="success" variant="flat" className="mb-5">Modular Enterprise OS</Chip>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              Keep HR, projects, compliance, and finance in sync.
            </h1>
            <p className={`text-lg mb-8 ${palette.mutedText}`}>
              Each Aero module shares the same data, so adding HR, project tracking, compliance, or supply chain happens without migrations, complex setup, or custom work.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button as={Link} href={route('platform.register.index')} size="lg" className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-8">
                Start Free Trial
              </Button>
              <Button as={Link} href={route('demo')} size="lg" variant="bordered" className="border-current px-8">
                See Live Demo
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-5 text-left">
              {productHighlights.map((item) => (
                <Card key={item.title} className={palette.card}>
                  <CardBody>
                    <p className={`text-sm mb-2 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>{item.stat}</p>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className={`text-sm ${palette.mutedText}`}>{item.description}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <Card className={palette.panel}>
              <CardHeader className="flex flex-col items-start gap-1">
                <p className={`text-sm ${palette.mutedText}`}>Live Operations View</p>
                <h3 className="text-2xl font-semibold">Unified Dashboard</h3>
              </CardHeader>
              <Divider className={palette.divider} />
              <CardBody className="grid grid-cols-2 gap-4">
                {platformModules.map((module) => (
                  <div
                    key={module.name}
                    className={`rounded-2xl p-4 ${
                      isDarkMode
                        ? 'border border-white/5 bg-white/5'
                        : 'border border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl mb-3 bg-gradient-to-br ${module.color} flex items-center justify-center text-white`}>
                      {iconMap[module.icon]}
                    </div>
                    <p className="font-semibold">{module.name}</p>
                    <p className={`text-xs mt-1 ${palette.mutedText}`}>{module.description}</p>
                  </div>
                ))}
              </CardBody>
            </Card>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-500/30 blur-3xl" />
            <div className="absolute -bottom-10 -left-6 w-36 h-36 bg-cyan-500/30 blur-3xl" />
          </motion.div>
        </section>
      </div>

      <section className="py-20 px-6">
        {sectionTitle('Pick modules like building blocks, not monoliths.', 'Composable Suite')}
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {platformModules.map((module) => (
            <Card key={module.name} className={`${palette.card} h-full`}>
              <CardBody>
                <div className={`w-12 h-12 rounded-xl mb-5 bg-gradient-to-br ${module.color} flex items-center justify-center text-white`}>
                  {iconMap[module.icon]}
                </div>
                <h3 className="text-xl font-semibold mb-2">{module.name}</h3>
                <p className={`text-sm ${palette.mutedText}`}>{module.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className={`py-20 px-6 ${palette.tint}`}>
        {sectionTitle('From discovery to scale with one guided runway.', 'Rollout Framework')}
        <div className="max-w-5xl mx-auto space-y-6">
          {rolloutPhases.map((phase, idx) => (
            <Card key={phase.title} className={palette.card}>
              <CardBody>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <p className={`text-sm ${palette.mutedText}`}>Phase {idx + 1}</p>
                    <h3 className="text-2xl font-semibold mb-2">{phase.title}</h3>
                    <p className={palette.mutedText}>{phase.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {phase.artifacts.map((artifact) => (
                      <Chip key={artifact} size="sm" color="secondary" variant="flat">{artifact}</Chip>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20 px-6">
        {sectionTitle('How the Aero signal loop keeps everyone in sync.', 'Sense → Sync Loop')}
        <div className="max-w-6xl mx-auto">
          <Tabs variant="underlined" color="secondary" classNames={{ tabList: 'bg-transparent justify-center' }}>
            {workflowTimeline.map((item) => (
              <Tab key={item.step} title={item.step} className="text-left">
                <Card className={`${palette.card} max-w-4xl mx-auto`}>
                  <CardBody>
                    <h3 className="text-2xl font-semibold mb-3">{item.step}</h3>
                    <p className={palette.mutedText}>{item.caption}</p>
                  </CardBody>
                </Card>
              </Tab>
            ))}
          </Tabs>
        </div>
      </section>

      <section className={`py-20 px-6 ${palette.tint}`}>
        {sectionTitle('Industry starter packs ship with relevant automations.', 'Vertical DNA')}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {industryStarters.map((starter) => (
            <Card key={starter.industry} className={`${palette.card} h-full`}>
              <CardBody className="space-y-4">
                <div>
                  <p className={`text-sm ${palette.mutedText}`}>Starter Pack</p>
                  <h3 className="text-2xl font-semibold">{starter.industry}</h3>
                </div>
                <p className={palette.mutedText}>{starter.description}</p>
                <div className="flex flex-wrap gap-2">
                  {starter.badges.map((badge) => (
                    <Chip key={badge} color="primary" variant="flat" size="sm">{badge}</Chip>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-20 px-6">
        {sectionTitle('Proof in execution.', 'Customer Signals')}
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {testimonialSlides.map((slide) => (
            <Card key={slide.author} className={`${palette.card} h-full`}>
              <CardBody className="flex flex-col gap-4">
                <p className={`text-lg ${palette.mutedText}`}>“{slide.quote}”</p>
                <div>
                  <p className="font-semibold">{slide.author}</p>
                  <p className={`text-sm ${palette.mutedText}`}>{slide.role}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-24 px-6">
        <Card className={`max-w-5xl mx-auto text-center ${palette.highlight}`}>
          <CardBody className="space-y-6">
            <Chip variant="flat" color="success">Next Step</Chip>
            <h3 className="text-4xl font-semibold">
              Plug Aero into your workflows in weeks, not quarters.
            </h3>
            <p className={`${palette.mutedText} max-w-3xl mx-auto`}>
              Co-build your rollout with our Solution Architects. We import data, wire integrations, and configure automations so your teams focus on impact.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button as={Link} href={route('demo')} size="lg" className="bg-white text-slate-900 font-semibold px-10">
                Book a Guided Demo
              </Button>
              <Button as={Link} href={route('pricing')} size="lg" variant="bordered" className="border-current px-10">
                Explore Pricing
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
      </div>
    </PublicLayout>
  );
}
