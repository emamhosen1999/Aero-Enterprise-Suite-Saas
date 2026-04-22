import { useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { fadeUp, staggerContainer } from '../utils/motionVariants.js';
import { MODULES, MODULE_CATEGORIES } from '../utils/pageData.js';

// ─── Simple coloured monogram badge ────────────────────────────────────────
const IconBadge = ({ label, accentColor, size = 40 }) => (
    <div
        style={{
            width: size,
            height: size,
            borderRadius: 10,
            background: `color-mix(in srgb, ${accentColor} 18%, transparent)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size * 0.35,
            fontWeight: 700,
            color: accentColor,
            flexShrink: 0,
            fontFamily: "'JetBrains Mono', monospace",
        }}
    >
        {label.slice(0, 2).toUpperCase()}
    </div>
);

export default function ModuleGrid({
    activeCategory,
    setActiveCategory,
    selectedModule,
    setSelectedModule,
}) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: '-60px' });
    const { isDark } = usePublicTheme();

    const filtered = MODULES.filter(
        (m) => activeCategory === 'all' || m.category === activeCategory
    );

    const handleCardClick = (moduleId) => {
        setSelectedModule((prev) => (prev === moduleId ? null : moduleId));
        // Scroll to detail panel smoothly
        if (selectedModule !== moduleId) {
            setTimeout(() => {
                document.getElementById('module-detail')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 120);
        }
    };

    return (
        <section id="modules" className="relative py-20 px-6 lg:px-10" ref={ref}>
            <motion.div
                variants={staggerContainer}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className="max-w-screen-xl mx-auto flex flex-col gap-10"
            >
                {/* Section heading */}
                <div className="text-center flex flex-col items-center gap-3">
                    <motion.h2
                        variants={fadeUp}
                        custom={0}
                        className="text-3xl sm:text-4xl font-extrabold"
                        style={{
                            color: isDark ? '#E8EDF5' : '#0F172A',
                            fontFamily: "'Syne', sans-serif",
                        }}
                    >
                        Explore every module
                    </motion.h2>
                    {/* Cyan underline accent */}
                    <motion.div
                        variants={fadeUp}
                        custom={0}
                        className="w-12 h-0.5 rounded-full"
                        style={{ background: 'var(--cyan-aeos)' }}
                    />
                    <motion.p
                        variants={fadeUp}
                        custom={1}
                        className="text-sm sm:text-base max-w-lg"
                        style={{
                            color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
                            fontFamily: "'DM Sans', sans-serif",
                        }}
                    >
                        14 purpose-built modules. Filter by category to find what your team needs.
                    </motion.p>
                </div>

                {/* Category filter bar */}
                <motion.div
                    variants={fadeUp}
                    custom={2}
                    className="flex items-center justify-center"
                >
                    <div
                        className="flex gap-2 overflow-x-auto pb-1 max-w-full"
                        style={{ scrollbarWidth: 'none' }}
                    >
                        {MODULE_CATEGORIES.map((cat) => {
                            const isActive = activeCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setActiveCategory(cat.id)}
                                    className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
                                    style={{
                                        background: isActive
                                            ? 'var(--cyan-aeos)'
                                            : isDark
                                                ? 'rgba(255,255,255,0.05)'
                                                : 'rgba(0,0,0,0.04)',
                                        color: isActive
                                            ? '#03040A'
                                            : isDark
                                                ? 'rgba(255,255,255,0.6)'
                                                : '#64748B',
                                        border: isActive
                                            ? '1px solid transparent'
                                            : `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                        fontFamily: "'DM Sans', sans-serif",
                                        cursor: 'pointer',
                                    }}
                                >
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Module cards grid */}
                <motion.div
                    layout
                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                >
                    <AnimatePresence mode="popLayout">
                        {filtered.map((module) => {
                            const isSelected = selectedModule === module.id;
                            return (
                                <motion.div
                                    key={module.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.88 }}
                                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                                    whileHover={{ scale: 1.03 }}
                                    onClick={() => handleCardClick(module.id)}
                                    className="relative flex flex-col gap-3 p-5 rounded-2xl cursor-pointer transition-all"
                                    style={{
                                        background: isSelected
                                            ? isDark
                                                ? `color-mix(in srgb, ${module.accentColor} 8%, rgba(255,255,255,0.04))`
                                                : `color-mix(in srgb, ${module.accentColor} 6%, white)`
                                            : isDark
                                                ? 'rgba(255,255,255,0.04)'
                                                : 'white',
                                        border: isSelected
                                            ? `1px solid color-mix(in srgb, ${module.accentColor} 50%, transparent)`
                                            : `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
                                        boxShadow: isSelected
                                            ? `0 0 16px color-mix(in srgb, ${module.accentColor} 18%, transparent)`
                                            : isDark
                                                ? 'none'
                                                : '0 1px 3px rgba(0,0,0,0.06)',
                                    }}
                                >
                                    {/* Icon badge */}
                                    <IconBadge
                                        label={module.label}
                                        accentColor={module.accentColor}
                                        size={40}
                                    />

                                    {/* Label */}
                                    <p
                                        className="text-sm font-bold leading-tight"
                                        style={{
                                            color: isDark ? '#E8EDF5' : '#0F172A',
                                            fontFamily: "'Syne', sans-serif",
                                        }}
                                    >
                                        {module.label}
                                    </p>

                                    {/* Tagline */}
                                    <p
                                        className="text-xs leading-snug overflow-hidden"
                                        style={{
                                            color: isDark ? 'rgba(255,255,255,0.45)' : '#64748B',
                                            fontFamily: "'DM Sans', sans-serif",
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                        }}
                                    >
                                        {module.tagline}
                                    </p>

                                    {/* Stat chip */}
                                    {module.stat && (
                                        <div className="mt-auto pt-1">
                                            <span
                                                className="inline-flex items-center gap-1 text-xs font-semibold"
                                                style={{
                                                    color: module.accentColor,
                                                    fontFamily: "'JetBrains Mono', monospace",
                                                }}
                                            >
                                                <span>{module.stat.value}</span>
                                                <span
                                                    className="font-normal"
                                                    style={{
                                                        color: isDark
                                                            ? 'rgba(255,255,255,0.4)'
                                                            : '#64748B',
                                                    }}
                                                >
                                                    {module.stat.label}
                                                </span>
                                            </span>
                                        </div>
                                    )}

                                    {/* Selected indicator dot */}
                                    {isSelected && (
                                        <div
                                            className="absolute top-3 right-3 w-2 h-2 rounded-full"
                                            style={{ background: module.accentColor }}
                                        />
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </motion.div>
            </motion.div>
        </section>
    );
}
