import React from 'react';
import { Link } from '@inertiajs/react';
import {
  Card,
  CardBody,
  Chip,
  Button,
  Input,
  Textarea,
} from '@heroui/react';
import { demoSteps, demoStats, testimonialSlides } from '../../constants/marketing';
import PublicLayout from '../../Layouts/PublicLayout';

const Demo = () => {
  return (
    <PublicLayout>
      <div className="text-white">
      <section className="max-w-6xl mx-auto px-6 pt-28 pb-16 grid lg:grid-cols-2 gap-10">
        <div>
          <Chip variant="flat" color="primary" className="uppercase tracking-[0.35em] text-xs">Demo</Chip>
          <h1 className="text-4xl md:text-5xl font-bold mt-5 mb-6">
            Experience Aero orchestrating HR, projects, compliance, and supply chain live.
          </h1>
          <p className="text-slate-300">
            Get a curated walkthrough for your operating model. Bring stakeholders, we’ll bring the automation blueprints.
          </p>
          <div className="grid grid-cols-3 gap-4 mt-10">
            {demoStats.map((stat) => (
              <Card key={stat.label} className="bg-white/5 border border-white/10 text-center">
                <CardBody>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-slate-400 mt-2">{stat.label}</p>
                </CardBody>
              </Card>
            ))}
          </div>
          <div className="flex flex-wrap gap-4 mt-10">
            <Link href="/pricing">
              <Button className="bg-white text-slate-900 font-semibold px-10">Explore pricing</Button>
            </Link>
            <Link href="/contact">
              <Button variant="bordered" className="border-white/40 text-white px-10">Talk to sales</Button>
            </Link>
          </div>
        </div>
        <Card className="bg-white/5 border border-white/10">
          <CardBody className="space-y-4">
            <Chip color="success" variant="flat" size="sm">Request a demo</Chip>
            <Input label="Full name" variant="faded" classNames={{ inputWrapper: 'bg-white/5', label: 'text-slate-300' }} />
            <Input label="Work email" variant="faded" classNames={{ inputWrapper: 'bg-white/5', label: 'text-slate-300' }} />
            <Input label="Company" variant="faded" classNames={{ inputWrapper: 'bg-white/5', label: 'text-slate-300' }} />
            <Input label="Number of employees" variant="faded" classNames={{ inputWrapper: 'bg-white/5', label: 'text-slate-300' }} />
            <Textarea label="What should we cover?" minRows={4} variant="faded" classNames={{ inputWrapper: 'bg-white/5', label: 'text-slate-300' }} />
            <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold">Book session</Button>
          </CardBody>
        </Card>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Chip color="secondary" variant="flat">What to expect</Chip>
            <h2 className="text-4xl font-semibold mt-4">Your demo in three beats.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {demoSteps.map((item, index) => (
              <Card key={item.step} className="bg-white/5 border border-white/10">
                <CardBody className="space-y-4">
                  <Chip color="primary" variant="flat" size="sm">0{index + 1}</Chip>
                  <h3 className="text-2xl font-semibold">{item.step}</h3>
                  <p className="text-slate-300">{item.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16 bg-slate-900/50">
        <div className="max-w-5xl mx-auto text-center mb-10">
          <Chip color="success" variant="flat">Proof</Chip>
          <h2 className="text-3xl font-semibold mt-3">Teams that already switched.</h2>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {testimonialSlides.map((testimonial) => (
            <Card key={testimonial.author} className="bg-white/5 border border-white/10">
              <CardBody>
                <p className="text-lg text-slate-100">“{testimonial.quote}”</p>
                <div className="mt-4">
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-slate-400">{testimonial.role}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <Card className="max-w-5xl mx-auto bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-blue-500/20 border border-white/20 text-center">
          <CardBody className="space-y-5">
            <Chip color="warning" variant="flat">Next step</Chip>
            <h3 className="text-4xl font-semibold">Get a tailored rollout plan in under 48 hours.</h3>
            <p className="text-slate-100">
              We’ll map your key workflows, pick modules, and share your implementation timeline.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="bg-white text-slate-900 font-semibold">Book a live tour</Button>
              <Link href="/contact">
                <Button variant="bordered" className="border-white/40 text-white">Message our team</Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </section>
      </div>
    </PublicLayout>
  );
};

export default Demo;
