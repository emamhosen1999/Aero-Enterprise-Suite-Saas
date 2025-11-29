import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Button, Card, CardBody, Chip, Divider } from '@heroui/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Contexts/ThemeContext.jsx';
import {
  productHighlights,
  platformModules,
  workflowTimeline,
  industryStarters,
} from '@/constants/marketing';

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

export default function Features() {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur-xl'
      : 'bg-white border border-slate-200 shadow-sm',
    highlightCard: isDarkMode
      ? 'bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-cyan-500/20 border border-white/20'
      : 'bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-50 border border-slate-200 shadow-lg',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    badge: isDarkMode
      ? 'bg-white/10 border border-white/20 text-white'
      : 'bg-white border border-slate-200 text-slate-700',
  }), [isDarkMode]);

  return (
    <PublicLayout mainClassName="pt-0">
      <div className={`relative ${palette.baseText}`}>
        <section className="relative px-6 pt-28 pb-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600/20 via-purple-600/10 to-cyan-500/15'
                  : 'bg-gradient-to-r from-sky-200/60 via-indigo-100/40 to-cyan-100/40'
              }`}
            />
            <div className="absolute -right-24 top-10 w-72 h-72 bg-blue-500/20 blur-[140px]" />
            <div className="absolute -left-14 bottom-0 w-72 h-72 bg-emerald-400/20 blur-[140px]" />
          </div>
          <div className="relative max-w-6xl mx-auto grid gap-12 lg:grid-cols-2">
            <div>
              <Chip color="secondary" variant="flat" className="uppercase tracking-[0.35em] text-xs">
                FEATURES
              </Chip>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight mt-4 mb-6">
                Every module shares the same live workflow engine.
              </h1>
              <p className={`text-lg ${palette.mutedText} mb-8`}>
                HR, projects, compliance, and supplier teams plug into Aero's shared data model, so automations, analytics, and approvals work the same everywhere.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/demo">
                  <Button size="lg" className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-10">
                    Walk through the platform
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="lg" variant="bordered" className="border-current px-10">
                    Start a trial
                  </Button>
                </Link>
              </div>
            </div>
            <Card className={palette.card}>
              <CardBody className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${palette.mutedText}`}>Signal loop</p>
                    <h3 className="text-2xl font-semibold">Sense - Decide - Sync</h3>
                  </div>
                  <Chip color="success" variant="flat">Realtime</Chip>
                </div>
                <Divider className="bg-white/10" />
                <div className="grid gap-4 sm:grid-cols-2">
                  {productHighlights.map((item) => (
                    <Card key={item.title} className={`${palette.card} h-full`}>
                      <CardBody className="space-y-3">
                        <p className={`text-sm font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>{item.stat}</p>
                        <h4 className="text-lg font-semibold">{item.title}</h4>
                        <p className={`text-sm ${palette.mutedText}`}>{item.description}</p>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto text-center mb-10">
            <Chip color="primary" variant="flat">Modules</Chip>
            <h2 className="text-3xl font-semibold mt-4">Activate only the stacks you need.</h2>
            <p className={`mt-3 ${palette.mutedText}`}>
              Each module taps into the same permissions, automations, and analytics so rollouts stay predictable.
            </p>
          </div>
          <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {platformModules.map((module) => (
              <Card key={module.name} className={`${palette.card} h-full`}>
                <CardBody className="space-y-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white`}>
                    {iconMap[module.icon]}
                  </div>
                  <h3 className="text-xl font-semibold">{module.name}</h3>
                  <p className={palette.mutedText}>{module.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className={`px-6 pb-16 ${palette.tint}`}>
          <div className="max-w-5xl mx-auto text-center mb-12">
            <Chip color="success" variant="flat">Workflow engine</Chip>
            <h2 className="text-3xl font-semibold mt-4">One loop keeps everyone aligned.</h2>
            <p className={`mt-3 ${palette.mutedText}`}>
              Signals feed AI insights, automations sync the right systems, dashboards show exactly what changed.
            </p>
          </div>
          <div className="max-w-5xl mx-auto grid md:grid-cols-4 gap-4">
            {workflowTimeline.map((stage, index) => (
              <Card key={stage.step} className={palette.card}>
                <CardBody className="space-y-3">
                  <Chip color="secondary" variant="flat" size="sm">{index + 1}</Chip>
                  <h3 className="text-lg font-semibold">{stage.step}</h3>
                  <p className={palette.mutedText}>{stage.caption}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto text-center mb-10">
            <Chip color="warning" variant="flat">Vertical packs</Chip>
            <h2 className="text-3xl font-semibold mt-4">Industry templates that ship ready.</h2>
          </div>
          <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-2">
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
        </section>

        <section className="px-6 pb-24">
          <Card className={`max-w-5xl mx-auto text-center ${palette.highlightCard}`}>
            <CardBody className="space-y-5">
              <Chip color="primary" variant="flat">Next steps</Chip>
              <h3 className="text-4xl font-semibold">Pick modules today, add more tomorrow.</h3>
              <p className={palette.mutedText}>
                Grab a guided tour to see the automations you care about or launch a no-card-required trial right away.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/demo">
                  <Button className={isDarkMode ? 'bg-white text-slate-900 font-semibold px-10' : 'bg-slate-900 text-white font-semibold px-10'}>
                    Book a live demo
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="bordered" className="border-current px-10">Start free trial</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </PublicLayout>
  );
}
