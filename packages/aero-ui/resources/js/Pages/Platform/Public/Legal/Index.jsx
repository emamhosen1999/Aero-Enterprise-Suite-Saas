import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import { Card, CardBody, Chip } from '@heroui/react';
import { legalPrinciples } from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const legalLinks = [
  { label: 'Privacy Notice', href: '/privacy', description: 'How we collect, process, and retain data.' },
  { label: 'Terms of Service', href: '/terms', description: 'Contractual terms governing Aero usage.' },
  { label: 'Security Overview', href: '/legal/security', description: 'Controls, certifications, and posture.' },
  { label: 'Cookie Policy', href: '/legal/cookies', description: 'How cookies support reliability and UX.' },
];

const LegalIndex = () => {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur'
      : 'bg-white border border-slate-200 shadow-sm',
    tint: isDarkMode ? 'bg-slate-900/40' : 'bg-slate-50',
  }), [isDarkMode]);

  return (
    <PublicLayout>
      <div className={palette.baseText}>
      <section className="max-w-5xl mx-auto px-6 pt-28 pb-14 text-center">
        <Chip color="secondary" variant="flat" className="uppercase tracking-[0.35em] text-xs">Legal</Chip>
        <h1 className="text-4xl md:text-5xl font-bold mt-5 mb-6">Trust, compliance, and transparency hub.</h1>
        <p className={palette.mutedText}>
          Access the policies, certifications, and commitments that keep Aero secure for regulated industries.
        </p>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {legalLinks.map((doc) => (
            <Link key={doc.label} href={doc.href} className="block">
              <Card className={`${palette.card} h-full`}>
                <CardBody className="space-y-3">
                  <p className={`text-sm ${palette.mutedText}`}>Policy</p>
                  <h3 className="text-2xl font-semibold">{doc.label}</h3>
                  <p className={`${palette.mutedText} text-sm`}>{doc.description}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className={`px-6 pb-24 ${palette.tint}`}>
        <div className="max-w-5xl mx-auto text-center mb-12">
          <Chip color="success" variant="flat">Principles</Chip>
          <h2 className="text-3xl font-semibold mt-4">Our legal foundations.</h2>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {legalPrinciples.map((principle) => (
            <Card key={principle.title} className={palette.card}>
              <CardBody>
                <h3 className="text-xl font-semibold mb-2">{principle.title}</h3>
                <p className={`${palette.mutedText} text-sm`}>{principle.detail}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
      </div>
    </PublicLayout>
  );
};

export default LegalIndex;
