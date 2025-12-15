import React, { useMemo } from 'react';
import { Card, CardBody, Chip } from '@heroui/react';
import { cookieCategories } from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const Cookies = () => {
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
      <Chip color="warning" variant="flat" className="uppercase tracking-[0.35em] text-xs">Cookies</Chip>
      <h1 className="text-4xl font-bold mt-5 mb-4">Cookie Policy</h1>
      <p className={palette.mutedText}>
        We use cookies to keep sessions secure, improve performance, and remember your preferences. You control optional cookies within the tenant admin console.
      </p>
    </section>

    <section className="px-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {cookieCategories.map((category) => (
          <Card key={category.name} className={palette.card}>
            <CardBody className="space-y-3 text-left">
              <h2 className="text-2xl font-semibold">{category.name}</h2>
              <p className={palette.mutedText}>{category.usage}</p>
            </CardBody>
          </Card>
        ))}
        <Card className={palette.card}>
          <CardBody>
            <h3 className="text-xl font-semibold mb-2">Manage consent</h3>
            <p className={palette.mutedText}>Update cookie preferences from Settings → Security inside your tenant or email privacy@aero-suite.com.</p>
          </CardBody>
        </Card>
      </div>
    </section>
    </div>
  </PublicLayout>
  );
};

export default Cookies;
