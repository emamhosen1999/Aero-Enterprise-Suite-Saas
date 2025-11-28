import React from 'react';
import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
  Card,
  CardBody,
  Chip,
  Divider,
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
} from '../../constants/marketing';
import PublicLayout from '../../Layouts/PublicLayout';

const About = () => {
  return (
    <PublicLayout>
      <div className="text-white">
      <section className="relative max-w-6xl mx-auto px-6 pt-28 pb-20 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <Chip color="secondary" variant="flat" className="uppercase tracking-[0.35em] text-xs">About</Chip>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mt-5 mb-6">
            We are building the operating system for resilient, transparent enterprises.
          </h1>
          <p className="text-lg text-slate-300">
            Aero was born from field teams juggling spreadsheets, point tools, and opaque workflows. Today, our mission is to give every enterprise a living, breathing command center that aligns HR, Projects, Compliance, Supply Chain, and Finance in real time.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-10">
            {heroStats.map((stat) => (
              <Card key={stat.label} className="bg-white/5 border border-white/10">
                <CardBody>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
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
          <Card className="bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-500/20 border border-white/10">
            <CardBody className="space-y-6">
              <p className="text-sm text-slate-200 uppercase tracking-[0.4em]">Field Notes</p>
              <h3 className="text-2xl font-semibold">From siloed spreadsheets to a unified execution graph.</h3>
              <p className="text-slate-100">
                We shadowed HR leaders, project coordinators, compliance managers, and CFOs across Asia, the Middle East, and North America. Every team wanted the same thing: one system that could adapt as fast as their operations. Aero is the answer.
              </p>
            </CardBody>
          </Card>
          <div className="absolute -top-8 -right-10 w-36 h-36 bg-purple-500/30 blur-3xl" />
          <div className="absolute -bottom-10 -left-8 w-40 h-40 bg-cyan-500/30 blur-3xl" />
        </motion.div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Chip variant="flat" color="success" className="uppercase tracking-[0.3em] text-xs">Values</Chip>
            <h2 className="text-4xl font-semibold mt-4">Principles guiding every launch.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {missionValues.map((value) => (
              <Card key={value.title} className="bg-white/5 border border-white/10">
                <CardBody>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-slate-300 text-sm">{value.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 bg-slate-900/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <Chip color="primary" variant="flat">Timeline</Chip>
            <h2 className="text-4xl font-semibold mt-4">Milestones that shaped Aero.</h2>
          </div>
          <div className="space-y-6 border-l border-white/10 pl-8 relative">
            {timelineMilestones.map((milestone, index) => (
              <div key={milestone.year} className="relative">
                <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-slate-900" />
                <Card className="bg-white/5 border border-white/10">
                  <CardBody className="space-y-2">
                    <p className="text-sm text-slate-400">{milestone.year}</p>
                    <h3 className="text-2xl font-semibold">{milestone.headline}</h3>
                    <p className="text-slate-300">{milestone.detail}</p>
                  </CardBody>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <Chip color="secondary" variant="flat" className="mb-3">Leadership</Chip>
              <h2 className="text-4xl font-semibold">People shaping the platform.</h2>
            </div>
            <Link href="/careers" className="text-slate-300 hover:text-white">Meet the wider team →</Link>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {leadershipTeam.map((leader) => (
              <Card key={leader.name} className="bg-white/5 border border-white/10">
                <CardBody className="flex items-start gap-4">
                  <Avatar name={leader.avatar} size="lg" color="secondary" className="text-lg" />
                  <div>
                    <h3 className="text-xl font-semibold">{leader.name}</h3>
                    <p className="text-sm text-slate-400">{leader.title}</p>
                    <p className="text-slate-300 text-sm mt-3">{leader.focus}</p>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <Chip color="success" variant="flat">Impact</Chip>
            <h2 className="text-4xl font-semibold mt-4">Global footprint, measurable outcomes.</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {globalImpactStats.map((stat) => (
              <Card key={stat.label} className="bg-white/5 border border-white/10 text-center">
                <CardBody>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-slate-400 mt-2">{stat.label}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.detail}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto text-center">
          <Chip color="primary" variant="flat">Allies</Chip>
          <h2 className="text-3xl font-semibold mt-4 mb-8">Building with technology partners you trust.</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {partnerLogos.map((logo) => (
              <div key={logo} className="p-5 bg-white/5 border border-white/10 rounded-2xl text-lg font-semibold tracking-wide">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <Card className="max-w-5xl mx-auto bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-pink-500/20 border border-white/20 text-center">
          <CardBody className="space-y-5">
            <Chip variant="flat" color="warning">Culture</Chip>
            <h3 className="text-4xl font-semibold">We believe transformation should feel human.</h3>
            <p className="text-slate-100 max-w-3xl mx-auto">
              Enterprise software should respect frontline teams, executives, and partners alike. That’s why Aero combines automation with empathy, data transparency, and design systems that make complex operations feel intuitive.
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
};

export default About;
