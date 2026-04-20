import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const openings = [
  { role: 'Senior Product Delivery Lead', team: 'Product Delivery', location: 'Hybrid - Dhaka / Remote APAC' },
  { role: 'Implementation Consultant', team: 'Enterprise Delivery', location: 'Remote - Global' },
  { role: 'Customer Experience Designer', team: 'Experience Design', location: 'Hybrid - Kuala Lumpur / Remote' },
  { role: 'Risk & Governance Specialist', team: 'Trust & Governance', location: 'Remote - Global' },
];

export default function Careers() {
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
      <Head title="Careers" />
      <div className={palette.baseText}>
        <section className="px-4 md:px-6 pt-20 md:pt-28 pb-8 md:pb-16 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <Chip color="warning" variant="flat" className="uppercase tracking-[0.35em] text-[10px] md:text-xs">Careers</Chip>
            <h1 className="text-2xl md:text-5xl font-bold">Build the future of modern business operations.</h1>
            <p className={`text-sm md:text-base ${palette.mutedText}`}>
              Join cross-functional teams helping customers improve performance across people, finance, operations, and governance.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              <Button as={Link} href={route('platform.contact')} className={palette.buttonPrimary}>
                Apply / Send Resume
              </Button>
              <Button as={Link} href={route('platform.about')} variant="bordered" className="border-current">
                Learn About the Team
              </Button>
            </div>
          </div>
        </section>

        <section className={`px-4 md:px-6 pb-12 md:pb-20 ${palette.tint}`}>
          <div className="max-w-5xl mx-auto grid gap-4">
            {openings.map((opening) => (
              <Card key={opening.role} className={palette.card}>
                <CardBody className="space-y-1">
                  <h2 className="text-lg md:text-xl font-semibold">{opening.role}</h2>
                  <p className={`text-sm ${palette.mutedText}`}>{opening.team}</p>
                  <p className={`text-sm ${palette.mutedText}`}>{opening.location}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
