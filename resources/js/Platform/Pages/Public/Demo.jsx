import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
  Card,
  CardBody,
  Chip,
  Button,
  Input,
  Textarea,
} from '@heroui/react';
import { demoSteps, demoStats, testimonialSlides } from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Contexts/ThemeContext.jsx';

const Demo = () => {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur'
      : 'bg-white border border-slate-200 shadow-sm',
    gradientCard: isDarkMode
      ? 'bg-gradient-to-r from-emerald-500/25 via-cyan-500/15 to-blue-500/20 border border-white/15'
      : 'bg-gradient-to-r from-emerald-50 via-cyan-50 to-blue-50 border border-slate-200 shadow-md',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    badge: isDarkMode ? 'border-white/30 text-white' : 'border-slate-300 text-slate-700',
    buttonPrimary: isDarkMode ? 'bg-white text-slate-900 font-semibold' : 'bg-slate-900 text-white font-semibold',
    buttonBorder: isDarkMode ? 'border-white/40 text-white' : 'border-slate-300 text-slate-700',
    inputWrapper: isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200',
    inputLabel: isDarkMode ? 'text-slate-200' : 'text-slate-600',
  }), [isDarkMode]);

  const fieldClasses = {
    inputWrapper: palette.inputWrapper,
    label: palette.inputLabel,
  };

  return (
    <PublicLayout mainClassName="pt-0">
      <div className={palette.baseText}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className={`absolute inset-0 ${
              isDarkMode
                ? 'bg-gradient-to-br from-emerald-500/20 via-blue-600/10 to-cyan-500/15'
                : 'bg-gradient-to-br from-emerald-50 via-blue-100/50 to-cyan-100/50'
            }`}
          />
          <div className="absolute -right-20 top-10 w-72 h-72 bg-blue-500/20 blur-[140px]" />
          <div className="absolute -left-16 bottom-0 w-72 h-72 bg-emerald-400/25 blur-[140px]" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 pt-28 pb-16 grid lg:grid-cols-2 gap-10">
          <div>
            <Chip variant="flat" color="primary" className="uppercase tracking-[0.35em] text-xs">Demo</Chip>
            <h1 className="text-4xl md:text-5xl font-bold mt-5 mb-6">
              See your workflows running in Aero before you commit.
            </h1>
            <p className={palette.mutedText}>
              We configure the demo with your modules, sample data, and approval chains so stakeholders can judge the fit in a single session.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-10">
              {demoStats.map((stat) => (
                <Card key={stat.label} className={`${palette.card} text-center`}>
                  <CardBody>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className={`text-xs mt-2 ${palette.mutedText}`}>{stat.label}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-10">
              <Button as={Link} href={route('platform.register.index')} className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-10">
                Start free trial
              </Button>
              <Button as={Link} href={route('pricing')} variant="bordered" className={`px-10 ${palette.buttonBorder}`}>
                Explore pricing
              </Button>
            </div>
          </div>
        <Card className={palette.card}>
          <CardBody className="space-y-4">
            <Chip color="success" variant="flat" size="sm">Request a demo</Chip>
            <Input label="Full name" variant="bordered" classNames={fieldClasses} />
            <Input label="Work email" type="email" variant="bordered" classNames={fieldClasses} />
            <Input label="Company" variant="bordered" classNames={fieldClasses} />
            <Input label="Number of employees" variant="bordered" classNames={fieldClasses} />
            <Textarea label="What should we cover?" minRows={4} variant="bordered" classNames={fieldClasses} />
            <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold">Book session</Button>
          </CardBody>
        </Card>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Chip color="secondary" variant="flat">What to expect</Chip>
            <h2 className="text-4xl font-semibold mt-4">Your demo in three beats.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {demoSteps.map((item, index) => (
              <Card key={item.step} className={palette.card}>
                <CardBody className="space-y-4">
                  <Chip color="primary" variant="flat" size="sm">0{index + 1}</Chip>
                  <h3 className="text-2xl font-semibold">{item.step}</h3>
                  <p className={palette.mutedText}>{item.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className={`px-6 pb-16 ${palette.tint}`}>
        <div className="max-w-5xl mx-auto text-center mb-10">
          <Chip color="success" variant="flat">Proof</Chip>
          <h2 className="text-3xl font-semibold mt-3">Teams that already switched.</h2>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {testimonialSlides.map((testimonial) => (
            <Card key={testimonial.author} className={`${palette.card} h-full`}>
              <CardBody>
                <p className={`text-lg ${palette.mutedText}`}>“{testimonial.quote}”</p>
                <div className="mt-4">
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className={`text-sm ${palette.mutedText}`}>{testimonial.role}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <Card className={`max-w-5xl mx-auto text-center ${palette.gradientCard}`}>
          <CardBody className="space-y-5">
            <Chip color="warning" variant="flat">Next step</Chip>
            <h3 className="text-4xl font-semibold">Get a tailored rollout plan in under 48 hours.</h3>
            <p className={palette.mutedText}>
              We’ll map your key workflows, pick modules, and share your implementation timeline.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold">
                Book a live tour
              </Button>
              <Button as={Link} href={route('contact')} variant="bordered" className={palette.buttonBorder}>
                Message our team
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
      </div>
    </PublicLayout>
  );
};

export default Demo;
