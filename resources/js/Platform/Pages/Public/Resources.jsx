import React, { useMemo, useState } from 'react';
import { Link } from '@inertiajs/react';
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
import { useTheme } from '@/Contexts/ThemeContext.jsx';

const Resources = () => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';

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
        <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-12 text-center">
          <Chip color="success" variant="flat" className="uppercase tracking-[0.35em] text-xs">Resources</Chip>
          <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Case studies, playbooks, and release notes maintained by the product team.
          </h1>
          <p className={`${palette.mutedText} mb-8`}>
            Everything here comes from real deployments and customer reviews, so you avoid generic blog filler.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Input
              aria-label="Search resources"
              placeholder="Search by topic or industry"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              variant="bordered"
              classNames={fieldClasses}
            />
            <Button className={`w-full sm:w-auto ${palette.buttonPrimary}`}>
              Subscribe to newsletter
            </Button>
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-3 justify-center">
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

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          {results.map((resource) => (
            <Card key={resource.title} className={palette.card}>
              <CardBody className="space-y-4">
                <div className={`flex items-center justify-between text-sm ${palette.mutedText}`}>
                  <Chip size="sm" color="secondary" variant="flat">{resource.type}</Chip>
                  <span>{resource.readingTime}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">{resource.title}</h3>
                  <p className={`${palette.mutedText} mt-2`}>{resource.summary}</p>
                </div>
                <div className={`flex items-center justify-between text-sm ${palette.mutedText}`}>
                  <span>{resource.tag}</span>
                  <Button variant="light" className="px-0 text-current">Read →</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className={`px-6 pb-20 ${palette.tint}`}>
        <div className="max-w-5xl mx-auto text-center mb-10">
          <Chip color="primary" variant="flat">Documentation</Chip>
          <h2 className="text-3xl font-semibold mt-4">Build with confidence.</h2>
          <p className={`${palette.mutedText} mt-3`}>Quick access to integration guides, API references, and security resources.</p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
          {docQuickLinks.map((link) => (
            <Card key={link.label} className={palette.card}>
              <CardBody className="flex flex-col gap-3">
                <div>
                  <p className="text-lg font-semibold">{link.label}</p>
                  <p className={`text-sm ${palette.mutedText}`}>{link.description}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={palette.mutedText}>Updated weekly</span>
                  <Link href={link.href} className="font-medium text-primary-400 hover:underline">Open →</Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <section className="px-6 pb-24">
        <Card className={`max-w-4xl mx-auto text-center ${palette.highlight}`}>
          <CardBody className="space-y-4">
            <Chip color="success" variant="flat">Newsletter</Chip>
            <h3 className="text-3xl font-semibold">Monthly field reports in your inbox.</h3>
            <p className={palette.mutedText}>
              Product launches, enterprise playbooks, and customer deep dives delivered once a month. No spam.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
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
