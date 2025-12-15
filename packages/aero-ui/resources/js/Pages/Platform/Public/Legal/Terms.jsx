import React, { useMemo } from 'react';
import { Card, CardBody, Chip } from '@heroui/react';
import { termsSections } from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const Terms = () => {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur'
      : 'bg-white border border-slate-200 shadow-sm',
  }), [isDarkMode]);

  return (
    <PublicLayout>
      <div className={palette.baseText}>
    <section className="max-w-4xl mx-auto px-6 pt-28 pb-12 text-center">
      <Chip color="secondary" variant="flat" className="uppercase tracking-[0.35em] text-xs">Terms</Chip>
      <h1 className="text-4xl font-bold mt-5 mb-4">Terms of Service</h1>
      <p className={palette.mutedText}>
        These terms govern your access to aeos365. They incorporate any statements of work or order forms you execute with us.
      </p>
    </section>
    <section className="px-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {termsSections.map((section) => (
          <Card key={section.heading} className={palette.card}>
            <CardBody className="space-y-3 text-left">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              <p className={palette.mutedText}>{section.body}</p>
            </CardBody>
          </Card>
        ))}
        <Card className={palette.card}>
          <CardBody>
            <h3 className="text-xl font-semibold mb-2">Last updated</h3>
            <p className={palette.mutedText}>Effective November 2025. Archived terms available upon request.</p>
          </CardBody>
        </Card>
      </div>
    </section>
    </div>
  </PublicLayout>
  );
};

export default Terms;
