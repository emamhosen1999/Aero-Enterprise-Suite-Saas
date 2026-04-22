import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { usePublicTheme } from "../utils/publicTheme.jsx";
import { fadeUp, staggerContainer } from "../utils/motionVariants.js";

export default function PricingCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { isDark } = usePublicTheme();

  return (
    <section ref={ref} className="relative py-24 px-6 text-center overflow-hidden">
      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,229,255,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Secondary indigo glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 50% at 20% 70%, rgba(99,102,241,0.05) 0%, transparent 60%)",
        }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 bg-grid pointer-events-none"
        style={{ opacity: isDark ? 0.2 : 0.04 }}
      />

      <div className="max-w-screen-md mx-auto relative z-10">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="flex flex-col items-center gap-6"
        >
          {/* Label */}
          <motion.p
            variants={fadeUp}
            custom={0}
            className="label-mono"
            style={{ color: "var(--cyan-aeos)" }}
          >
            GET STARTED
          </motion.p>

          {/* Heading */}
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight"
            style={{
              color: isDark ? "#E8EDF5" : "#0F172A",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Ready to scale your{" "}
            <span className="text-gradient-cyan">operations?</span>
          </motion.h2>

          {/* Subtext */}
          <motion.p
            variants={fadeUp}
            custom={2}
            className="text-base sm:text-lg leading-relaxed max-w-lg"
            style={{
              color: isDark ? "rgba(255,255,255,0.5)" : "#64748B",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Join 320+ enterprises already running on aeos365. Get started in minutes.
          </motion.p>

          {/* Buttons */}
          <motion.div
            variants={fadeUp}
            custom={3}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <motion.a
              href="/signup"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary px-8 py-3 rounded-xl text-sm font-semibold inline-block"
              style={{ textDecoration: "none" }}
            >
              Start Free Trial
            </motion.a>
            <motion.a
              href="#"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3 rounded-xl text-sm font-semibold inline-block transition-all"
              style={{
                background: "transparent",
                border: `1px solid ${isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)"}`,
                color: isDark ? "rgba(255,255,255,0.75)" : "#334155",
                fontFamily: "'DM Sans', sans-serif",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,229,255,0.45)";
                e.currentTarget.style.color = isDark ? "#E8EDF5" : "#0F172A";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isDark
                  ? "rgba(255,255,255,0.18)"
                  : "rgba(0,0,0,0.18)";
                e.currentTarget.style.color = isDark
                  ? "rgba(255,255,255,0.75)"
                  : "#334155";
              }}
            >
              Talk to Sales
            </motion.a>
          </motion.div>

          {/* Trust note */}
          <motion.p
            variants={fadeUp}
            custom={4}
            className="text-sm"
            style={{
              color: isDark ? "rgba(255,255,255,0.3)" : "#94A3B8",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            14-day free trial · No credit card required · Cancel anytime
          </motion.p>
        </motion.div>
      </div>

      {/* Decorative corner accents */}
      <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none">
        <div
          className="absolute top-6 left-6 w-px h-16"
          style={{
            background: "linear-gradient(to bottom, var(--cyan-aeos), transparent)",
          }}
        />
        <div
          className="absolute top-6 left-6 w-16 h-px"
          style={{
            background: "linear-gradient(to right, var(--cyan-aeos), transparent)",
          }}
        />
      </div>
      <div className="absolute bottom-0 right-0 w-32 h-32 pointer-events-none">
        <div
          className="absolute bottom-6 right-6 w-px h-16"
          style={{
            background: "linear-gradient(to top, var(--indigo-aeos), transparent)",
          }}
        />
        <div
          className="absolute bottom-6 right-6 w-16 h-px"
          style={{
            background: "linear-gradient(to left, var(--indigo-aeos), transparent)",
          }}
        />
      </div>
    </section>
  );
}
