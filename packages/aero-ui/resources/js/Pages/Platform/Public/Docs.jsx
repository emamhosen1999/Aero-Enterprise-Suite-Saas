import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const docSections = [
  {
    title: 'Getting Started',
    description: 'Launch planning, team setup, and first-week onboarding guidance.',
  },
  {
    title: 'Department Playbooks',
    description: 'Practical playbooks for people operations, customer growth, finance, projects, and governance.',
  },
  {
    title: 'Business Connections',
    description: 'Guidance for connecting with payroll, accounting, sales, and partner tools used across your business.',
  },
  {
    title: 'Trust & Governance',
    description: 'Policies and best practices for approvals, accountability, and responsible information handling.',
  },
];

export default function Docs() {
  const { isDark: isDarkMode } = useTheme();

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur-xl'
      : 'bg-white border border-slate-200 shadow-sm',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    buttonPrimary: isDarkMode ? 'bg-white text-slate-900 font-semibold' : 'bg-slate-900 text-white font-semibold',
  }), [isDarkMode]);

  return (
    <PublicLayout mainClassName="pt-0">
      <Head title="Guides" />
      <div className={palette.baseText}>
        <section className="px-4 md:px-6 pt-20 md:pt-28 pb-8 md:pb-16 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <Chip color="primary" variant="flat" className="uppercase tracking-[0.35em] text-[10px] md:text-xs">Guides</Chip>
            <h1 className="text-2xl md:text-5xl font-bold">Guides for faster team adoption and reliable day-to-day execution.</h1>
            <p className={`text-sm md:text-base ${palette.mutedText}`}>
              Browse practical guidance for onboarding, process alignment, team enablement, and governance.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              <Button as={Link} href={route('platform.support')} className={palette.buttonPrimary}>
                Get Help from Support
              </Button>
              <Button as={Link} href={route('platform.contact')} variant="bordered" className="border-current">
                Contact Customer Team
              </Button>
              <Button as={Link} href={route('platform.standalone')} variant="bordered" className="border-current">
                Private setup guide
              </Button>
            </div>
          </div>
        </section>

        <section className={`px-4 md:px-6 pb-12 md:pb-20 ${palette.tint}`}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4 md:gap-6">
            {docSections.map((section) => (
              <Card key={section.title} className={palette.card}>
                <CardBody className="space-y-2">
                  <h2 className="text-lg md:text-xl font-semibold">{section.title}</h2>
                  <p className={`text-sm ${palette.mutedText}`}>{section.description}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
