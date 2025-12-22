import React, { useMemo, useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import { useBranding } from '@/Hooks/useBranding';
import {
  Chip,
  Card,
  CardBody,
  Button,
  Input,
  Divider,
} from '@heroui/react';
import {
  resourceFilters,
  resourceLibrary,
  docQuickLinks,
} from '@/constants/marketing';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';

const Resources = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { siteName } = useBranding();

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur'
      : 'bg-white border border-slate-200 shadow-sm',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    badge: isDarkMode ? 'border-white/30 text-white' : 'border-slate-300 text-slate-700',
    highlight: isDarkMode
      ? 'bg-gradient-to-r from-blue-600/25 via-purple-600/20 to-cyan-500/20 border border-white/20'
      : 'bg-gradient-to-r from-blue-50 via-purple-50 to-cyan-50 border border-slate-200 shadow-lg',
    buttonPrimary: 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold',
    buttonBorder: isDarkMode ? 'border-white/40 text-white' : 'border-slate-300 text-slate-700',
    inputWrapper: isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-slate-200',
    inputLabel: isDarkMode ? 'text-slate-200' : 'text-slate-600',
  }), [isDarkMode]);

  const results = useMemo(() => {
    return resourceLibrary.filter((item) => {
      const matchesFilter = filter === 'All' || item.type === filter;
      const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.summary.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const fieldClasses = {
    inputWrapper: palette.inputWrapper,
    input: 'placeholder:text-slate-400',
    label: palette.inputLabel,
  };

  return (
    <PublicLayout mainClassName="pt-0">
      <Head title="Resources" />
      <div className={palette.baseText}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div
            className={`absolute inset-0 ${
              isDarkMode
                ? 'bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-cyan-500/15'
                : 'bg-gradient-to-br from-blue-50 via-purple-50 to-cyan-100/60'
            }`}
          />
          <div className="absolute -right-20 top-10 w-72 h-72 bg-blue-500/20 blur-[140px]" />
          <div className="absolute -left-16 bottom-0 w-72 h-72 bg-emerald-400/20 blur-[140px]" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 md:px-6 pt-20 md:pt-28 pb-6 md:pb-12 text-center">
          <Chip color="success" variant="flat" className="uppercase tracking-[0.35em] text-[10px] md:text-xs">Resources</Chip>
          <h1 className="text-2xl md:text-5xl font-bold mt-3 md:mt-4 mb-4 md:mb-6">
            Case studies, playbooks, and release notes maintained by the product team.
          </h1>
          <p className={`${palette.mutedText} mb-5 md:mb-8 text-sm md:text-base`}>
            Everything here comes from real deployments and customer reviews, so you avoid generic blog filler.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
            <Input
              aria-label="Search resources"
              placeholder="Search by topic or industry"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              variant="bordered"
              classNames={fieldClasses}
            />
            <Button className={`w-full sm:w-auto text-sm md:text-base ${palette.buttonPrimary}`}>
              Subscribe to newsletter
            </Button>
          </div>
        </div>
      </section>

      <section className="px-4 md:px-6 pb-6 md:pb-12">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2 md:gap-3 justify-center">
          {resourceFilters.map((option) => (
            <Chip
              key={option}
              onClick={() => setFilter(option)}
              color={filter === option ? 'secondary' : 'default'}
              variant={filter === option ? 'solid' : 'bordered'}
              className="cursor-pointer"
            >
              {option}
            </Chip>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-6 pb-10 md:pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-4 md:gap-6">
          {results.map((resource) => (
            <Card key={resource.title} className={palette.card}>
              <CardBody className="space-y-3 md:space-y-4">
                <div className={`flex items-center justify-between text-xs md:text-sm ${palette.mutedText}`}>
                  <Chip size="sm" color="secondary" variant="flat" className="text-[10px] md:text-xs">{resource.type}</Chip>
                  <span>{resource.readingTime}</span>
                </div>
                <div>
                  <h3 className="text-lg md:text-2xl font-semibold">{resource.title}</h3>
                  <p className={`${palette.mutedText} mt-2 text-sm md:text-base`}>{resource.summary}</p>
                </div>
                <div className={`flex items-center justify-between text-xs md:text-sm ${palette.mutedText}`}>
                  <span>{resource.tag}</span>
                  <Button variant="light" className="px-0 text-current">Read →</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className={`px-4 md:px-6 pb-10 md:pb-20 ${palette.tint}`}>
        <div className="max-w-5xl mx-auto text-center mb-6 md:mb-10">
          <Chip color="primary" variant="flat" className="text-[10px] md:text-xs">Documentation</Chip>
          <h2 className="text-xl md:text-3xl font-semibold mt-3 md:mt-4">Build with confidence.</h2>
          <p className={`${palette.mutedText} mt-2 md:mt-3 text-sm md:text-base`}>Quick access to integration guides, API references, and security resources.</p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-3 md:gap-4">
          {docQuickLinks.map((link) => (
            <Card key={link.label} className={palette.card}>
              <CardBody className="flex flex-col gap-2 md:gap-3">
                <div>
                  <p className="text-base md:text-lg font-semibold">{link.label}</p>
                  <p className={`text-xs md:text-sm ${palette.mutedText}`}>{link.description}</p>
                </div>
                <div className="flex items-center justify-between text-xs md:text-sm">
                  <span className={palette.mutedText}>Updated weekly</span>
                  <Link href={link.href} className="font-medium text-primary-400 hover:underline">Open →</Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-4 md:px-6 pb-12 md:pb-24">
        <Card className={`max-w-4xl mx-auto text-center ${palette.highlight}`}>
          <CardBody className="space-y-3 md:space-y-4">
            <Chip color="success" variant="flat" className="text-[10px] md:text-xs">Newsletter</Chip>
            <h3 className="text-xl md:text-3xl font-semibold">Monthly field reports in your inbox.</h3>
            <p className={`text-sm md:text-base ${palette.mutedText}`}>
              Product launches, enterprise playbooks, and customer deep dives delivered once a month. No spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <Input
                aria-label="Email"
                placeholder="you@company.com"
                variant="bordered"
                classNames={fieldClasses}
              />
              <Button className={palette.buttonPrimary}>
                Subscribe
              </Button>
            </div>
          </CardBody>
        </Card>
      </section>
      </div>
    </PublicLayout>
  );
};

export default Resources;
