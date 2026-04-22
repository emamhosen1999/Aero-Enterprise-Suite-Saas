import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { FEATURES } from "../utils/pageData";
import { staggerContainer, scaleIn, bentoCardHover, bentoIconHover, fadeUp } from "../utils/motionVariants";
import { useBentoMouseGlow } from "../utils/hooks";

// ── Heroicon Map ─────────────────────────────────────────────────────────────
const ICONS = {
  UsersGroup: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  ),
  ChartBarSquare: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
  ),
  CurrencyDollar: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  ShieldCheck: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  CodeBracketSquare: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
    </svg>
  ),
  Bolt: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  ),
};

const ACCENT_COLORS = {
  cyan:   { bg: "rgba(0,229,255,0.1)",    border: "rgba(0,229,255,0.2)",   text: "#00E5FF" },
  amber:  { bg: "rgba(255,179,71,0.1)",   border: "rgba(255,179,71,0.2)",  text: "#FFB347" },
  indigo: { bg: "rgba(99,102,241,0.1)",   border: "rgba(99,102,241,0.2)",  text: "#6366F1" },
};

// ── Single Bento Card ─────────────────────────────────────────────────────────
function BentoCard({ feature, colSpan = 1 }) {
  const ref = useRef(null);
  const { onMouseMove } = useBentoMouseGlow(ref);
  const accent = ACCENT_COLORS[feature.accent] || ACCENT_COLORS.cyan;

  const isLarge  = feature.size === "large";
  const isMedium = feature.size === "medium";

  return (
    <motion.div
      ref={ref}
      custom={0}
      variants={scaleIn}
      className={`bento-card p-6 flex flex-col justify-between relative ${
        isLarge ? "md:col-span-2 min-h-[260px]" :
        isMedium ? "min-h-[220px]" :
        "min-h-[180px]"
      }`}
      whileHover="hover"
      initial="rest"
      animate="rest"
      onMouseMove={onMouseMove}
    >
      {/* Subtle top gradient per accent */}
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: `linear-gradient(90deg, transparent, ${accent.text}40, transparent)` }} />

      <div className="relative z-10 flex flex-col gap-4 h-full">
        {/* Top row: Icon + Label + Stat */}
        <div className="flex items-start justify-between">
          <motion.div
            variants={bentoIconHover}
            className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: accent.bg, border: `1px solid ${accent.border}`, color: accent.text }}
          >
            {ICONS[feature.icon]}
          </motion.div>

          {feature.stat && (
            <div className="px-2.5 py-1 rounded-lg"
                 style={{ background: accent.bg, border: `1px solid ${accent.border}` }}>
              <span className="label-mono text-[0.6rem]" style={{ color: accent.text }}>
                {feature.stat}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col gap-2 flex-1">
          <p className="label-mono text-[0.62rem]" style={{ color: "var(--text-muted)" }}>
            {feature.label}
          </p>
          <h3
            className="font-semibold leading-tight"
            style={{
              fontFamily: "'Syne',sans-serif",
              fontSize: isLarge ? "1.3rem" : "1.05rem",
              color: "#E8EDF5",
            }}
          >
            {feature.title}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}
          >
            {feature.description}
          </p>
        </div>

        {/* Bottom: "Explore" link */}
        <motion.a
          href="#"
          className="flex items-center gap-1.5 text-xs font-medium mt-auto self-start"
          style={{ color: accent.text, fontFamily: "'DM Sans',sans-serif" }}
          whileHover={{ gap: "8px" }}
          transition={{ duration: 0.2 }}
        >
          <span>Explore module</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </motion.a>
      </div>
    </motion.div>
  );
}

// ── FeatureGrid ───────────────────────────────────────────────────────────────
export default function FeatureGrid() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-24 px-6 lg:px-10 xl:px-16">
      {/* Section background glow */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,229,255,0.04) 0%, transparent 70%)" }} />

      <div className="max-w-screen-xl mx-auto">
        {/* Section header */}
        <motion.div
          className="flex flex-col items-center text-center mb-14"
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="label-mono mb-3" style={{ color: "var(--cyan-aeos)" }}>PLATFORM MODULES</p>
          <h2 className="display-section text-white mb-4">
            Everything an Enterprise
            <br />
            <span className="text-gradient-cyan">Actually Needs</span>
          </h2>
          <p className="text-base max-w-2xl" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}>
            Each module ships as an isolated service with shared auth context, configurable per tenant, deployable independently.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Row 1: Large + Medium */}
          <BentoCard feature={FEATURES[0]} />  {/* Large: md:col-span-2 */}
          <BentoCard feature={FEATURES[1]} />  {/* Medium */}

          {/* Row 2: Medium + 3 Small */}
          <BentoCard feature={FEATURES[2]} />
          <BentoCard feature={FEATURES[3]} />
          <BentoCard feature={FEATURES[4]} />
          <BentoCard feature={FEATURES[5]} />
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="flex justify-center mt-10"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <a
            href="/modules"
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <span>View all 38 modules</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
