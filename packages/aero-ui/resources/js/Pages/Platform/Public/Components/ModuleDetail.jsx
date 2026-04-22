import { AnimatePresence, motion } from 'framer-motion';
import { usePublicTheme } from '../utils/publicTheme.jsx';
import { MODULES } from '../utils/pageData.js';

// ─── Monogram badge ────────────────────────────────────────────────────────
const IconBadge = ({ label, accentColor, size = 48 }) => (
    <div
        style={{
            width: size,
            height: size,
            borderRadius: 14,
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

export default function ModuleDetail({ selectedModule, setSelectedModule }) {
    const { isDark } = usePublicTheme();
    const module = MODULES.find((m) => m.id === selectedModule) ?? null;

    return (
        <div id="module-detail" className="px-6 lg:px-10">
            <div className="max-w-screen-xl mx-auto">
                <AnimatePresence mode="wait">
                    {module && (
                        <motion.div
                            key={module.id}
                            initial={{ opacity: 0, y: -16, height: 0 }}
                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                            exit={{ opacity: 0, y: -12, height: 0 }}
                            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden mb-8"
                        >
                            <div
                                className="relative rounded-2xl p-7 sm:p-9"
                                style={{
                                    background: isDark
                                        ? 'rgba(255,255,255,0.06)'
                                        : 'white',
                                    border: `1px solid color-mix(in srgb, ${module.accentColor} ${isDark ? '30%' : '40%'}, transparent)`,
                                    boxShadow: isDark
                                        ? `0 0 32px color-mix(in srgb, ${module.accentColor} 8%, transparent)`
                                        : '0 4px 24px rgba(0,0,0,0.08)',
                                }}
                            >
                                {/* Close button */}
                                <button
                                    onClick={() => setSelectedModule(null)}
                                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                                    style={{
                                        background: isDark
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'rgba(0,0,0,0.05)',
                                        color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                        cursor: 'pointer',
                                    }}
                                    onMouseEnter={e => {
                                        e.currentTarget.style.background = isDark
                                            ? 'rgba(255,255,255,0.1)'
                                            : 'rgba(0,0,0,0.08)';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.background = isDark
                                            ? 'rgba(255,255,255,0.06)'
                                            : 'rgba(0,0,0,0.05)';
                                    }}
                                    aria-label="Close module detail"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>

                                {/* Module category badge */}
                                <div className="mb-5">
                                    <span
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest"
                                        style={{
                                            background: `color-mix(in srgb, ${module.accentColor} 12%, transparent)`,
                                            color: module.accentColor,
                                            border: `1px solid color-mix(in srgb, ${module.accentColor} 25%, transparent)`,
                                            fontFamily: "'JetBrains Mono', monospace",
                                        }}
                                    >
                                        {module.category}
                                    </span>
                                </div>

                                {/* Module identity */}
                                <div className="flex items-start gap-4 mb-7">
                                    <IconBadge
                                        label={module.label}
                                        accentColor={module.accentColor}
                                        size={52}
                                    />
                                    <div className="flex flex-col gap-1">
                                        <h3
                                            className="text-2xl sm:text-3xl font-extrabold leading-tight"
                                            style={{
                                                color: isDark ? '#E8EDF5' : '#0F172A',
                                                fontFamily: "'Syne', sans-serif",
                                            }}
                                        >
                                            {module.label}
                                        </h3>
                                        <p
                                            className="text-sm sm:text-base"
                                            style={{
                                                color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
                                                fontFamily: "'DM Sans', sans-serif",
                                            }}
                                        >
                                            {module.tagline}
                                        </p>
                                    </div>
                                </div>

                                {/* Highlights grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8">
                                    {module.highlights.map((item) => (
                                        <div
                                            key={item}
                                            className="flex items-start gap-2.5 py-1.5"
                                        >
                                            {/* Check icon */}
                                            <svg
                                                className="w-4 h-4 mt-0.5 flex-shrink-0"
                                                style={{ color: module.accentColor }}
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2.5}
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M4.5 12.75l6 6 9-13.5"
                                                />
                                            </svg>
                                            <span
                                                className="text-sm"
                                                style={{
                                                    color: isDark
                                                        ? 'rgba(255,255,255,0.72)'
                                                        : '#374151',
                                                    fontFamily: "'DM Sans', sans-serif",
                                                }}
                                            >
                                                {item}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Divider */}
                                <div
                                    className="w-full h-px mb-6"
                                    style={{
                                        background: isDark
                                            ? 'rgba(255,255,255,0.07)'
                                            : 'rgba(0,0,0,0.07)',
                                    }}
                                />

                                {/* Action buttons */}
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    <a
                                        href="/signup"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all"
                                        style={{
                                            background: module.accentColor,
                                            color: '#03040A',
                                            fontFamily: "'DM Sans', sans-serif",
                                            boxShadow: `0 0 20px color-mix(in srgb, ${module.accentColor} 30%, transparent)`,
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.opacity = '0.9';
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.opacity = '1';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }}
                                    >
                                        Get started with {module.label}
                                    </a>
                                    <a
                                        href="/pricing"
                                        className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all"
                                        style={{
                                            color: isDark ? 'rgba(255,255,255,0.55)' : '#64748B',
                                            fontFamily: "'DM Sans', sans-serif",
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.color = module.accentColor;
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.color = isDark
                                                ? 'rgba(255,255,255,0.55)'
                                                : '#64748B';
                                        }}
                                    >
                                        View pricing
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
