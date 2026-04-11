import React, { useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button, Card, CardBody, Chip } from '@heroui/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding';

const posts = [
  {
    title: 'How Growing Companies Standardize Operations Faster',
    excerpt: 'Practical ways to align teams, improve accountability, and keep execution consistent across locations.',
    category: 'Strategy',
    readTime: '8 min read',
  },
  {
    title: 'How Unified Workflows Improve Leadership Visibility',
    excerpt: 'A practical approach for connecting people, finance, and project work into one clear operating rhythm.',
    category: 'Operations',
    readTime: '6 min read',
  },
  {
    title: 'Rollout Checklist for High-Confidence Business Launches',
    excerpt: 'A proven checklist used by customer teams to reduce risk and speed up adoption.',
    category: 'Execution',
    readTime: '10 min read',
  },
];

export default function Blog() {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const { siteName } = useBranding();

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
      <Head title="Blog" />
      <div className={palette.baseText}>
        <section className="relative overflow-hidden px-4 md:px-6 pt-20 md:pt-28 pb-8 md:pb-16 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <Chip color="secondary" variant="flat" className="uppercase tracking-[0.35em] text-[10px] md:text-xs">Blog</Chip>
            <h1 className="text-2xl md:text-5xl font-bold">Insights for leaders building stronger and more predictable operations.</h1>
            <p className={`text-sm md:text-base ${palette.mutedText}`}>
              Explore practical guidance on growth planning, team productivity, and business execution from the {siteName || 'Aero'} team.
            </p>
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              <Button as={Link} href={route('platform.resources')} className={palette.buttonPrimary}>
                Explore Resource Library
              </Button>
              <Button as={Link} href={route('platform.contact')} variant="bordered" className="border-current">
                Request a Topic
              </Button>
            </div>
          </div>
        </section>

        <section className={`px-4 md:px-6 pb-12 md:pb-20 ${palette.tint}`}>
          <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-4 md:gap-6">
            {posts.map((post) => (
              <Card key={post.title} className={palette.card}>
                <CardBody className="space-y-3">
                  <Chip size="sm" variant="flat" color="primary" className="w-fit">{post.category}</Chip>
                  <h2 className="text-lg md:text-xl font-semibold">{post.title}</h2>
                  <p className={`text-sm ${palette.mutedText}`}>{post.excerpt}</p>
                  <p className={`text-xs ${palette.mutedText}`}>{post.readTime}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
