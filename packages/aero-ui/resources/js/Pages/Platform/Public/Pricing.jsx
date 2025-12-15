import React, { useMemo, useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import { useBranding } from '@/Hooks/useBranding';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Switch,
  Accordion,
  AccordionItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@heroui/react';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { supportChannels, slaMatrix, demoSteps } from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';

const tierData = [
  {
    name: 'Launch',
    price: 12,
    description: 'For pilot squads validating value in weeks.',
    includes: ['2 modules included', 'Guided onboarding', 'Community support'],
  },
  {
    name: 'Scale',
    price: 20,
    highlighted: true,
    description: 'Most popular. Full automation layer with advanced analytics.',
    includes: ['Unlimited modules', 'Automation builder', 'Premium support', 'AI copilots'],
  },
  {
    name: 'Enterprise',
    price: 0,
    custom: true,
    description: 'Global rollouts, dedicated pods, and private cloud controls.',
    includes: ['Dedicated CSM', 'Private cloud / GovCloud', 'Custom compliance packs'],
  },
];

const addons = [
  { name: 'AI Incident Copilot', price: '$4 / user', description: 'Generative guidance for audits, incidents, and RCA.' },
  { name: 'Edge Attendance Terminals', price: '$39 / device', description: 'Biometric devices with secure setup and management.' },
  { name: 'Dedicated Compliance Pods', price: 'Custom', description: 'ISO, HIPAA, SOC2 readiness operations.' },
];

const featureComparison = [
  { feature: 'Modules included', launch: '2', scale: 'Unlimited', enterprise: 'Unlimited + custom' },
  { feature: 'Automation builder', launch: 'Playbooks', scale: 'Visual builder', enterprise: 'Advanced + Custom' },
  { feature: 'AI assistants', launch: 'Insights digest', scale: 'Risk + forecast', enterprise: 'Predictive + custom models' },
  { feature: 'Support response', launch: '< 12 hrs', scale: '< 4 hrs', enterprise: 'Dedicated pod' },
  { feature: 'Hosting', launch: 'Shared cloud', scale: 'Dedicated region', enterprise: 'Private cloud / Gov / On-prem' },
];

const faqs = [
  {
    title: 'How does per-module billing work?',
    content: 'Each active module is priced per user per month. Archive modules anytime. Annual plans include 2 months free.',
  },
  {
    title: 'Can we mix environments (prod, sandbox, regions)?',
    content: 'Yes. Sandbox is free. Additional production regions are billed at 50% of your base per-module price.',
  },
  {
    title: 'What is the minimum contract length?',
    content: 'Monthly plans have no lock-in. Enterprise plans often opt for 12-36 month agreements with rate guarantees.',
  },
  {
    title: 'How are implementation services billed?',
    content: 'Launch and Scale get onboarding included. Larger rollouts can add fixed-fee pods or ongoing managed services.',
  },
];

export default function Pricing() {
  const [annual, setAnnual] = useState(true);
  const multiplier = annual ? 10 : 12; // 2 months free yearly
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { siteName } = useBranding();

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur-xl'
      : 'bg-white border border-slate-200 shadow-sm',
    highlightCard: isDarkMode
      ? 'bg-gradient-to-br from-blue-600/25 via-purple-600/20 to-pink-500/10 border border-white/30 shadow-xl'
      : 'bg-gradient-to-br from-blue-100 via-purple-100 to-pink-50 border border-slate-200 shadow-lg',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    badge: isDarkMode
      ? 'bg-white/10 border border-white/20 text-white'
      : 'bg-white border border-slate-200 text-slate-700',
    divider: isDarkMode ? 'bg-white/10' : 'bg-slate-200',
    panel: isDarkMode
      ? 'bg-white/5 border border-white/10'
      : 'bg-white border border-slate-200 shadow-sm',
    link: isDarkMode ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900',
    accentButton: isDarkMode ? 'bg-white text-slate-900 font-semibold' : 'bg-slate-900 text-white font-semibold',
  }), [isDarkMode]);

  return (
    <PublicLayout mainClassName="pt-0">
      <Head title="Pricing" />
      <div className={`relative ${palette.baseText}`}>
      <section className="relative max-w-6xl mx-auto px-4 md:px-6 pt-20 md:pt-28 pb-8 md:pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className={`absolute inset-0 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-teal-500/10'
                : 'bg-gradient-to-br from-sky-100/60 via-indigo-100/40 to-teal-100/50'
            }`}
          />
          <div className="absolute -left-24 top-10 w-72 h-72 bg-emerald-400/20 blur-[140px]" />
          <div className="absolute -right-32 bottom-8 w-72 h-72 bg-blue-500/20 blur-[160px]" />
        </div>
        <div className="relative">
          <Chip variant="flat" color="success" className="uppercase tracking-[0.3em] text-[10px] md:text-xs">Pricing</Chip>
          <h1 className="text-2xl md:text-5xl font-bold mt-3 md:mt-4 mb-4 md:mb-6">
            Pricing built around the modules you actually use.
          </h1>
          <p className={`max-w-3xl mx-auto mb-6 md:mb-10 text-sm md:text-lg ${palette.mutedText}`}>
            Pick monthly or annual billing, add modules when teams are ready, and pause what you are not using without renegotiating a contract.
          </p>
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <span className={`text-xs md:text-sm ${annual ? 'font-semibold' : palette.mutedText}`}>Annual (2 months free)</span>
            <Switch isSelected={!annual} onValueChange={() => setAnnual(!annual)} color="secondary" aria-label="Toggle billing cadence" />
            <span className={`text-xs md:text-sm ${!annual ? 'font-semibold' : palette.mutedText}`}>Monthly</span>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-8 md:pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4 md:gap-6">
          {tierData.map((tier) => (
            <Card
              key={tier.name}
              className={tier.highlighted ? palette.highlightCard : palette.card}
            >
              <CardHeader className="flex flex-col items-start gap-1">
                <p className={`text-xs md:text-sm ${palette.mutedText}`}>{tier.highlighted ? 'Most popular' : 'Plan'}</p>
                <h3 className="text-xl md:text-2xl font-semibold">{tier.name}</h3>
              </CardHeader>
              <Divider className={palette.divider} />
              <CardBody className="space-y-3 md:space-y-4">
                <div>
                  {tier.custom ? (
                    <p className="text-3xl md:text-4xl font-bold">Let's Talk</p>
                  ) : (
                    <>
                      <span className="text-4xl md:text-5xl font-bold">${tier.price}</span>
                      <span className={`text-sm md:text-base ml-2 ${palette.mutedText}`}>/user/mo</span>
                      <p className={`text-[10px] md:text-xs ${palette.mutedText}`}>Billed ${(tier.price * multiplier).toFixed(0)}/user/year</p>
                    </>
                  )}
                </div>
                <p className={`text-sm md:text-base ${palette.mutedText}`}>{tier.description}</p>
                <ul className="space-y-1.5 md:space-y-2 text-xs md:text-sm text-left">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button as={Link} href={tier.custom ? route('contact') : route('platform.register.index')} fullWidth className="mt-2" variant={tier.highlighted ? 'solid' : 'bordered'} color="secondary">
                  {tier.custom ? 'Talk to Sales' : 'Start Trial'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-6 pb-8 md:pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-5 md:mb-8">Add-ons & services</h2>
          <div className="grid md:grid-cols-3 gap-3 md:gap-5">
            {addons.map((addon) => (
              <Card key={addon.name} className={palette.card}>
                <CardBody className="space-y-2 md:space-y-3">
                  <div>
                    <p className={`text-xs md:text-sm ${palette.mutedText}`}>Add-on</p>
                    <h3 className="text-base md:text-xl font-semibold">{addon.name}</h3>
                  </div>
                  <p className="text-sm md:text-base text-emerald-500 font-semibold">{addon.price}</p>
                  <p className={`text-xs md:text-sm ${palette.mutedText}`}>{addon.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className={`px-4 md:px-6 pb-8 md:pb-16 ${palette.tint}`}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-semibold text-center mb-6 md:mb-10">Feature comparison</h2>
          <div className="overflow-x-auto">
            <Table aria-label="Plan comparison" className="min-w-[800px]">
              <TableHeader>
                <TableColumn>Features</TableColumn>
                <TableColumn>Launch</TableColumn>
                <TableColumn>Scale</TableColumn>
                <TableColumn>Enterprise</TableColumn>
              </TableHeader>
              <TableBody>
                {featureComparison.map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell>{row.feature}</TableCell>
                    <TableCell>{row.launch}</TableCell>
                    <TableCell>{row.scale}</TableCell>
                    <TableCell>{row.enterprise}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-8 md:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-12">
            <Chip color="secondary" variant="flat" className="mb-2 md:mb-3 text-[10px] md:text-xs">Support fabric</Chip>
            <h2 className="text-xl md:text-3xl font-semibold">Channels backed by clear response times.</h2>
            <p className={`mt-2 text-sm md:text-base ${palette.mutedText}`}>Every plan ships with a dedicated escalation path. Enterprise adds private pods and Slack Connect.</p>
          </div>
          <div className="grid gap-3 md:gap-6 md:grid-cols-2">
            {supportChannels.map((channel) => (
              <Card key={channel.label} className={`${palette.card} h-full`}>
                <CardBody className="space-y-1.5 md:space-y-2">
                  <h3 className="text-base md:text-xl font-semibold">{channel.label}</h3>
                  <p className={`text-sm md:text-base ${palette.mutedText}`}>{channel.description}</p>
                  <Chip color="success" variant="flat" size="sm" className="w-fit">{channel.response}</Chip>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className={`px-4 md:px-6 pb-8 md:pb-16 ${palette.tint}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-6 md:mb-10">
            <Chip color="primary" variant="flat" className="mb-2 md:mb-3 text-[10px] md:text-xs">SLA Matrix</Chip>
            <h2 className="text-xl md:text-3xl font-semibold">Response commitments per plan.</h2>
          </div>
          <div className="overflow-x-auto">
            <Table aria-label="SLA matrix" className="min-w-[700px]">
              <TableHeader>
                <TableColumn>Severity</TableColumn>
                <TableColumn>Launch</TableColumn>
                <TableColumn>Scale</TableColumn>
                <TableColumn>Enterprise</TableColumn>
              </TableHeader>
              <TableBody>
                {slaMatrix.map((row) => (
                  <TableRow key={row.severity}>
                    <TableCell>{row.severity}</TableCell>
                    <TableCell>{row.launch}</TableCell>
                    <TableCell>{row.scale}</TableCell>
                    <TableCell>{row.enterprise}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-8 md:pb-16">
        <div className="max-w-4xl mx-auto text-center mb-6 md:mb-10">
          <Chip color="primary" variant="flat" className="text-[10px] md:text-xs">FAQ</Chip>
          <h2 className="text-xl md:text-3xl font-semibold mt-3 md:mt-4 mb-3 md:mb-4">Everything you need to know</h2>
          <p className={`text-sm md:text-base ${palette.mutedText}`}>
            We keep pricing transparent. Reach out if you need tailored modules, data residency commitments, or procurement paperwork.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <Accordion variant="splitted" className="bg-transparent">
            {faqs.map((faq) => (
              <AccordionItem
                key={faq.title}
                title={faq.title}
                aria-label={faq.title}
                className={isDarkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-white border border-slate-200 text-slate-900 shadow-sm'}
              >
                <p className={palette.mutedText}>{faq.content}</p>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-10 md:pb-20">
        <Card className={`max-w-5xl mx-auto text-center ${palette.highlightCard}`}>
          <CardBody className="space-y-4 md:space-y-6">
            <Chip variant="flat" color="success" className="text-[10px] md:text-xs">Next Steps</Chip>
            <h3 className="text-2xl md:text-4xl font-semibold">Bundle modules, launch faster.</h3>
            <p className={`text-sm md:text-base ${palette.mutedText}`}>
              Our pricing team will tailor a package across HR, Projects, Compliance, SCM, and CRM with the right SLAs and integrations.
            </p>
            <div className="grid gap-2 md:gap-4 md:grid-cols-3 text-left">
              {demoSteps.map((step) => (
                <div key={step.step} className={`rounded-2xl px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm ${palette.badge}`}>
                  <p className="text-[10px] md:text-xs uppercase tracking-widest opacity-80">{step.step}</p>
                  <p className="font-semibold mt-1">{step.description}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              <Button
                as={Link}
                href={route('demo')}
                size="sm"
                className={isDarkMode ? 'bg-white text-slate-900 font-semibold px-6 md:px-10' : 'bg-slate-900 text-white font-semibold px-6 md:px-10'}
              >
                Book a Demo
              </Button>
              <Button as={Link} href={route('contact')} size="sm" variant="bordered" className="border-current px-6 md:px-10">
                Talk to Sales
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
      </div>
    </PublicLayout>
  );
}
