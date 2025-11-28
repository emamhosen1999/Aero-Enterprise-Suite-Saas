import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
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
import PublicLayout from '../../Layouts/PublicLayout';

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
  { name: 'Edge Attendance Terminals', price: '$39 / device', description: 'Biometric devices with secure provisioning.' },
  { name: 'Dedicated Compliance Pods', price: 'Custom', description: 'ISO, HIPAA, SOC2 readiness operations.' },
];

const comparison = [
  { feature: 'Modules included', launch: '2', scale: 'Unlimited', enterprise: 'Unlimited + custom' },
  { feature: 'Automation builder', launch: 'Playbooks', scale: 'Visual builder', enterprise: 'Advanced + SDK' },
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

  return (
    <PublicLayout>
      <div className="text-white">
      <section className="max-w-6xl mx-auto px-6 pt-28 pb-16 text-center">
        <Chip variant="flat" color="success" className="uppercase tracking-[0.3em] text-xs">Pricing</Chip>
        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
          Transparent pricing that scales with every module.
        </h1>
        <p className="text-slate-300 max-w-3xl mx-auto mb-10">
          Activate only the modules you need. Switch plans anytime. Annual contracts include co-building credits and discounted per-module rates.
        </p>
        <div className="flex items-center justify-center gap-3">
          <span className={`text-sm ${annual ? 'text-white' : 'text-slate-400'}`}>Annual (2 months free)</span>
          <Switch isSelected={!annual} onValueChange={() => setAnnual(!annual)} color="secondary" />
          <span className={`text-sm ${!annual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {tierData.map((tier) => (
            <Card
              key={tier.name}
              className={`border ${tier.highlighted ? 'bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-pink-500/20 border-white/30 scale-[1.02]' : 'bg-white/5 border-white/10'}`}
            >
              <CardHeader className="flex flex-col items-start gap-1">
                <p className="text-sm text-slate-400">{tier.highlighted ? 'Most popular' : 'Plan'}</p>
                <h3 className="text-2xl font-semibold">{tier.name}</h3>
              </CardHeader>
              <Divider className="bg-white/10" />
              <CardBody className="space-y-4">
                <div>
                  {tier.custom ? (
                    <p className="text-4xl font-bold">Let’s Talk</p>
                  ) : (
                    <>
                      <span className="text-5xl font-bold">${tier.price}</span>
                      <span className="text-slate-400 text-base ml-2">/user/mo</span>
                      <p className="text-xs text-slate-500">Billed ${(tier.price * multiplier).toFixed(0)}/user/year</p>
                    </>
                  )}
                </div>
                <p className="text-slate-300">{tier.description}</p>
                <ul className="space-y-2 text-sm text-left">
                  {tier.includes.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-slate-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button fullWidth className="mt-4" variant={tier.highlighted ? 'solid' : 'bordered'} color="secondary">
                  {tier.custom ? 'Talk to Sales' : 'Start Trial'}
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-8">Add-ons & services</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {addons.map((addon) => (
              <Card key={addon.name} className="bg-white/5 border border-white/10">
                <CardBody className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-400">Add-on</p>
                    <h3 className="text-xl font-semibold">{addon.name}</h3>
                  </div>
                  <p className="text-emerald-400 font-semibold">{addon.price}</p>
                  <p className="text-sm text-slate-300">{addon.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 bg-slate-900/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-semibold text-center mb-10">Compare plans</h2>
          <div className="overflow-x-auto">
            <Table aria-label="Plan comparison" className="min-w-[800px]">
              <TableHeader>
                <TableColumn>Features</TableColumn>
                <TableColumn>Launch</TableColumn>
                <TableColumn>Scale</TableColumn>
                <TableColumn>Enterprise</TableColumn>
              </TableHeader>
              <TableBody>
                {comparison.map((row) => (
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

      <section className="px-6 pb-16">
        <div className="max-w-4xl mx-auto text-center mb-10">
          <Chip color="primary" variant="flat">FAQ</Chip>
          <h2 className="text-3xl font-semibold mt-4 mb-4">Everything you need to know</h2>
          <p className="text-slate-300">
            We keep pricing transparent. Reach out if you need tailored modules, data residency commitments, or procurement paperwork.
          </p>
        </div>
        <div className="max-w-4xl mx-auto">
          <Accordion variant="splitted" className="bg-transparent">
            {faqs.map((faq) => (
              <AccordionItem key={faq.title} title={faq.title} aria-label={faq.title} className="bg-white/5 border border-white/10 text-white">
                <p className="text-slate-300">{faq.content}</p>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="px-6 pb-20">
        <Card className="max-w-5xl mx-auto text-center bg-gradient-to-r from-emerald-500/30 via-teal-500/20 to-blue-500/20 border border-white/20">
          <CardBody className="space-y-5">
            <Chip variant="flat" color="success">Next Steps</Chip>
            <h3 className="text-4xl font-semibold">Bundle modules, launch faster.</h3>
            <p className="text-slate-100">
              Our pricing team will tailor a package across HR, Projects, Compliance, SCM, and CRM with the right SLAs and integrations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/demo">
                <Button size="lg" className="bg-white text-slate-900 font-semibold px-10">Book a Demo</Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="bordered" className="border-white/40 text-white px-10">Talk to Sales</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </section>
      </div>
    </PublicLayout>
  );
}
