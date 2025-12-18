import React, { useMemo, useState } from 'react';
import { Link, Head } from '@inertiajs/react';
import { Button, Card, CardBody, Chip, Divider, Accordion, AccordionItem } from '@heroui/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { useTheme } from '@/Context/ThemeContext.jsx';
import { useBranding } from '@/Hooks/useBranding';
import {
  productHighlights,
  platformModules,
  workflowTimeline,
  industryStarters,
  moduleFeatures,
} from '@/constants/marketing';

// Icon components - compact for mobile
const iconMap = {
  people: (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493m-6.564-3.07A6.375 6.375 0 0115 19.235V19.128m0 .106A12.318 12.318 0 018.625 21c-2.331 0-4.512-.645-6.375-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
    </svg>
  ),
  project: (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5A1.125 1.125 0 0121.375 4.125v1.5c0 .621-.504 1.125-1.125 1.125H3.75A1.125 1.125 0 012.625 5.625v-1.5C2.625 3.504 3.129 3 3.75 3zM6 7.5v9a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 16.5v-9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 11.25v1.5M12 9v4.5m3-6V15" />
    </svg>
  ),
  'shield-check': (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  'inbox-stack': (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h18m-16.5 0L4 17.25a2.25 2.25 0 002.247 2.118h11.506A2.25 2.25 0 0020 17.25L20.5 7.5M8.25 7.5L9 3.75h6L14.25 7.5" />
    </svg>
  ),
  bank: (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 3 7v2h18V7l-9-4z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 11v8m4-8v8m4-8v8m4-8v8m4 0H4" />
    </svg>
  ),
  'chart-bar': (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m0 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 015.058 2.772m-10.116 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.941-3.197a5.971 5.971 0 00-.941 3.197" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  chat: (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  ),
  cube: (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 4.5 6.75V17.25L12 21l7.5-3.75V6.75L12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75 12 10.5l7.5-3.75M12 10.5V21" />
    </svg>
  ),
  truck: (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5h10.5v7.5H3zM13.5 10.5H17l2.5 2.5v2H13.5z" />
      <circle cx="6" cy="17" r="1.5" />
      <circle cx="16" cy="17" r="1.5" />
    </svg>
  ),
  'shopping-cart': (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 3h6l4 4v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9h6M9 13h6M9 17h3" />
    </svg>
  ),
  badge: (
    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 11.5l1.75 1.75L15 9.5" />
    </svg>
  ),
  check: (
    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
};

export default function Features() {
  const { themeSettings } = useTheme();
  const isDarkMode = themeSettings?.mode === 'dark';
  const [activeModule, setActiveModule] = useState('hrm');
  const { siteName } = useBranding();

  const palette = useMemo(() => ({
    baseText: isDarkMode ? 'text-white' : 'text-slate-900',
    mutedText: isDarkMode ? 'text-slate-300' : 'text-slate-600',
    card: isDarkMode
      ? 'bg-white/5 border border-white/10 backdrop-blur-xl'
      : 'bg-white border border-slate-200 shadow-sm',
    highlightCard: isDarkMode
      ? 'bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-cyan-500/20 border border-white/20'
      : 'bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-50 border border-slate-200 shadow-lg',
    tint: isDarkMode ? 'bg-white/5' : 'bg-slate-50',
    badge: isDarkMode
      ? 'bg-white/10 border border-white/20 text-white'
      : 'bg-white border border-slate-200 text-slate-700',
    featureItem: isDarkMode
      ? 'text-slate-200'
      : 'text-slate-700',
    submoduleCard: isDarkMode
      ? 'bg-white/5 border border-white/10'
      : 'bg-slate-50 border border-slate-100',
  }), [isDarkMode]);

  const currentModule = moduleFeatures[activeModule];

  return (
    <PublicLayout mainClassName="pt-0">
      <Head title={`Features`} />
      <div className={`relative ${palette.baseText}`}>
        {/* Hero Section - Compact on mobile */}
        <section className="relative px-4 md:px-6 pt-20 md:pt-28 pb-8 md:pb-16 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div
              className={`absolute inset-0 ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-600/20 via-purple-600/10 to-cyan-500/15'
                  : 'bg-gradient-to-r from-sky-200/60 via-indigo-100/40 to-cyan-100/40'
              }`}
            />
            <div className="absolute -right-24 top-10 w-48 md:w-72 h-48 md:h-72 bg-blue-500/20 blur-[100px] md:blur-[140px]" />
            <div className="absolute -left-14 bottom-0 w-48 md:w-72 h-48 md:h-72 bg-emerald-400/20 blur-[100px] md:blur-[140px]" />
          </div>
          <div className="relative max-w-6xl mx-auto">
            <div className="text-center">
              <Chip color="secondary" variant="flat" className="uppercase tracking-[0.2em] md:tracking-[0.35em] text-[10px] md:text-xs mb-3 md:mb-4">
                FEATURES
              </Chip>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 md:mb-6">
                Features mapped directly from products.php.
              </h1>
              <p className={`text-sm md:text-lg ${palette.mutedText} mb-4 md:mb-8 max-w-3xl mx-auto`}>
                HRM, CRM, Finance, Projects, Inventory, POS, Supply Chain, Quality, DMS, and Compliance use the same data fabric, permissions, and automation engine described in the product catalog.
              </p>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                <Button as={Link} href={route('demo')} size="sm" className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold px-4 md:px-10 text-xs md:text-sm">
                  Walk through the platform
                </Button>
                <Button as={Link} href={route('platform.register.index')} size="sm" variant="bordered" className="border-current px-4 md:px-10 text-xs md:text-sm">
                  Start a trial
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Module Overview Grid - Ultra compact on mobile */}
        <section className="px-3 md:px-6 pb-6 md:pb-12">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-3">
              {platformModules.map((module) => {
                const moduleKey = module.key;
                const isActive = activeModule === moduleKey;
                
                return (
                  <button
                    key={module.name}
                    onClick={() => setActiveModule(moduleKey)}
                    className={`p-2 md:p-3 rounded-lg md:rounded-xl text-left transition-all ${
                      isActive
                        ? `bg-gradient-to-br ${module.color} text-white shadow-lg scale-[1.02]`
                        : `${palette.card} hover:scale-[1.02]`
                    }`}
                  >
                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg mb-1 md:mb-2 flex items-center justify-center ${
                      isActive ? 'bg-white/20' : `bg-gradient-to-br ${module.color} text-white`
                    }`}>
                      {iconMap[module.icon]}
                    </div>
                    <p className="font-semibold text-[10px] md:text-xs leading-tight">{module.name}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Detailed Module Features Section */}
        <section className={`px-3 md:px-6 py-6 md:py-12 ${palette.tint}`}>
          <div className="max-w-6xl mx-auto">
            {/* Module Header */}
            <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-8">
              <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br ${currentModule.color} flex items-center justify-center text-white`}>
                {iconMap[currentModule.icon]}
              </div>
              <div>
                <h2 className="text-lg md:text-2xl lg:text-3xl font-bold">{currentModule.fullName}</h2>
                <p className={`text-xs md:text-sm ${palette.mutedText}`}>Explore features included</p>
              </div>
            </div>

            {/* Submodules Grid - Mobile: Accordion, Desktop: Grid */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {currentModule.submodules.map((submodule) => (
                <Card key={submodule.name} className={`${palette.submoduleCard} h-full`}>
                  <CardBody className="p-3 md:p-4">
                    <h3 className="font-semibold text-sm md:text-base mb-2 md:mb-3">{submodule.name}</h3>
                    <ul className="space-y-1 md:space-y-1.5">
                      {submodule.features.map((feature) => (
                        <li key={feature} className={`flex items-start gap-1.5 md:gap-2 text-xs md:text-sm ${palette.featureItem}`}>
                          <span className={`mt-0.5 flex-shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br ${currentModule.color} flex items-center justify-center text-white`}>
                            {iconMap.check}
                          </span>
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Mobile Accordion View - Ultra compact */}
            <div className="md:hidden">
              <Accordion 
                variant="splitted" 
                selectionMode="multiple"
                className="gap-1.5"
              >
                {currentModule.submodules.map((submodule, index) => (
                  <AccordionItem
                    key={submodule.name}
                    aria-label={submodule.name}
                    title={
                      <div className="flex items-center gap-2">
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${currentModule.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                          {index + 1}
                        </span>
                        <span className="font-medium text-xs">{submodule.name}</span>
                        <Chip size="sm" variant="flat" className="ml-auto text-[9px] h-4 min-w-0 px-1.5">
                          {submodule.features.length}
                        </Chip>
                      </div>
                    }
                    className={`${palette.submoduleCard} px-2 py-0`}
                    classNames={{
                      title: 'text-xs',
                      trigger: 'py-2',
                      content: 'pb-2 pt-0',
                    }}
                  >
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 pl-7">
                      {submodule.features.map((feature) => (
                        <div key={feature} className={`flex items-center gap-1 text-[10px] ${palette.featureItem}`}>
                          <span className={`flex-shrink-0 w-3 h-3 rounded-full bg-gradient-to-br ${currentModule.color} flex items-center justify-center text-white`}>
                            {iconMap.check}
                          </span>
                          <span className="truncate">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        {/* All Modules Quick Overview - Compact cards */}
        <section className="px-3 md:px-6 py-6 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4 md:mb-8">
              <Chip color="primary" variant="flat" className="text-[10px] md:text-xs mb-2">Complete Suite</Chip>
              <h2 className="text-xl md:text-3xl font-semibold">All modules at a glance</h2>
              <p className={`mt-1 md:mt-2 text-xs md:text-base ${palette.mutedText}`}>
                Click any product above to explore its detailed features
              </p>
            </div>

            <div className="grid gap-3 md:gap-4">
              {Object.entries(moduleFeatures).map(([key, module]) => (
                <Card 
                  key={key} 
                  className={`${palette.card} cursor-pointer transition-all hover:scale-[1.01]`}
                  isPressable
                  onPress={() => {
                    setActiveModule(key);
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                >
                  <CardBody className="p-3 md:p-4">
                    <div className="flex items-start gap-2 md:gap-4">
                      <div className={`flex-shrink-0 w-8 h-8 md:w-12 md:h-12 rounded-lg md:rounded-xl bg-gradient-to-br ${module.color} flex items-center justify-center text-white`}>
                        {iconMap[module.icon]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm md:text-lg">{module.name}</h3>
                        </div>
                        <p className={`text-[10px] md:text-sm ${palette.mutedText} mb-2 hidden md:block`}>{module.fullName}</p>
                        {/* Submodule tags - scrollable on mobile */}
                        <div className="flex flex-wrap gap-1 md:gap-1.5">
                          {module.submodules.slice(0, 4).map((sub) => (
                            <span key={sub.name} className={`text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 rounded ${palette.badge}`}>
                              {sub.name}
                            </span>
                          ))}
                          {module.submodules.length > 4 && (
                            <span className={`text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 rounded ${palette.badge}`}>
                              +{module.submodules.length - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Workflow Engine Section - Compact on mobile */}
        <section className={`px-3 md:px-6 py-6 md:py-12 ${palette.tint}`}>
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-4 md:mb-8">
              <Chip color="success" variant="flat" className="text-[10px] md:text-xs mb-2">Workflow engine</Chip>
              <h2 className="text-xl md:text-3xl font-semibold">One loop keeps everyone aligned</h2>
              <p className={`mt-1 md:mt-2 text-xs md:text-base ${palette.mutedText}`}>
                Signals feed AI insights, automations sync systems, dashboards show changes
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {workflowTimeline.map((stage, index) => (
                <Card key={stage.step} className={palette.card}>
                  <CardBody className="p-2 md:p-4 space-y-1 md:space-y-3">
                    <Chip color="secondary" variant="flat" size="sm" className="text-[9px] md:text-xs h-4 md:h-6 min-w-0 px-1.5 md:px-2">{index + 1}</Chip>
                    <h3 className="text-xs md:text-lg font-semibold">{stage.step}</h3>
                    <p className={`text-[10px] md:text-sm ${palette.mutedText} leading-tight`}>{stage.caption}</p>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Industry Templates - Compact on mobile */}
        <section className="px-3 md:px-6 py-6 md:py-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-4 md:mb-8">
              <Chip color="warning" variant="flat" className="text-[10px] md:text-xs mb-2">Vertical packs</Chip>
              <h2 className="text-xl md:text-3xl font-semibold">Industry templates ready to deploy</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-2 md:gap-4">
              {industryStarters.map((starter) => (
                <Card key={starter.industry} className={`${palette.card} h-full`}>
                  <CardBody className="p-3 md:p-4 space-y-2 md:space-y-3">
                    <div>
                      <p className={`text-[9px] md:text-xs ${palette.mutedText}`}>Starter pack</p>
                      <h3 className="text-sm md:text-xl font-semibold">{starter.industry}</h3>
                    </div>
                    <p className={`text-[10px] md:text-sm ${palette.mutedText} leading-tight`}>{starter.description}</p>
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {starter.badges.map((badge) => (
                        <span key={badge} className={`text-[9px] md:text-xs font-medium px-1.5 md:px-2 py-0.5 rounded-full ${palette.badge}`}>
                          {badge}
                        </span>
                      ))}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Compact on mobile */}
        <section className="px-3 md:px-6 pb-8 md:pb-24">
          <Card className={`max-w-5xl mx-auto text-center ${palette.highlightCard}`}>
            <CardBody className="space-y-3 md:space-y-5 p-4 md:p-8">
              <Chip color="primary" variant="flat" className="text-[10px] md:text-xs">Next steps</Chip>
              <h3 className="text-xl md:text-4xl font-semibold">Pick modules today, add more tomorrow.</h3>
              <p className={`text-xs md:text-base ${palette.mutedText}`}>
                Grab a guided tour or launch a no-card-required trial right away.
              </p>
              <div className="flex flex-wrap justify-center gap-2 md:gap-4">
                <Button as={Link} href={route('demo')} size="sm" className={`${isDarkMode ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'} font-semibold px-4 md:px-10 text-xs md:text-sm`}>
                  Book a live demo
                </Button>
                <Button as={Link} href={route('platform.register.index')} size="sm" variant="bordered" className="border-current px-4 md:px-10 text-xs md:text-sm">
                  Start free trial
                </Button>
              </div>
            </CardBody>
          </Card>
        </section>
      </div>
    </PublicLayout>
  );
}
