import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { usePublicTheme } from "../utils/publicTheme.jsx";
import { fadeUp, staggerContainer } from "../utils/motionVariants.js";

export default function PricingHero({ isAnnual, setIsAnnual }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { isDark } = usePublicTheme();

  return (
    <section
      ref={ref}
      className="relative py-24 px-6 text-center overflow-hidden"
    >
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(0,229,255,0.09) 0%, transparent 70%)",
        }}
      />
      {/* Secondary indigo glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 80% 60%, rgba(99,102,241,0.05) 0%, transparent 60%)",
        }}
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        className="relative z-10 max-w-3xl mx-auto flex flex-col items-center gap-6"
      >
        {/* Badge */}
        <motion.div variants={fadeUp} custom={0}>
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
            style={{
              background: isDark
                ? "rgba(0,229,255,0.08)"
                : "rgba(0,229,255,0.1)",
              border: "1px solid rgba(0,229,255,0.25)",
              color: "var(--cyan-aeos)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "var(--cyan-aeos)" }}
            />
            Transparent Pricing
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={fadeUp}
          custom={1}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight"
          style={{
            color: isDark ? "#E8EDF5" : "#0F172A",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          Simple pricing{" "}
          <span className="text-gradient-cyan">for every scale</span>
        </motion.h1>

        {/* Subtext */}
        <motion.p
          variants={fadeUp}
          custom={2}
          className="text-base sm:text-lg leading-relaxed max-w-xl"
          style={{
            color: isDark ? "rgba(255,255,255,0.55)" : "#64748B",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Start free. Scale as you grow. No hidden fees. Cancel anytime.
        </motion.p>

        {/* Billing Toggle */}
        <motion.div
          variants={fadeUp}
          custom={3}
          className="flex items-center gap-3 mt-2"
        >
          <button
            onClick={() => setIsAnnual(false)}
            className="text-sm font-medium transition-colors"
            style={{
              color: !isAnnual
                ? isDark
                  ? "#E8EDF5"
                  : "#0F172A"
                : isDark
                ? "rgba(255,255,255,0.4)"
                : "#94A3B8",
              fontFamily: "'DM Sans', sans-serif",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0",
            }}
          >
            Monthly
          </button>

          {/* Pill Toggle */}
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-12 h-6 rounded-full transition-all duration-300 focus-aeos"
            style={{
              background: isAnnual
                ? "var(--indigo-aeos, #6366F1)"
                : isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.12)",
              border: "none",
              cursor: "pointer",
              padding: "0",
            }}
            aria-label="Toggle billing period"
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="absolute top-0.5 w-5 h-5 rounded-full"
              style={{
                background: "#FFFFFF",
                left: isAnnual ? "calc(100% - 1.375rem)" : "0.125rem",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }}
            />
          </button>

          <button
            onClick={() => setIsAnnual(true)}
            className="flex items-center gap-2 text-sm font-medium transition-colors"
            style={{
              color: isAnnual
                ? isDark
                  ? "#E8EDF5"
                  : "#0F172A"
                : isDark
                ? "rgba(255,255,255,0.4)"
                : "#94A3B8",
              fontFamily: "'DM Sans', sans-serif",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "0",
            }}
          >
            Annual
            {isAnnual && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                style={{
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  color: "#22C55E",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Save up to 20%
              </motion.span>
            )}
          </button>
        </motion.div>

        {/* Stats strip */}
        <motion.div
          variants={fadeUp}
          custom={4}
          className="flex items-center gap-2 text-sm flex-wrap justify-center"
          style={{
            color: isDark ? "rgba(255,255,255,0.38)" : "#94A3B8",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {["14-day free trial", "No credit card required", "Cancel anytime"].map(
            (item, i) => (
              <span key={item} className="flex items-center gap-2">
                {i > 0 && (
                  <span
                    style={{
                      color: isDark ? "rgba(255,255,255,0.18)" : "#CBD5E1",
                    }}
                  >
                    ·
                  </span>
                )}
                {item}
              </span>
            )
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}
