import React, { useMemo } from 'react';
import { Link, Head } from '@inertiajs/react';
import SafeLink from '@/Components/Common/SafeLink';
import { hasRoute, safeRoute, safeNavigate, safePost, safePut, safeDelete } from '@/utils/routeUtils';
import { motion } from 'framer-motion';
import { useBranding } from '@/Hooks/useBranding';
import {
  Card,
  CardBody,
  Chip,
  Avatar,
  Button,
} from '@heroui/react';
import {
  heroStats,
  missionValues,
  timelineMilestones,
  leadershipTeam,
  globalImpactStats,
  partnerLogos,
} from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const About = () => {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { siteName } = useBranding();

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur'
      : 'bg-white border border-slate-200 shadow-sm',
    gradientCard: isDarkMode
      ? 'bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-500/20 border border-white/10'
      : 'bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-100 border border-slate-200 shadow-md',
    impactGradient: isDarkMode
      ? 'bg-gradient-to-b from-slate-900 to-slate-950'
      : 'bg-gradient-to-b from-slate-50 to-slate-100',
    tint: isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50',
    badgeBorder: isDarkMode ? 'border-white/40 text-white' : 'border-slate-300 text-slate-700',
    partner: isDarkMode
      ? 'p-5 bg-white/5 border border-white/10 rounded-2xl text-lg font-semibold tracking-wide'
      : 'p-5 bg-white border border-slate-200 rounded-2xl text-lg font-semibold tracking-wide shadow-sm',
    cultureCard: isDarkMode
      ? 'bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-pink-500/20 border border-white/20'
      : 'bg-gradient-to-r from-amber-100 via-orange-100 to-pink-100 border border-slate-200 shadow-lg',
    divider: isDarkMode ? 'border-white/10' : 'border-slate-200',
  }), [isDarkMode]);

  return (
    <PublicLayout mainClassName="pt-0">
      <Head title="About" />
      <div className={palette.baseText}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className={`absolute inset-0 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-600/20 via-indigo-500/10 to-cyan-500/20'
                : 'bg-gradient-to-br from-sky-200/60 via-indigo-100/40 to-cyan-100/40'
            }`}
          />
          <div className="absolute -right-20 top-12 w-48 md:w-72 h-48 md:h-72 bg-blue-500/20 blur-[100px] md:blur-[140px]" />
          <div className="absolute -left-16 bottom-0 w-48 md:w-72 h-48 md:h-72 bg-emerald-400/20 blur-[100px] md:blur-[140px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-20 md:pt-28 pb-10 md:pb-20 grid lg:grid-cols-2 gap-6 md:gap-12 items-center">
          <div>
            <Chip color="secondary" variant="flat" className="uppercase tracking-[0.2em] md:tracking-[0.35em] text-[10px] md:text-xs">About</Chip>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight mt-3 md:mt-5 mb-3 md:mb-6">
              We built Aero after running operations teams that had to juggle too many systems.
            </h1>
            <p className={`text-sm md:text-lg ${palette.mutedText}`}>
              The platform exists because our own HR, project, compliance, and finance leads were stuck reconciling spreadsheets and multiple tools. Aero keeps that work in one place across HRM, CRM, Finance, Projects, Inventory, POS, Supply Chain, Quality, DMS, and Compliance—the same modules listed in products.php—so decisions stay grounded in fresh data.
            </p>
            <div className="flex flex-wrap gap-2 md:gap-4 mt-4 md:mt-8">
              <Button as={Link} href={route('platform.register.index')} size="sm" className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-4 md:px-8 text-xs md:text-base">
                Start free trial
              </Button>
              <Button as={Link} href={route('demo')} size="sm" variant="bordered" className="border-current px-4 md:px-8 text-xs md:text-base">
                See live demo
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 md:gap-4 mt-6 md:mt-10">
              {heroStats.map((stat) => (
                <Card key={stat.label} className={palette.card}>
                  <CardBody className="p-2 md:p-4">
                    <p className="text-xl md:text-3xl font-bold">{stat.value}</p>
                    <p className={`text-[10px] md:text-xs mt-0.5 md:mt-1 ${palette.mutedText}`}>{stat.label}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative hidden md:block"
          >
            <Card className={palette.gradientCard}>
              <CardBody className="space-y-4 md:space-y-6 p-4 md:p-6">
                <p className={`text-[10px] md:text-sm uppercase tracking-[0.3em] md:tracking-[0.4em] ${palette.mutedText}`}>Field Notes</p>
                <h3 className="text-lg md:text-2xl font-semibold">From siloed spreadsheets to a unified operations view.</h3>
                <p className={`text-sm md:text-base ${palette.mutedText}`}>
                  We shadowed HR leaders, project coordinators, compliance managers, and CFOs across Asia, the Middle East, and North America. Every team wanted the same thing: one system that could adapt as fast as their operations. Aero is the answer.
                </p>
              </CardBody>
            </Card>
            <div className="absolute -top-8 -right-10 w-36 h-36 bg-purple-500/30 blur-3xl" />
            <div className="absolute -bottom-10 -left-8 w-40 h-40 bg-cyan-500/30 blur-3xl" />
          </motion.div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-10 md:pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-14">
            <Chip variant="flat" color="success" className="uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs">Values</Chip>
            <h2 className="text-xl md:text-4xl font-semibold mt-2 md:mt-4">Principles guiding every launch.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-2 md:gap-6">
            {missionValues.map((value) => (
              <Card key={value.title} className={palette.card}>
                <CardBody className="p-3 md:p-6">
                  <h3 className="text-sm md:text-xl font-semibold mb-1 md:mb-2">{value.title}</h3>
                  <p className={`${palette.mutedText} text-xs md:text-sm`}>{value.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className={`px-4 md:px-6 pb-10 md:pb-20 ${palette.tint}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 md:mb-12">
            <Chip color="primary" variant="flat" className="text-[10px] md:text-xs">Timeline</Chip>
            <h2 className="text-xl md:text-4xl font-semibold mt-2 md:mt-4">Milestones that shaped Aero.</h2>
          </div>
          <div className={`space-y-3 md:space-y-6 border-l ${palette.divider} pl-4 md:pl-8 relative`}>
            {timelineMilestones.map((milestone, index) => (
              <div key={milestone.year} className="relative">
                <div className={`absolute -left-[25px] md:-left-[41px] top-1 w-4 h-4 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 md:border-4 ${
                  isDarkMode ? 'border-slate-900' : 'border-white'
                }`} />
                <Card className={palette.card}>
                  <CardBody className="space-y-1 md:space-y-2 p-2 md:p-4">
                    <p className={`text-xs md:text-sm ${palette.mutedText}`}>{milestone.year}</p>
                    <h3 className="text-sm md:text-2xl font-semibold">{milestone.headline}</h3>
                    <p className={`${palette.mutedText} text-xs md:text-base`}>{milestone.detail}</p>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-10 md:pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-6 mb-4 md:mb-10">
            <div>
              <Chip color="secondary" variant="flat" className="mb-1 md:mb-3 text-[10px] md:text-xs">Leadership</Chip>
              <h2 className="text-xl md:text-4xl font-semibold">People shaping the platform.</h2>
            </div>
            <SafeLink route="careers" className={`${palette.mutedText} hover:text-current text-xs md:text-base`}>Meet the wider team â†’</SafeLink>
          </div>
          <div className="grid md:grid-cols-2 gap-2 md:gap-6">
            {leadershipTeam.map((leader) => (
              <Card key={leader.name} className={palette.card}>
                <CardBody className="flex items-start gap-2 md:gap-4 p-2 md:p-4">
                  <Avatar name={leader.avatar} size="md" color="secondary" className="text-sm md:text-lg shrink-0" />
                  <div>
                    <h3 className="text-sm md:text-xl font-semibold">{leader.name}</h3>
                    <p className={`text-xs md:text-sm ${palette.mutedText}`}>{leader.title}</p>
                    <p className={`${palette.mutedText} text-xs md:text-sm mt-1 md:mt-3`}>{leader.focus}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className={`px-4 md:px-6 pb-10 md:pb-20 ${palette.impactGradient}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-14">
            <Chip color="success" variant="flat" className="text-[10px] md:text-xs">Impact</Chip>
            <h2 className="text-xl md:text-4xl font-semibold mt-2 md:mt-4">Global footprint, measurable outcomes.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6">
            {globalImpactStats.map((stat) => (
              <Card key={stat.label} className={`${palette.card} text-center`}>
                <CardBody className="p-2 md:p-4">
                  <p className="text-xl md:text-3xl font-bold">{stat.value}</p>
                  <p className={`text-xs md:text-sm mt-0.5 md:mt-2 ${palette.mutedText}`}>{stat.label}</p>
                  <p className={`text-[10px] md:text-xs mt-0.5 md:mt-1 ${palette.mutedText}`}>{stat.detail}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-10 md:pb-20">
        <div className="max-w-5xl mx-auto text-center">
          <Chip color="primary" variant="flat" className="text-[10px] md:text-xs">Allies</Chip>
          <h2 className="text-lg md:text-3xl font-semibold mt-2 md:mt-4 mb-4 md:mb-8">Building with technology partners you trust.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
            {partnerLogos.map((logo) => (
              <div key={logo} className={`${palette.partner} text-xs md:text-base`}>
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-10 md:pb-20">
        <Card className={`max-w-5xl mx-auto text-center ${palette.cultureCard}`}>
          <CardBody className="space-y-5">
            <Chip variant="flat" color="warning">Culture</Chip>
            <h3 className="text-4xl font-semibold">We believe transformation should feel human.</h3>
            <p className={`${palette.mutedText} max-w-3xl mx-auto`}>
              Enterprise software should respect frontline teams, executives, and partners alike. Thatâ€™s why Aero combines automation with empathy, data transparency, and design systems that make complex operations feel intuitive.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              <Button as={Link} href={route('demo')} size="sm" className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-6 md:px-10">
                Book a demo
              </Button>
              <Button as={Link} href={route('contact')} size="sm" variant="bordered" className={`px-6 md:px-10 ${palette.badgeBorder}`}>
                Talk to sales
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
      </div>
    </PublicLayout>
  );
};

export default About;

