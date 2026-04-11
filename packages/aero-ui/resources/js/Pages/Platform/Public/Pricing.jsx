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
    description: 'Ideal for teams proving value quickly with a focused first rollout.',
    includes: ['Up to 2 business areas', 'Guided launch support', 'Community help'],
  },
  {
    name: 'Scale',
    price: 20,
    highlighted: true,
    description: 'Most chosen plan for growing companies that need one shared way of working.',
    includes: ['All business areas', 'Built-in best practices', 'Priority support', 'Leadership insights'],
  },
  {
    name: 'Enterprise',
    price: 0,
    custom: true,
    description: 'Best for larger organizations that need dedicated support and tailored agreements.',
    includes: ['Dedicated success lead', 'Private setup option', 'Custom business policies'],
  },
];

const addons = [
  { name: 'Executive Insight Companion', price: '$4 / user', description: 'Guided recommendations that help leaders make faster and better decisions.' },
  { name: 'Attendance Devices', price: '$39 / device', description: 'Simple attendance capture for frontline teams with clear daily visibility.' },
  { name: 'Dedicated Business Advisory', price: 'Custom', description: 'Hands-on advisory support for change management and rollout planning.' },
];

const featureComparison = [
  { feature: 'Business areas included', launch: '2', scale: 'All', enterprise: 'All + tailored' },
  { feature: 'Process support', launch: 'Guided start', scale: 'Built-in playbooks', enterprise: 'Tailored approach' },
  { feature: 'Leadership insights', launch: 'Core', scale: 'Advanced', enterprise: 'Advanced + custom' },
  { feature: 'Support response', launch: '< 12 hrs', scale: '< 4 hrs', enterprise: 'Dedicated support line' },
  { feature: 'Service model', launch: 'Managed', scale: 'Managed', enterprise: 'Managed or private setup' },
];

const faqs = [
  {
    title: 'How does pricing work?',
    content: 'Pricing is based on active users and selected business areas. You can expand your package as your needs grow. Annual plans include two months at no extra cost.',
  },
  {
    title: 'Can we run pilot and live operations at the same time?',
    content: 'Yes. You can start with a pilot group while the rest of your business prepares for launch. We support phased rollouts by team or location.',
  },
  {
    title: 'What is the minimum commitment?',
    content: 'Monthly plans are flexible with no long-term commitment. Enterprise agreements are typically set as annual multi-year contracts.',
  },
  {
    title: 'How is rollout support priced?',
    content: 'Launch and Scale include structured onboarding support. Larger rollouts can add fixed-fee advisory services based on scope and timeline.',
  },
];

const deploymentOptions = [
  {
    name: 'Managed Service',
    summary: 'A fast way to launch with expert guidance and continuous support.',
    points: ['Quick start', 'Lower operating effort', 'Easy business scaling'],
    cta: 'Start Cloud Trial',
    href: 'platform.register.index',
  },
  {
    name: 'Private Company Setup',
    summary: 'A private option for organizations with internal policy requirements.',
    points: ['Private setup option', 'Policy alignment', 'Flexible long-term growth'],
    cta: 'View Standalone Options',
    href: 'platform.standalone',
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
            Clear pricing for growing businesses, with flexible options as you scale.
          </h1>
          <p className={`max-w-3xl mx-auto mb-6 md:mb-10 text-sm md:text-lg ${palette.mutedText}`}>
            Compare packages quickly, then choose the service model that fits your business goals.
          </p>
          <div className="flex items-center justify-center gap-2 md:gap-3">
            <span className={`text-xs md:text-sm ${annual ? 'font-semibold' : palette.mutedText}`}>Annual (2 months free)</span>
            <Switch isSelected={!annual} onValueChange={() => setAnnual(!annual)} color="secondary" aria-label="Toggle billing cadence" />
            <span className={`text-xs md:text-sm ${!annual ? 'font-semibold' : palette.mutedText}`}>Monthly</span>
          </div>
        </div>
      </section>

      <section id="deployment-models" className="px-4 md:px-6 pb-8 md:pb-14">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4 md:gap-6">
          {deploymentOptions.map((model) => (
            <Card key={model.name} className={palette.card}>
              <CardBody className="space-y-3 md:space-y-4">
                <div>
                  <p className={`text-xs md:text-sm ${palette.mutedText}`}>Service model</p>
                  <h2 className="text-xl md:text-2xl font-semibold">{model.name}</h2>
                </div>
                <p className={`text-sm md:text-base ${palette.mutedText}`}>{model.summary}</p>
                <div className="space-y-2">
                  {model.points.map((point) => (
                    <div key={point} className="flex items-center gap-2 text-sm md:text-base">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <Button
                    as={Link}
                    href={route(model.href)}
                    variant="bordered"
                    className="border-current font-semibold"
                    data-cta-name={model.name === 'Cloud SaaS' ? 'pricing_cloud_trial' : 'pricing_standalone_options'}
                    data-cta-location="pricing_deployment_tracks"
                    data-cta-destination={model.href}
                    data-experiment-key="pricing_deployment_tracks"
                  >
                    {model.cta}
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
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
                    <p className="text-3xl md:text-4xl font-bold">Contact Sales</p>
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
                <Button
                  as={Link}
                  href={tier.custom ? route('platform.contact') : route('platform.register.index')}
                  fullWidth
                  className="mt-2"
                  variant={tier.highlighted ? 'solid' : 'bordered'}
                  color="secondary"
                  data-cta-name={tier.custom ? 'pricing_tier_talk_to_sales' : 'pricing_tier_start_cloud_trial'}
                  data-cta-location={`pricing_tier_${tier.name.toLowerCase()}`}
                  data-cta-destination={tier.custom ? 'platform.contact' : 'platform.register.index'}
                  data-experiment-key="pricing_tier_cards"
                >
                  {tier.custom ? 'Talk to Sales' : 'Start Cloud Trial'}
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
                <TableColumn>Products</TableColumn>
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
            <Chip color="secondary" variant="flat" className="mb-2 md:mb-3 text-[10px] md:text-xs">Support Infrastructure</Chip>
            <h2 className="text-xl md:text-3xl font-semibold">Enterprise support channels with committed response times.</h2>
            <p className={`mt-2 text-sm md:text-base ${palette.mutedText}`}>Every plan includes clear support paths. Enterprise adds dedicated advisory coverage for priority teams.</p>
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
            <Chip color="primary" variant="flat" className="mb-2 md:mb-3 text-[10px] md:text-xs">Response Commitments</Chip>
            <h2 className="text-xl md:text-3xl font-semibold">Defined response targets by plan tier.</h2>
          </div>
          <div className="overflow-x-auto">
            <Table aria-label="Response commitment matrix" className="min-w-[700px]">
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
          <Chip color="primary" variant="flat" className="text-[10px] md:text-xs">Frequently Asked Questions</Chip>
          <h2 className="text-xl md:text-3xl font-semibold mt-3 md:mt-4 mb-3 md:mb-4">Common questions about pricing and commercial terms</h2>
          <p className={`text-sm md:text-base ${palette.mutedText}`}>
            Pricing is designed to be transparent and predictable. Contact our team for a tailored package and procurement support.
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
            <h3 className="text-2xl md:text-4xl font-semibold">Choose the right package and start seeing value quickly.</h3>
            <p className={`text-sm md:text-base ${palette.mutedText}`}>
              Our commercial team will help you select the right business areas, support level, and rollout pace.
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
                href={route('platform.demo')}
                size="sm"
                className={isDarkMode ? 'bg-white text-slate-900 font-semibold px-6 md:px-10' : 'bg-slate-900 text-white font-semibold px-6 md:px-10'}
                data-cta-name="book_demo"
                data-cta-location="pricing_final_cta"
                data-cta-destination="platform.demo"
                data-experiment-key="pricing_final_cta"
              >
                Book a Growth Demo
              </Button>
              <Button
                as={Link}
                href={route('platform.contact')}
                size="sm"
                variant="bordered"
                className="border-current px-6 md:px-10"
                data-cta-name="talk_to_sales"
                data-cta-location="pricing_final_cta"
                data-cta-destination="platform.contact"
                data-experiment-key="pricing_final_cta"
              >
                Talk to an Advisor
              </Button>
              <Button
                as={Link}
                href={route('platform.standalone')}
                size="sm"
                variant="bordered"
                className="border-current px-6 md:px-10"
                data-cta-name="standalone_options"
                data-cta-location="pricing_final_cta"
                data-cta-destination="platform.standalone"
                data-experiment-key="pricing_final_cta"
              >
                Private Setup Options
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
      </div>
    </PublicLayout>
  );
}
