import React, { useMemo } from 'react';
import { Card, CardBody, Chip, Listbox, ListboxItem } from '@heroui/react';
import { securityHighlights } from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const Security = () => {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur'
      : 'bg-white border border-slate-200 shadow-sm',
    gradient: isDarkMode
      ? 'bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-blue-500/20 border border-white/20'
      : 'bg-gradient-to-r from-emerald-100 via-cyan-100 to-blue-100 border border-slate-200 shadow-md',
  }), [isDarkMode]);

  return (
    <PublicLayout>
      <div className={palette.baseText}>
    <section className="max-w-4xl mx-auto px-6 pt-28 pb-12 text-center">
      <Chip color="success" variant="flat" className="uppercase tracking-[0.35em] text-xs">Security</Chip>
      <h1 className="text-4xl font-bold mt-5 mb-4">Security & Compliance Overview</h1>
      <p className={palette.mutedText}>
        Aero is built for high-trust environments. Below is a summary of our controls—detailed documentation lives in the Trust Center.
      </p>
    </section>

    <section className="px-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className={palette.card}>
          <CardBody>
            <h2 className="text-2xl font-semibold mb-3">Certifications & audits</h2>
            <p className={palette.mutedText}>SOC 2 Type II · ISO 27001 · ISO 27701 · HIPAA BAA · GDPR ready. Pen tests conducted twice yearly by CREST partners.</p>
          </CardBody>
        </Card>
        <Card className={palette.card}>
          <CardBody>
            <h2 className="text-2xl font-semibold mb-3">Highlights</h2>
            <Listbox aria-label="Security highlights" variant="flat" className="text-left">
              {securityHighlights.map((highlight) => (
                <ListboxItem key={highlight} className={`${palette.mutedText} bg-transparent`}>
                  {highlight}
                </ListboxItem>
              ))}
            </Listbox>
          </CardBody>
        </Card>
        <Card className={palette.gradient}>
          <CardBody>
            <h3 className="text-xl font-semibold mb-2">Contact our security team</h3>
            <p className={palette.mutedText}>security@aero-suite.com · PGP fingerprint available in the Trust Center.</p>
          </CardBody>
        </Card>
      </div>
    </section>
    </div>
  </PublicLayout>
  );
};

export default Security;
