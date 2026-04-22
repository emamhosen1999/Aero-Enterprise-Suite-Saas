import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { usePublicTheme } from "../utils/publicTheme.jsx";
import { fadeUp, staggerContainer } from "../utils/motionVariants.js";
import { PRICING_FAQ } from "../utils/pageData.js";

// ─── FAQ Item ──────────────────────────────────────────────────────────────────
function FAQItem({ item, isOpen, onToggle, isDark, index }) {
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      className="border-b"
      style={{
        borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-5 text-left gap-4 focus-aeos"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "1.25rem 0",
        }}
      >
        <span
          className="text-base font-semibold leading-snug"
          style={{
            color: isDark ? "#E8EDF5" : "#0F172A",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {item.q}
        </span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.22, ease: "easeInOut" }}
          className="w-5 h-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke={isOpen ? "var(--cyan-aeos)" : isDark ? "rgba(255,255,255,0.35)" : "#94A3B8"}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <p
              className="pb-5 text-sm leading-relaxed"
              style={{
                color: isDark ? "rgba(255,255,255,0.55)" : "#64748B",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {item.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── PricingFAQ ────────────────────────────────────────────────────────────────
export default function PricingFAQ() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { isDark } = usePublicTheme();
  const [openIdx, setOpenIdx] = useState(0);

  const toggle = (idx) => setOpenIdx((prev) => (prev === idx ? null : idx));

  return (
    <section ref={ref} className="py-20 px-6 lg:px-10 relative overflow-hidden">
      {/* Subtle background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,229,255,0.03) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-3xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <motion.p
            variants={fadeUp}
            custom={0}
            className="label-mono mb-4"
            style={{ color: "var(--cyan-aeos)" }}
          >
            FAQ
          </motion.p>
          <motion.h2
            variants={fadeUp}
            custom={1}
            className="text-3xl sm:text-4xl font-extrabold"
            style={{
              color: isDark ? "#E8EDF5" : "#0F172A",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Frequently asked questions
          </motion.h2>
        </motion.div>

        {/* Accordion */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {PRICING_FAQ.map((item, i) => (
            <FAQItem
              key={item.q}
              item={item}
              isOpen={openIdx === i}
              onToggle={() => toggle(i)}
              isDark={isDark}
              index={i}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
