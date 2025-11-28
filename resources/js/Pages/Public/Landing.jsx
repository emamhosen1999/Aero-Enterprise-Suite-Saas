import React from 'react';
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
import PublicLayout from '../../Layouts/PublicLayout';

// Icons as inline SVGs for better presentation
const HRIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
  </svg>
);

const ProjectIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
  </svg>
);

const ComplianceIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
  </svg>
);

const InventoryIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>
);

const CRMIcon = () => (
  <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const modules = [
  { name: 'HR Management', description: 'Complete employee lifecycle, attendance, payroll, and leave management', icon: HRIcon, color: 'from-blue-500 to-cyan-500' },
  { name: 'Project Management', description: 'Plan, track, and deliver projects with milestones, tasks, and resources', icon: ProjectIcon, color: 'from-purple-500 to-pink-500' },
  { name: 'Compliance & Quality', description: 'Regulatory compliance, audits, inspections, and quality standards', icon: ComplianceIcon, color: 'from-emerald-500 to-teal-500' },
  { name: 'Inventory & SCM', description: 'Stock management, procurement, suppliers, and supply chain optimization', icon: InventoryIcon, color: 'from-orange-500 to-amber-500' },
  { name: 'Analytics & Reports', description: 'Real-time dashboards, KPIs, and comprehensive business intelligence', icon: AnalyticsIcon, color: 'from-rose-500 to-red-500' },
  { name: 'CRM & Helpdesk', description: 'Customer relationships, tickets, and support management', icon: CRMIcon, color: 'from-indigo-500 to-violet-500' },
];

const problemStatements = [
  { title: 'Siloed Departments', detail: 'Data is trapped across HR, Finance, and Projects causing blind spots and slow decisions.' },
  { title: 'Manual Compliance', detail: 'Audits, policies, and ISO/OHS paperwork drain teams every quarter.' },
  { title: 'Fragmented Tools', detail: 'Teams juggle 7+ disconnected apps with overlapping licenses and no shared source of truth.' },
  { title: 'Delayed Insights', detail: 'Leadership waits weeks for performance dashboards and financial KPIs.' },
];

const howItWorks = [
  { step: '01', title: 'Discover & Configure', detail: 'Select modules, map departments, and tailor workflows in minutes.' },
  { step: '02', title: 'Invite Teams', detail: 'Bulk onboard employees, clients, and partners with SSO and role templates.' },
  { step: '03', title: 'Automate & Integrate', detail: 'Connect Slack, SAP, QuickBooks, and 20+ services to orchestrate data flows.' },
  { step: '04', title: 'Monitor & Optimize', detail: 'Interactive boards, AI nudges, and predictive analytics keep execution on-track.' },
];

const benefits = [
  { stat: '42%', label: 'Faster project delivery', detail: 'Automated approvals and real-time dependencies reduce waiting loops.' },
  { stat: '63%', label: 'Manual tasks eliminated', detail: 'Workflows replace spreadsheets, emails, and redundant tools.' },
  { stat: '3x', label: 'Leadership visibility', detail: 'Exec dashboards merge finance, people, and operations in one glass pane.' },
];

const integrations = ['Slack', 'Teams', 'SAP', 'QuickBooks', 'Salesforce', 'Oracle', 'Jira', 'HubSpot'];

const testimonials = [
  {
    company: 'Velocity Build Co.',
    quote: 'Aero unified our HQ and 18 sites. We cut reporting cycles from 10 days to 3 hours.',
    person: 'Anika Rahman',
    role: 'COO',
  },
  {
    company: 'Nimbus Hospitals',
    quote: 'Clinical, HR, and compliance teams finally run on the same playbook.',
    person: 'Dr. Omar Chowdhury',
    role: 'Group Director',
  },
  {
    company: 'Atlas Logistics',
    quote: 'The modular pricing let us scale region by region with zero downtime.',
    person: 'Liam Carter',
    role: 'VP Operations',
  },
];

const pricingPlans = [
  { name: 'Launch', price: 'Custom', period: '', description: 'Ideal for pilots and rapid PoCs. Includes 2 modules + onboarding squad.', highlight: false },
  { name: 'Scale', price: '$20', period: '/module/month', description: 'Core suite with automation, analytics, and premium support.', highlight: true },
  { name: 'Enterprise', price: 'Let’s Talk', period: '', description: 'Global rollouts, dedicated CSM, private cloud, and custom SLAs.', highlight: false },
];

export default function Landing() {
  const anchorNavLinks = [
    { type: 'anchor', href: '#modules', label: 'Modules' },
    { type: 'anchor', href: '#pricing', label: 'Plans' },
  ];

  return (
    <PublicLayout extraNavLinks={anchorNavLinks} mainClassName="pt-0">
      <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(99,102,241,0.5) 1px, transparent 0)', backgroundSize: '80px 80px' }} />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-cyan-500/10" />
        </div>

        {/* Hero Section */}
        <section id="hero" className="relative pt-32 pb-32 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <Chip color="success" variant="shadow" className="mb-6 uppercase tracking-[0.3em] text-xs bg-emerald-500/20 border border-emerald-400/40">14-Day Trial · Database per tenant</Chip>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              <span className="text-white">Aero Enterprise Suite</span>
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">The operating system for modern enterprises.</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 leading-relaxed">
              Power every department—HR, Projects, Compliance, SCM, Finance—with one modular, multi-tenant platform. Built with Laravel, Inertia, and HeroUI for relentless speed, security, and elegance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-10 py-7 rounded-2xl shadow-2xl shadow-blue-500/40">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact" >
                <Button size="lg" variant="bordered" className="border-white/40 text-white px-9 py-7 rounded-2xl">
                  Request a Demo
                </Button>
              </Link>
              <a href="#modules">
                <Button size="lg" variant="light" className="text-slate-200 px-9 py-7">
                  Learn More
                </Button>
              </a>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14">
              {[
                { value: '10+', label: 'Intelligent modules' },
                { value: '99.95%', label: 'Uptime over 24 months' },
                { value: '22', label: 'Global rollouts' },
                { value: '3.5x', label: 'Faster decision cycles' },
              ].map((stat) => (
                <Card key={stat.label} className="bg-white/5 border border-white/10 backdrop-blur-xl">
                  <CardBody className="text-center">
                    <div className="text-2xl font-bold text-white">{stat.value}</div>
                    <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>

          <div className="relative">
            <motion.div
              initial={{ rotateX: 15, rotateY: -15, opacity: 0 }}
              animate={{ rotateX: 0, rotateY: 0, opacity: 1 }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="relative" style={{ perspective: '1200px' }}>
                <div
                  className="bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-white/10 rounded-3xl p-6 shadow-2xl shadow-blue-500/30"
                  style={{ transformStyle: 'preserve-3d', transform: 'rotateX(8deg) rotateY(-8deg)' }}
                >
                  <div className="grid grid-cols-2 gap-4">
                    {modules.slice(0, 4).map((module) => (
                      <Card key={module.name} className="bg-white/5 border border-white/10">
                        <CardBody>
                          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white mb-3`}>
                            <module.icon />
                          </div>
                          <p className="text-sm font-semibold text-white">{module.name}</p>
                          <p className="text-xs text-slate-300 mt-1">{module.description.substring(0, 40)}...</p>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                  <Divider className="my-6 bg-white/10" />
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-3xl font-bold">Live KPI Board</p>
                      <p className="text-sm text-slate-400">AI flags schedule and compliance risks before they escalate.</p>
                    </div>
                    <Chip variant="flat" color="secondary">Real-time</Chip>
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/40 rounded-full blur-3xl" />
            <div className="absolute -bottom-14 -left-10 w-52 h-52 bg-cyan-500/30 rounded-full blur-3xl" />
          </div>
        </div>
        </section>

        {/* Problem Statement */}
        <section id="problems" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Chip color="warning" className="mb-4" variant="faded">Why companies switch</Chip>
            <h2 className="text-4xl font-bold mb-4">Operations shouldn’t feel like stitching spreadsheets</h2>
            <p className="text-slate-300 text-lg">Aero eliminates the top blockers slowing down enterprise execution.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {problemStatements.map((problem) => (
              <Card key={problem.title} className="bg-white/5 border border-white/10 backdrop-blur-xl hover:translate-y-[-6px] transition-transform">
                <CardBody>
                  <h3 className="text-xl font-semibold text-white mb-2">{problem.title}</h3>
                  <p className="text-slate-400">{problem.detail}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
        </section>

        {/* Modules Section */}
        <section id="modules" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Chip color="secondary" className="mb-4" variant="flat">Modular architecture</Chip>
            <h2 className="text-4xl font-bold mb-4">Every department, one visual command center</h2>
            <p className="text-slate-300 text-lg">Pick only the modules you need today. Activate more as you scale—no migrations needed.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => (
              <Card key={module.name} className="bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all">
                <CardBody>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white mb-4`}>
                    <module.icon />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{module.name}</h3>
                  <p className="text-slate-400 mt-2">{module.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Chip color="primary" variant="faded" className="mb-4">How Aero flows</Chip>
            <h2 className="text-4xl font-bold mb-4">Launch in weeks, not quarters</h2>
            <p className="text-slate-300">A guided rollout with automation blueprints and success architects.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {howItWorks.map((step) => (
              <Card key={step.step} className="bg-white/5 border border-white/10">
                <CardBody>
                  <div className="flex items-center gap-4 mb-3">
                    <Chip variant="solid" color="secondary">{step.step}</Chip>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                  </div>
                  <p className="text-slate-400">{step.detail}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
        </section>

        {/* Benefits */}
        <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <motion.div key={benefit.label} whileHover={{ scale: 1.03 }}>
                <Card className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 border border-white/10">
                  <CardBody>
                    <div className="text-4xl font-bold text-white">{benefit.stat}</div>
                    <h4 className="text-lg font-semibold mt-3">{benefit.label}</h4>
                    <p className="text-slate-300 mt-2">{benefit.detail}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
        </section>

        {/* Integrations */}
        <section id="integrations" className="py-20 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Chip color="success" className="mb-4" variant="bordered">Plays well with leaders</Chip>
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Connect Arsenal of Enterprise Tools</h2>
          <p className="text-slate-300 mb-10">Two-way sync, events, and APIs keep Aero aligned with finance, CRM, and collaboration stacks.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {integrations.map((logo) => (
              <div key={logo} className="p-6 rounded-2xl bg-white/5 border border-white/10 text-lg font-semibold text-white tracking-wider">
                {logo}
              </div>
            ))}
          </div>
        </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
            <div>
              <Chip variant="flat" color="secondary" className="mb-4">Customer stories</Chip>
              <h2 className="text-4xl font-bold">Trusted by builders, hospitals, and governments</h2>
            </div>
            <Button variant="bordered" className="border-white/30 text-white">Download case studies</Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.company} className="bg-white/5 border border-white/10 h-full">
                <CardBody className="flex flex-col gap-4">
                  <p className="text-slate-200 text-lg">“{testimonial.quote}”</p>
                  <div className="flex items-center gap-4">
                    <Avatar name={testimonial.person} color="secondary" />
                    <div>
                      <p className="font-semibold">{testimonial.person}</p>
                      <p className="text-sm text-slate-400">{testimonial.role} · {testimonial.company}</p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <Chip variant="shadow" color="primary" className="mb-4">Pricing that scales with you</Chip>
            <h2 className="text-4xl font-bold mb-4">Transparent, modular, enterprise-ready</h2>
            <p className="text-slate-300">Only pay for the modules and environments you activate. Cancel or expand anytime.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <Card key={plan.name} className={`border ${plan.highlight ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-white/30' : 'bg-white/5 border-white/10'} backdrop-blur-xl`}>
                <CardBody className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold">{plan.name}</h3>
                    {plan.highlight && <Chip color="secondary">Most popular</Chip>}
                  </div>
                  <div>
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-slate-400 ml-2">{plan.period}</span>
                  </div>
                  <p className="text-slate-300 flex-1">{plan.description}</p>
                  <Button as={Link} href="/register" className={`py-6 font-semibold ${plan.highlight ? 'bg-white text-slate-900' : 'bg-white/10 text-white'}`}>
                    Start now
                  </Button>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-br from-blue-600/40 via-purple-600/40 to-pink-500/30 border border-white/20">
            <CardBody className="py-14">
              <h2 className="text-4xl font-bold mb-4">See Aero in action</h2>
              <p className="text-slate-100 text-lg mb-8">Book a white-glove demo or spin up a tenant sandbox in 60 seconds.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/register">
                  <Button size="lg" className="bg-white text-slate-900 font-semibold px-10 py-6">Start free trial</Button>
                </Link>
                <Link href="/demo">
                  <Button size="lg" variant="bordered" className="border-white text-white px-10 py-6">Book enterprise demo</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
        </section>
      </div>
    </PublicLayout>
  );
}
