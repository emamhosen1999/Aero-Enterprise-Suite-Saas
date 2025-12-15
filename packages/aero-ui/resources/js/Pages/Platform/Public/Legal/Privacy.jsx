import React, { useMemo } from 'react';
import { Chip, Card, CardBody } from '@heroui/react';
import { privacySections } from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const Privacy = () => {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur'
      : 'bg-white border border-slate-200 shadow-sm',
    gradient: isDarkMode
      ? 'bg-gradient-to-r from-blue-600/30 via-purple-600/20 to-cyan-500/20 border border-white/20'
      : 'bg-gradient-to-r from-blue-100 via-purple-100 to-cyan-100 border border-slate-200 shadow-md',
  }), [isDarkMode]);

  return (
    <PublicLayout>
      <div className={palette.baseText}>
    <section className="max-w-4xl mx-auto px-6 pt-28 pb-12 text-center">
      <Chip color="primary" variant="flat" className="uppercase tracking-[0.35em] text-xs">Privacy</Chip>
      <h1 className="text-4xl font-bold mt-5 mb-4">Privacy Notice</h1>
      <p className={palette.mutedText}>
        Updated November 2025. This notice explains what data we collect, how we process it, and the rights you have over it.
      </p>
    </section>

    <section className="px-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {privacySections.map((section) => (
          <Card key={section.heading} className={palette.card}>
            <CardBody className="space-y-3 text-left">
              <h2 className="text-2xl font-semibold">{section.heading}</h2>
              <p className={palette.mutedText}>{section.body}</p>
            </CardBody>
          </Card>
        ))}
        <Card className={palette.gradient}>
          <CardBody>
            <h3 className="text-xl font-semibold mb-2">Contact</h3>
            <p className={palette.mutedText}>privacy@aero-suite.com · DSR portal inside tenant admin.</p>
          </CardBody>
        </Card>
      </div>
    </section>
    </div>
  </PublicLayout>
  );
};

export default Privacy;
