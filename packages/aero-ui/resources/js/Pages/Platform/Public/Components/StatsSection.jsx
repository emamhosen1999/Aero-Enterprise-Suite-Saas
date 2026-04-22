import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { STATS } from "../utils/pageData";
import { statsContainer, statItem } from "../utils/motionVariants";
import { useCountUp } from "../utils/hooks";
import { usePublicTheme } from "../utils/publicTheme.jsx";

// ─── Single stat counter ──────────────────────────────────────────────────────
function StatCounter({ stat, inView }) {
  const decimals = stat.value % 1 !== 0 ? 2 : 0;
  const count = useCountUp(stat.value, inView, 2200, decimals);
  const { isDark } = usePublicTheme();

  return (
    <motion.div
      variants={statItem}
      className="flex flex-col items-center text-center gap-3 p-8 relative"
    >
      {/* Vertical separator (except last) */}
      <div className="absolute right-0 top-6 bottom-6 w-px hidden lg:block"
           style={{ background: "linear-gradient(to bottom, transparent, rgba(0,229,255,0.15), transparent)" }} />

      {/* Number */}
      <div className="flex items-start">
        {stat.prefix && (
          <span className="text-2xl font-mono font-semibold mt-2 mr-1"
                style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontFamily: "'JetBrains Mono',monospace" }}>
            {stat.prefix}
          </span>
        )}
        <span className="stat-number">
          {decimals > 0 ? count.toFixed(decimals) : count.toLocaleString()}
        </span>
        <span className="text-2xl font-mono font-semibold mt-2 ml-0.5"
              style={{ color: "var(--cyan-aeos)", fontFamily: "'JetBrains Mono',monospace" }}>
          {stat.suffix}
        </span>
      </div>

      {/* Label */}
      <p className="text-sm font-medium"
         style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
        {stat.label}
      </p>
    </motion.div>
  );
}

// ─── StatsSection ─────────────────────────────────────────────────────────────
export default function StatsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { isDark } = usePublicTheme();

  return (
    <section ref={ref} className="relative py-20 px-6 lg:px-10 xl:px-16 overflow-hidden">

      {/* ── Background Panel ── */}
      <div className="absolute inset-x-6 lg:inset-x-16 inset-y-6 rounded-3xl"
           style={{
             background: isDark ? "rgba(13,17,32,0.6)" : "#F1F5F9",
             border: "1px solid rgba(0,229,255,0.08)",
             boxShadow: "0 0 80px rgba(0,229,255,0.04)",
           }} />

      {/* Glowing top edge */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-2/3 h-px"
           style={{ background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.4), transparent)" }} />

      <div className="relative z-10 max-w-screen-xl mx-auto">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="label-mono mb-3" style={{ color: "var(--cyan-aeos)" }}>
            BY THE NUMBERS
          </p>
          <h2 className="display-section" style={{ color: isDark ? undefined : "#0F172A" }}>
            Platform <span className="text-gradient-amber">at Scale</span>
          </h2>
        </motion.div>

        {/* Stats grid */}
        <motion.div
          variants={statsContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-4 divide-x-0 lg:divide-x"
          style={{ "--tw-divide-opacity": 0 }}
        >
          {STATS.map((stat) => (
            <StatCounter key={stat.label} stat={stat} inView={inView} />
          ))}
        </motion.div>

        {/* Subtext */}
        <motion.p
          className="text-center text-sm mt-6"
          style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#64748B", fontFamily: "'DM Sans',sans-serif" }}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          Metrics updated in real-time across all active tenants. SLA guaranteed per enterprise contract.
        </motion.p>
      </div>
    </section>
  );
}
