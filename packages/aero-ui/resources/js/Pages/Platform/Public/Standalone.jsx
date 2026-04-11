import React, { useMemo } from 'react';
import { Link, Head } from '@inertiajs/react';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const deploymentTopologies = [
  {
    name: 'Single-Country Operations',
    detail: 'A focused setup for organizations operating in one primary market.',
  },
  {
    name: 'Regional Group Operations',
    detail: 'A coordinated setup for companies managing multiple countries or business units.',
  },
  {
    name: 'High-Control Operations',
    detail: 'A private operating model for organizations with stricter internal governance needs.',
  },
];

const enterpriseControls = [
  'Greater control over internal business policies',
  'Ownership of customer and business records',
  'Flexible rollout pace by region or department',
  'Alignment with internal review requirements',
  'Hands-on rollout planning and change support',
  'Leadership enablement and adoption support',
];

const implementationPhases = [
  {
    phase: 'Phase 1',
    title: 'Business Readiness Review',
    detail: 'Define priorities, timelines, and success measures with your leadership team.',
  },
  {
    phase: 'Phase 2',
    title: 'Launch Foundation',
    detail: 'Set up teams, approvals, and operating rules for a smooth first launch.',
  },
  {
    phase: 'Phase 3',
    title: 'Team Migration and Adoption',
    detail: 'Move priority teams and processes in waves while maintaining daily continuity.',
  },
  {
    phase: 'Phase 4',
    title: 'Scale and Optimize',
    detail: 'Expand to more teams and locations while improving outcomes each quarter.',
  },
];

export default function Standalone() {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur-xl'
      : 'bg-white border border-slate-200 shadow-sm',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    gradient: isDarkMode
      ? 'bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-cyan-500/20 border border-white/15'
      : 'bg-gradient-to-br from-blue-100 via-indigo-50 to-cyan-50 border border-slate-200 shadow-lg',
  }), [isDarkMode]);

  return (
    <PublicLayout mainClassName="pt-0">
      <Head title="Private Business Setup" />
      <div className={palette.baseText}>
        <section className="relative overflow-hidden px-4 md:px-6 pt-20 md:pt-28 pb-10 md:pb-16">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-br from-blue-600/20 via-slate-900/10 to-emerald-500/10' : 'bg-gradient-to-br from-sky-100/70 via-indigo-100/40 to-emerald-100/50'}`} />
            <div className="absolute -right-20 top-8 w-72 h-72 bg-blue-500/20 blur-[140px]" />
            <div className="absolute -left-20 bottom-0 w-72 h-72 bg-emerald-400/20 blur-[140px]" />
          </div>

          <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 md:gap-10 items-start">
            <div>
              <Chip color="warning" variant="flat" className="uppercase tracking-[0.3em] text-[10px] md:text-xs">Private Setup</Chip>
              <h1 className="text-2xl md:text-5xl font-bold mt-3 md:mt-5 mb-4 md:mb-6">
                A private setup for organizations that need stronger internal control.
              </h1>
              <p className={`text-sm md:text-lg ${palette.mutedText}`}>
                Run Aero in a private company setup while keeping one shared way of working across teams.
              </p>
              <div className="flex flex-wrap gap-2 md:gap-4 mt-6 md:mt-8">
                <Button
                  as={Link}
                  href={route('platform.contact')}
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold"
                  size="sm"
                  data-cta-name="talk_to_enterprise_team"
                  data-cta-location="standalone_hero"
                  data-cta-destination="platform.contact"
                  data-experiment-key="standalone_hero_cta"
                >
                  Talk to a Business Advisor
                </Button>
                <Button
                  as={Link}
                  href={route('platform.demo')}
                  variant="bordered"
                  className="border-current font-semibold"
                  size="sm"
                  data-cta-name="request_business_demo"
                  data-cta-location="standalone_hero"
                  data-cta-destination="platform.demo"
                  data-experiment-key="standalone_hero_cta"
                >
                  Book a Business Demo
                </Button>
                <Button
                  as={Link}
                  href={route('platform.register.index')}
                  variant="light"
                  size="sm"
                  data-cta-name="need_cloud_instead"
                  data-cta-location="standalone_hero"
                  data-cta-destination="platform.register.index"
                  data-experiment-key="standalone_hero_cta"
                >
                  Need Managed Service?
                </Button>
              </div>
            </div>

            <Card className={palette.gradient}>
              <CardBody className="space-y-3 md:space-y-4 p-4 md:p-6">
                <h2 className="text-lg md:text-2xl font-semibold">What you get in private setup</h2>
                <div className="space-y-2">
                  {enterpriseControls.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 mt-2" aria-hidden />
                      <p className={`text-sm md:text-base ${palette.mutedText}`}>{item}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        <section className={`px-4 md:px-6 py-8 md:py-12 ${palette.tint}`}>
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6 md:mb-10">
              <Chip color="primary" variant="flat" className="text-[10px] md:text-xs">Business Setup Options</Chip>
              <h2 className="text-xl md:text-3xl font-semibold mt-3 md:mt-4">Choose the setup that fits your operating model.</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
              {deploymentTopologies.map((item) => (
                <Card key={item.name} className={palette.card}>
                  <CardBody className="space-y-2">
                    <h3 className="text-base md:text-xl font-semibold">{item.name}</h3>
                    <p className={`text-sm ${palette.mutedText}`}>{item.detail}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 md:px-6 py-8 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-6 md:mb-10">
              <Chip color="secondary" variant="flat" className="text-[10px] md:text-xs">Implementation Path</Chip>
              <h2 className="text-xl md:text-3xl font-semibold mt-3 md:mt-4">A structured rollout built for business continuity.</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5">
              {implementationPhases.map((phase) => (
                <Card key={phase.phase} className={palette.card}>
                  <CardBody className="space-y-2">
                    <Chip size="sm" color="secondary" variant="flat" className="w-fit text-[10px] md:text-xs">
                      {phase.phase}
                    </Chip>
                    <h3 className="text-base md:text-lg font-semibold">{phase.title}</h3>
                    <p className={`text-sm ${palette.mutedText}`}>{phase.detail}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 md:px-6 pb-12 md:pb-20">
          <Card className={`max-w-5xl mx-auto text-center ${palette.gradient}`}>
            <CardBody className="space-y-3 md:space-y-5">
              <Chip color="success" variant="flat" className="text-[10px] md:text-xs">Next Step</Chip>
              <h3 className="text-2xl md:text-4xl font-semibold">Plan your private setup with our business advisory team.</h3>
              <p className={`text-sm md:text-base ${palette.mutedText}`}>
                We will provide a practical plan for launch order, team readiness, and measurable business outcomes.
              </p>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                <Button
                  as={Link}
                  href={route('platform.contact')}
                  size="sm"
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold"
                  data-cta-name="contact_enterprise_sales"
                  data-cta-location="standalone_final_cta"
                  data-cta-destination="platform.contact"
                  data-experiment-key="standalone_final_cta"
                >
                  Talk to a Business Advisor
                </Button>
                <Button
                  as={Link}
                  href={route('platform.demo')}
                  size="sm"
                  variant="bordered"
                  className="border-current font-semibold"
                  data-cta-name="schedule_business_demo"
                  data-cta-location="standalone_final_cta"
                  data-cta-destination="platform.demo"
                  data-experiment-key="standalone_final_cta"
                >
                  Book a Business Demo
                </Button>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </PublicLayout>
  );
}
