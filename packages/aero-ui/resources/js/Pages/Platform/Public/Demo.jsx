import React, { useMemo } from 'react';
import { Link, Head } from '@inertiajs/react';
import { useBranding } from '@/Hooks/useBranding';
import {
  Card,
  CardBody,
  Chip,
  Button,
} from '@heroui/react';
import { demoSteps, demoStats, testimonialSlides } from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const Demo = () => {
  const { isDark: isDarkMode } = useTheme();
  const { siteName } = useBranding();

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
  }), [isDarkMode]);

  return (
    <PublicLayout mainClassName="pt-0">
      <Head title="Demo" />
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
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 pt-20 md:pt-28 pb-8 md:pb-16 grid lg:grid-cols-2 gap-6 md:gap-10">
          <div>
            <Chip variant="flat" color="primary" className="uppercase tracking-[0.35em] text-[10px] md:text-xs">Demo</Chip>
            <h1 className="text-2xl md:text-5xl font-bold mt-3 md:mt-5 mb-4 md:mb-6">
              Explore a guided business demo built around real day-to-day operations.
            </h1>
            <p className={`text-sm md:text-base ${palette.mutedText}`}>
              Experience a complete sample business with realistic records, team approvals, and leadership reporting so you can evaluate value quickly.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mt-6 md:mt-10">
              {demoStats.map((stat) => (
                <Card key={stat.label} className={`${palette.card} text-center`}>
                  <CardBody>
                    <p className="text-lg md:text-2xl font-bold">{stat.value}</p>
                    <p className={`text-[10px] md:text-xs mt-1 md:mt-2 ${palette.mutedText}`}>{stat.label}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 md:gap-4 mt-6 md:mt-10">
              <Button
                as="a"
                href="https://demo.aeos365.com"
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-6 md:px-10"
              >
                Open live demo
              </Button>
              <Button as={Link} href={route('platform.register.index')} size="sm" variant="bordered" className={`px-6 md:px-10 ${palette.buttonBorder}`}>
                Start free trial
              </Button>
              <Button as={Link} href={route('platform.standalone')} size="sm" variant="light" className="px-6 md:px-10">
                Standalone evaluation
              </Button>
            </div>
          </div>
        <Card className={palette.card}>
          <CardBody className="space-y-3 md:space-y-4">
            <Chip color="success" variant="flat" size="sm" className="text-[10px] md:text-xs">Ready-to-Use Demo Environment</Chip>
            <p className={`text-sm md:text-base ${palette.mutedText}`}>
              The demo includes all key business areas with realistic information and practical workflows so your team can review outcomes without setup delays.
            </p>
            <div className="grid grid-cols-1 gap-2 md:gap-3">
              <Card className={`${palette.gradientCard} text-left`}>
                <CardBody className="space-y-1">
                  <p className="text-xs md:text-sm font-semibold">How to access the demo</p>
                  <ul className={`text-[11px] md:text-sm ${palette.mutedText} space-y-1 list-disc list-inside`}>
                    <li>Click "Open live demo" to launch https://demo.aeos365.com.</li>
                    <li>Use the ready demo accounts to view how different teams work.</li>
                    <li>Move across business areas to review priorities, approvals, and results.</li>
                  </ul>
                </CardBody>
              </Card>
              <Card className={palette.card}>
                <CardBody className="space-y-1">
                  <p className="text-xs md:text-sm font-semibold">What is included</p>
                  <p className={`text-[11px] md:text-sm ${palette.mutedText}`}>
                    People records, customer activity, projects, stock movements, sales transactions, and leadership reporting with practical examples throughout.
                  </p>
                </CardBody>
              </Card>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                as="a"
                href="https://demo.aeos365.com"
                target="_blank"
                rel="noopener noreferrer"
                size="sm"
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold"
              >
                Access Demo
              </Button>
              <Button as={Link} href={route('platform.pricing')} size="sm" variant="bordered" className={`px-6 md:px-10 ${palette.buttonBorder}`}>
                View Pricing
              </Button>
            </div>
          </CardBody>
        </Card>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-8 md:pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6 md:mb-12">
            <Chip color="secondary" variant="flat" className="text-[10px] md:text-xs">What to Expect</Chip>
            <h2 className="text-2xl md:text-4xl font-semibold mt-3 md:mt-4">Your guided demo in three clear steps.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {demoSteps.map((item, index) => (
              <Card key={item.step} className={palette.card}>
                <CardBody className="space-y-2 md:space-y-4">
                  <Chip color="primary" variant="flat" size="sm" className="text-[10px] md:text-xs">0{index + 1}</Chip>
                  <h3 className="text-lg md:text-2xl font-semibold">{item.step}</h3>
                  <p className={`text-sm md:text-base ${palette.mutedText}`}>{item.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className={`px-4 md:px-6 pb-8 md:pb-16 ${palette.tint}`}>
        <div className="max-w-5xl mx-auto text-center mb-6 md:mb-10">
          <Chip color="success" variant="flat" className="text-[10px] md:text-xs">Customer Validation</Chip>
          <h2 className="text-xl md:text-3xl font-semibold mt-3">How customers describe the business impact.</h2>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4 md:gap-6">
          {testimonialSlides.map((testimonial) => (
            <Card key={testimonial.author} className={`${palette.card} h-full`}>
              <CardBody>
                <p className={`text-sm md:text-lg ${palette.mutedText}`}>"{testimonial.quote}"</p>
                <div className="mt-3 md:mt-4">
                  <p className="text-sm md:text-base font-semibold">{testimonial.author}</p>
                  <p className={`text-xs md:text-sm ${palette.mutedText}`}>{testimonial.role}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-6 pb-12 md:pb-24">
        <Card className={`max-w-5xl mx-auto text-center ${palette.gradientCard}`}>
          <CardBody className="space-y-3 md:space-y-5">
            <Chip color="warning" variant="flat" className="text-[10px] md:text-xs">Next Step</Chip>
            <h3 className="text-2xl md:text-4xl font-semibold">Get a tailored rollout plan from our team within 48 hours.</h3>
            <p className={`text-sm md:text-base ${palette.mutedText}`}>
              Our advisors will review your priorities, recommend the right rollout path, and share a practical launch plan for your business.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              <Button
                size="sm"
                as="a"
                href="https://demo.aeos365.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-6 md:px-8"
              >
                Open live demo
              </Button>
              <Button as={Link} href={route('platform.register.index')} size="sm" variant="bordered" className={`px-6 md:px-8 ${palette.buttonBorder}`}>
                Start free trial
              </Button>
              <Button as={Link} href={route('platform.standalone')} size="sm" variant="light" className="px-6 md:px-8">
                Private setup review
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
