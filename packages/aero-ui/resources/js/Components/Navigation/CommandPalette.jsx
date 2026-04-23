import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { router, usePage, Link } from '@inertiajs/react';
import { hasRoute, safeNavigate } from '@/utils/routing/routeUtils';
import { useNavigation } from '@/Layouts/Navigation/NavigationProvider';
import {
  Modal,
  ModalContent,
  Input,
  Kbd,
  ScrollShadow,
  Chip,
  Tooltip,
} from "@heroui/react";
import {
  MagnifyingGlassIcon,
  ClockIcon,
  ArrowRightIcon,
  CommandLineIcon,
  HomeIcon,
  FolderIcon,
  SparklesIcon,
  HashtagIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  GlobeAltIcon,
  ChevronRightIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  RocketLaunchIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Keyframes ─── */
const paletteKeyframes = `
@keyframes cmdAccentFlow {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes cmdPulseGlow {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.8; }
}
@keyframes cmdFloatOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33%      { transform: translate(20px, -10px) scale(1.05); }
  66%      { transform: translate(-15px, 8px) scale(0.95); }
}
`;

/* ─── Category mapping ─── */
const categoryConfig = {
  main:     { icon: HomeIcon,           color: 'primary',  label: 'Navigation' },
  hrm:      { icon: UserGroupIcon,      color: 'secondary', label: 'HR' },
  finance:  { icon: CurrencyDollarIcon, color: 'success',  label: 'Finance' },
  admin:    { icon: ShieldCheckIcon,    color: 'danger',   label: 'Admin' },
  settings: { icon: Cog6ToothIcon,      color: 'warning',  label: 'Settings' },
  reports:  { icon: ChartBarIcon,       color: 'primary',  label: 'Reports' },
  default:  { icon: FolderIcon,         color: 'default',  label: 'Module' },
};

const getCategoryConfig = (cat) => categoryConfig[cat] || categoryConfig.default;

/* ─── Highlight matched text ─── */
const HighlightText = ({ text, query }) => {
  if (!query?.trim() || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <span key={i} style={{ color: 'var(--theme-primary, #006FEE)', fontWeight: 600 }}>{part}</span>
    ) : part
  );
};

/* ─── Result Item ─── */
const ResultItem = React.memo(({ item, index, isSelected, query, onSelect }) => {
  const cfg = getCategoryConfig(item.category);
  const IconComp = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      onClick={() => onSelect(item)}
      className="group relative cursor-pointer"
      style={{ borderRadius: 'var(--borderRadius, 8px)' }}
    >
      {/* Selection indicator bar */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            layoutId="cmd-selected-bar"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full"
            style={{
              height: '60%',
              background: `var(--theme-primary, #006FEE)`,
            }}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
      </AnimatePresence>

      <div
        className="flex items-center gap-3 px-3 py-2.5 transition-all duration-150"
        style={{
          borderRadius: 'var(--borderRadius, 8px)',
          background: isSelected
            ? 'color-mix(in srgb, var(--theme-primary, #006FEE) 8%, transparent)'
            : 'transparent',
        }}
      >
        {/* Icon container */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-all duration-200"
          style={{
            background: isSelected
              ? 'color-mix(in srgb, var(--theme-primary, #006FEE) 15%, transparent)'
              : 'color-mix(in srgb, var(--theme-content2, #F4F4F5) 80%, transparent)',
            color: isSelected ? 'var(--theme-primary, #006FEE)' : 'var(--theme-foreground-500, #71717A)',
          }}
        >
          {React.isValidElement(item.icon)
            ? React.cloneElement(item.icon, { className: 'w-4 h-4' })
            : <IconComp className="w-4 h-4" />
          }
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate" style={{
              color: isSelected ? 'var(--theme-foreground, #18181B)' : undefined,
            }}>
              <HighlightText text={item.name} query={query} />
            </span>
            <Chip
              size="sm"
              variant="flat"
              color={cfg.color}
              className="text-[10px] h-5 px-1.5"
            >
              {cfg.label}
            </Chip>
          </div>
          {item.fullPath && (
            <p className="text-[11px] text-default-400 truncate mt-0.5 flex items-center gap-1">
              {item.fullPath.split(' > ').map((part, i, arr) => (
                <React.Fragment key={i}>
                  <span><HighlightText text={part} query={query} /></span>
                  {i < arr.length - 1 && <ChevronRightIcon className="w-2.5 h-2.5 inline text-default-300" />}
                </React.Fragment>
              ))}
            </p>
          )}
        </div>

        {/* Right side — action hint or path preview */}
        <div className="flex items-center gap-2 shrink-0">
          {isSelected ? (
            <motion.div
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5"
            >
              <span className="text-[10px] text-default-400">Open</span>
              <div
                className="flex items-center justify-center w-5 h-5 rounded"
                style={{
                  background: 'color-mix(in srgb, var(--theme-primary, #006FEE) 12%, transparent)',
                  color: 'var(--theme-primary, #006FEE)',
                }}
              >
                <ArrowRightIcon className="w-3 h-3" />
              </div>
            </motion.div>
          ) : (
            <span className="text-[10px] text-default-300 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.path}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
});

/* ─── Quick Action Pill ─── */
const QuickAction = ({ icon: Icon, label, onPress }) => (
  <motion.button
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.96 }}
    onClick={onPress}
    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer"
    style={{
      borderRadius: 'var(--borderRadius, 20px)',
      background: 'color-mix(in srgb, var(--theme-content2, #F4F4F5) 60%, transparent)',
      border: '1px solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 50%, transparent)',
      color: 'var(--theme-foreground-600, #52525B)',
    }}
  >
    <Icon className="w-3.5 h-3.5" />
    {label}
  </motion.button>
);

/* ─── Section Header ─── */
const SectionHeader = ({ icon: Icon, label, count, color = 'default' }) => (
  <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
    <div
      className="flex items-center justify-center w-5 h-5 rounded"
      style={{
        background: `color-mix(in srgb, var(--theme-${color === 'default' ? 'foreground' : color}, #006FEE) 10%, transparent)`,
      }}
    >
      <Icon className="w-3 h-3" style={{ color: `var(--theme-${color === 'default' ? 'foreground-400' : color}, #006FEE)` }} />
    </div>
    <span className="text-[11px] font-semibold text-default-400 uppercase tracking-wider flex-1">
      {label}
    </span>
    {count > 0 && (
      <span className="text-[10px] text-default-300 tabular-nums">{count}</span>
    )}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   CommandPalette — Premium glassmorphic command interface
   ═══════════════════════════════════════════════════════════ */
const CommandPalette = ({ isOpen, onClose, pages }) => {
  const { auth } = usePage().props;
  const { navItems, userNavMetadata } = useNavigation();
  const effectivePages = pages ?? navItems ?? [];

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentPages, setRecentPages] = useState([]);
  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Build suggested items from AI metadata
  const suggestedItems = useMemo(() => {
    if (!userNavMetadata?.topPaths?.length || !effectivePages.length) return [];
    const flattenItems = (items) => {
      const result = [];
      items.forEach(item => {
        if (item.path) result.push(item);
        if (item.subMenu) result.push(...flattenItems(item.subMenu));
      });
      return result;
    };
    const flat = flattenItems(effectivePages);
    return userNavMetadata.topPaths
      .map(tp => {
        const item = flat.find(i => i.path === tp.path);
        return item ? { ...item, visitCount: tp.visit_count } : null;
      })
      .filter(Boolean)
      .slice(0, 5);
  }, [userNavMetadata?.topPaths, effectivePages]);

  // Recent pages (localStorage)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('command_palette_recent');
      if (stored) setRecentPages(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  const addToRecent = useCallback((item) => {
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.path !== item.path);
      const { icon, score, ...safe } = item;
      const updated = [safe, ...filtered].slice(0, 10);
      try { localStorage.setItem('command_palette_recent', JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  }, []);

  // Flatten nav tree
  const allItems = useMemo(() => {
    const flatten = (items, category = 'main', parentName = '') => {
      const out = [];
      items.forEach(page => {
        if (page.path) {
          out.push({
            ...page,
            category: page.category || category,
            fullPath: parentName ? `${parentName} > ${page.name}` : page.name,
            searchText: `${page.name} ${parentName} ${page.category || category} ${page.path}`.toLowerCase()
          });
        }
        if (page.subMenu?.length) {
          out.push(...flatten(page.subMenu, page.category || category, parentName ? `${parentName} > ${page.name}` : page.name));
        }
      });
      return out;
    };
    return flatten(effectivePages);
  }, [effectivePages]);

  // Fuzzy search with scoring
  const searchItems = useCallback((q) => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    const words = lq.split(' ').filter(Boolean);
    return allItems
      .map(item => {
        let score = 0;
        const st = item.searchText;
        if (st.includes(lq)) score += 100;
        words.forEach(w => {
          if (st.includes(w)) score += 10;
          if (st.match(new RegExp(`\\b${w}`, 'i'))) score += 5;
        });
        if (item.name.toLowerCase().includes(lq)) score += 50;
        if (item.name.toLowerCase().startsWith(lq)) score += 30;
        return { ...item, score };
      })
      .filter(i => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);
  }, [allItems]);

  const results = useMemo(() => {
    if (!query.trim()) return recentPages;
    return searchItems(query);
  }, [query, searchItems, recentPages]);

  // Group results by category
  const groupedResults = useMemo(() => {
    if (!query.trim()) return null; // For recent, show flat
    const groups = {};
    results.forEach(item => {
      const cat = item.category || 'default';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return Object.keys(groups).length > 1 ? groups : null;
  }, [results, query]);

  // Flat index → for keyboard nav across groups
  const flatResults = useMemo(() => {
    if (!groupedResults) return results;
    return Object.values(groupedResults).flat();
  }, [groupedResults, results]);

  const handleSelect = useCallback((item) => {
    if (item.path) {
      addToRecent(item);
      safeNavigate(item.path, {}, { method: item.method || 'get', preserveState: false, preserveScroll: false });
      onClose();
      setQuery('');
    }
  }, [addToRecent, onClose]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); setSelectedIndex(p => p < flatResults.length - 1 ? p + 1 : 0); break;
        case 'ArrowUp':   e.preventDefault(); setSelectedIndex(p => p > 0 ? p - 1 : flatResults.length - 1); break;
        case 'Enter':     e.preventDefault(); if (flatResults[selectedIndex]) handleSelect(flatResults[selectedIndex]); break;
        case 'Escape':    e.preventDefault(); onClose(); setQuery(''); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, flatResults, selectedIndex, handleSelect, onClose]);

  useEffect(() => { setSelectedIndex(0); }, [results]);

  useEffect(() => {
    if (resultsRef.current && flatResults.length > 0) {
      const el = resultsRef.current.querySelector(`[data-idx="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex, flatResults]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Quick actions
  const quickActions = useMemo(() => [
    { icon: HomeIcon, label: 'Dashboard', path: '/dashboard' },
    { icon: UserGroupIcon, label: 'Employees', path: '/hrm/employees' },
    { icon: CalendarIcon, label: 'Attendance', path: '/hrm/attendance' },
    { icon: ClipboardDocumentListIcon, label: 'Leaves', path: '/hrm/leaves' },
    { icon: Cog6ToothIcon, label: 'Settings', path: '/settings' },
  ], []);

  const handleQuickAction = useCallback((action) => {
    safeNavigate(action.path, {}, { preserveState: false });
    onClose();
    setQuery('');
  }, [onClose]);

  // Clear recent
  const clearRecent = useCallback(() => {
    setRecentPages([]);
    try { localStorage.removeItem('command_palette_recent'); } catch { /* ignore */ }
  }, []);

  /* ─── Render ─── */
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => { onClose(); setQuery(''); }}
      size="2xl"
      placement="top"
      backdrop="blur"
      hideCloseButton
      classNames={{
        base: "mt-[12vh]",
        wrapper: "overflow-hidden",
        backdrop: "bg-black/30",
      }}
      motionProps={{
        variants: {
          enter: { y: 0, opacity: 1, scale: 1, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] } },
          exit:  { y: -12, opacity: 0, scale: 0.98, transition: { duration: 0.15, ease: 'easeIn' } },
        }
      }}
    >
      <ModalContent className="!p-0 overflow-hidden" style={{
        background: 'color-mix(in srgb, var(--theme-content1, #FFFFFF) 85%, transparent)',
        backdropFilter: 'blur(24px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
        borderRadius: 'var(--borderRadius, 16px)',
        border: '1px solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 50%, transparent)',
        boxShadow: `
          0 0 0 1px color-mix(in srgb, var(--theme-divider) 20%, transparent),
          0 20px 60px -15px rgba(0,0,0,0.2),
          0 0 40px -10px color-mix(in srgb, var(--theme-primary, #006FEE) 10%, transparent)
        `,
      }}>
        {/* Inject keyframes */}
        <style>{paletteKeyframes}</style>

        {/* Top accent strip */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] z-10"
          style={{
            background: `linear-gradient(90deg, transparent, color-mix(in srgb, var(--theme-primary, #006FEE) 60%, transparent) 20%, var(--theme-primary, #006FEE) 50%, color-mix(in srgb, var(--theme-primary, #006FEE) 60%, transparent) 80%, transparent)`,
            backgroundSize: '200% 100%',
            animation: 'cmdAccentFlow 4s ease infinite',
          }}
        />

        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-20 -right-20 w-40 h-40 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--theme-primary, #006FEE) 5%, transparent)',
              filter: 'blur(40px)',
              animation: 'cmdFloatOrb 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full"
            style={{
              background: 'color-mix(in srgb, var(--theme-secondary, #7828C8) 4%, transparent)',
              filter: 'blur(35px)',
              animation: 'cmdFloatOrb 10s ease-in-out infinite reverse',
            }}
          />
        </div>

        {/* ═══ Search Header ═══ */}
        <div className="relative px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--theme-primary, #006FEE) 12%, transparent)',
              }}
            >
              <MagnifyingGlassIcon className="w-4 h-4" style={{ color: 'var(--theme-primary, #006FEE)' }} />
            </div>
            <Input
              ref={inputRef}
              placeholder="Type a command or search..."
              value={query}
              onValueChange={setQuery}
              variant="flat"
              autoFocus
              classNames={{
                inputWrapper: "shadow-none border-none bg-transparent px-0 h-10",
                input: "text-base font-medium placeholder:text-default-400",
              }}
            />
            <div className="flex items-center gap-1.5 shrink-0">
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setQuery('')}
                  className="flex items-center justify-center w-6 h-6 rounded-md cursor-pointer transition-colors hover:bg-default-200"
                  style={{ background: 'color-mix(in srgb, var(--theme-content2) 60%, transparent)' }}
                >
                  <XMarkIcon className="w-3.5 h-3.5 text-default-500" />
                </motion.button>
              )}
              <Kbd className="text-[10px]" keys={["escape"]}>ESC</Kbd>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="h-px mx-4"
          style={{ background: 'linear-gradient(90deg, transparent, var(--theme-divider, #E4E4E7), transparent)' }}
        />

        {/* ═══ Quick Actions (only when no query) ═══ */}
        {!query.trim() && (
          <div className="relative px-4 pt-3 pb-1">
            <div className="flex items-center gap-2 mb-2">
              <BoltIcon className="w-3.5 h-3.5 text-default-400" />
              <span className="text-[11px] font-semibold text-default-400 uppercase tracking-wider">Quick Jump</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map(a => (
                <QuickAction key={a.path} icon={a.icon} label={a.label} onPress={() => handleQuickAction(a)} />
              ))}
            </div>
          </div>
        )}

        {/* ═══ Results Area ═══ */}
        <div className="relative">
          <ScrollShadow className="max-h-[360px] py-2" hideScrollBar>
            <div ref={resultsRef}>
              {/* ─── No Query + No Recent: Welcome state ─── */}
              {!query.trim() && results.length === 0 && suggestedItems.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                    style={{
                      background: 'linear-gradient(135deg, color-mix(in srgb, var(--theme-primary) 12%, transparent), color-mix(in srgb, var(--theme-secondary, #7828C8) 8%, transparent))',
                    }}
                  >
                    <RocketLaunchIcon className="w-7 h-7" style={{ color: 'var(--theme-primary, #006FEE)' }} />
                  </motion.div>
                  <p className="font-semibold text-sm text-default-600 mb-1">Where do you want to go?</p>
                  <p className="text-xs text-default-400 text-center max-w-xs">
                    Search pages, modules, and features across the entire platform
                  </p>
                </div>
              )}

              {/* ─── Suggested (AI) ─── */}
              {!query.trim() && suggestedItems.length > 0 && (
                <>
                  <SectionHeader icon={SparklesIcon} label="Suggested for you" count={suggestedItems.length} color="primary" />
                  {suggestedItems.map((item, i) => (
                    <div key={`s-${item.path}`} data-idx={i}>
                      <ResultItem
                        item={item}
                        index={i}
                        isSelected={selectedIndex === i}
                        query=""
                        onSelect={handleSelect}
                      />
                    </div>
                  ))}
                </>
              )}

              {/* ─── Recent Pages (no query) ─── */}
              {!query.trim() && results.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1.5">
                    <div className="flex items-center justify-center w-5 h-5 rounded" style={{
                      background: 'color-mix(in srgb, var(--theme-foreground-400, #A1A1AA) 10%, transparent)',
                    }}>
                      <ClockIcon className="w-3 h-3 text-default-400" />
                    </div>
                    <span className="text-[11px] font-semibold text-default-400 uppercase tracking-wider flex-1">
                      Recent
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={clearRecent}
                      className="text-[10px] text-default-300 hover:text-danger cursor-pointer transition-colors px-1.5 py-0.5 rounded"
                    >
                      Clear
                    </motion.button>
                  </div>
                  {results.map((item, i) => {
                    const idx = suggestedItems.length + i;
                    return (
                      <div key={`r-${item.path}-${i}`} data-idx={idx}>
                        <ResultItem
                          item={item}
                          index={i}
                          isSelected={selectedIndex === idx}
                          query=""
                          onSelect={handleSelect}
                        />
                      </div>
                    );
                  })}
                </>
              )}

              {/* ─── Search results (grouped) ─── */}
              {query.trim() && groupedResults && (() => {
                let globalIdx = 0;
                return Object.entries(groupedResults).map(([cat, items]) => {
                  const cfg = getCategoryConfig(cat);
                  const section = (
                    <React.Fragment key={`grp-${cat}`}>
                      <SectionHeader icon={cfg.icon} label={cfg.label} count={items.length} color={cfg.color} />
                      {items.map((item) => {
                        const idx = globalIdx++;
                        return (
                          <div key={`${item.path}-${idx}`} data-idx={idx}>
                            <ResultItem item={item} index={idx} isSelected={selectedIndex === idx} query={query} onSelect={handleSelect} />
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                  return section;
                });
              })()}

              {/* ─── Search results (flat, single category) ─── */}
              {query.trim() && !groupedResults && results.length > 0 && (
                <>
                  <SectionHeader icon={MagnifyingGlassIcon} label={`${results.length} result${results.length === 1 ? '' : 's'}`} count={0} />
                  {results.map((item, i) => (
                    <div key={`f-${item.path}-${i}`} data-idx={i}>
                      <ResultItem item={item} index={i} isSelected={selectedIndex === i} query={query} onSelect={handleSelect} />
                    </div>
                  ))}
                </>
              )}

              {/* ─── No search results ─── */}
              {query.trim() && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center justify-center w-12 h-12 rounded-xl mb-3"
                    style={{
                      background: 'color-mix(in srgb, var(--theme-content2) 80%, transparent)',
                    }}
                  >
                    <MagnifyingGlassIcon className="w-6 h-6 text-default-300" />
                  </motion.div>
                  <p className="font-medium text-sm text-default-500">No results for "{query}"</p>
                  <p className="text-xs text-default-400 mt-1">Try a different keyword or check spelling</p>
                </div>
              )}
            </div>
          </ScrollShadow>
        </div>

        {/* ═══ Footer ═══ */}
        <div
          className="relative px-4 py-2.5"
          style={{
            background: 'color-mix(in srgb, var(--theme-content2, #F4F4F5) 40%, transparent)',
            borderTop: '1px solid color-mix(in srgb, var(--theme-divider, #E4E4E7) 50%, transparent)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-[11px] text-default-400">
              <span className="flex items-center gap-1">
                <Kbd className="text-[9px]" keys={["up"]}>↑</Kbd>
                <Kbd className="text-[9px]" keys={["down"]}>↓</Kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <Kbd className="text-[9px]" keys={["enter"]}>↵</Kbd>
                <span>Open</span>
              </span>
              <span className="flex items-center gap-1">
                <Kbd className="text-[9px]" keys={["escape"]}>Esc</Kbd>
                <span>Close</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-default-300">
              <GlobeAltIcon className="w-3 h-3" />
              <span>{allItems.length} pages indexed</span>
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};

export default CommandPalette;
