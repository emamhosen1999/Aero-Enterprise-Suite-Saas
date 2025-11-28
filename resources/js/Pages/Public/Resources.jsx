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
} from '../../constants/marketing';
import PublicLayout from '../../Layouts/PublicLayout';
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
    tint: isDarkMode ? 'bg-slate-900/30' : 'bg-slate-50',
    badge: isDarkMode ? 'border-white/20 text-white' : 'border-slate-300 text-slate-600',
    input: isDarkMode
      ? { wrapper: 'bg-white/5 border border-white/10', input: 'text-white placeholder:text-slate-400' }
      : { wrapper: 'bg-white border border-slate-200', input: 'text-slate-900 placeholder:text-slate-500' },
  }), [isDarkMode]);

  const results = useMemo(() => {
    return resourceLibrary.filter((item) => {
      const matchesFilter = filter === 'All' || item.type === filter;
      const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.summary.toLowerCase().includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  return (
    <PublicLayout>
      <div className={palette.baseText}>
      <section className="max-w-5xl mx-auto px-6 pt-28 pb-12 text-center">
        <Chip color="success" variant="flat" className="uppercase tracking-[0.35em] text-xs">Resources</Chip>
        <h1 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
          Playbooks, case studies, and product updates in one HQ.
        </h1>
        <p className={`${palette.mutedText} mb-8`}>
          Stay ahead of enterprise operations with curated content from Aero strategists, customers, and product teams.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Input
            aria-label="Search resources"
            placeholder="Search by topic or industry"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            classNames={palette.input}
          />
          <Button variant="bordered" className={`w-full sm:w-auto ${palette.badge}`}>
            Subscribe to newsletter
          </Button>
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
        <Card className={`max-w-4xl mx-auto text-center ${
          isDarkMode
            ? 'bg-gradient-to-r from-blue-500/30 via-purple-500/20 to-cyan-500/20 border border-white/20'
            : 'bg-gradient-to-r from-blue-100 via-purple-100 to-cyan-100 border border-slate-200 shadow-lg'
        }`}>
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
                classNames={
                  isDarkMode
                    ? { inputWrapper: 'bg-white/90', input: 'text-slate-900' }
                    : { inputWrapper: 'bg-white', input: 'text-slate-900' }
                }
              />
              <Button className={isDarkMode ? 'bg-white text-slate-900 font-semibold' : 'bg-slate-900 text-white font-semibold'}>
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
