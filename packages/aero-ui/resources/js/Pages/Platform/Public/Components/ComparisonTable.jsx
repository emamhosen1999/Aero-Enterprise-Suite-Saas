import { useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { usePublicTheme } from "../utils/publicTheme.jsx";
import { fadeUp, staggerContainer } from "../utils/motionVariants.js";
import { COMPARISON_CATEGORIES } from "../utils/pageData.js";

const PLAN_HEADERS = ["Starter", "Professional", "Business", "Enterprise"];
const PROFESSIONAL_IDX = 1;

// ─── Value Cell ────────────────────────────────────────────────────────────────
function ValueCell({ value, isDark, isHighlighted }) {
  if (value === true) {
    return (
      <td
        className="text-center py-3 px-3"
        style={{
          background: isHighlighted
            ? isDark
              ? "rgba(99,102,241,0.07)"
              : "rgba(99,102,241,0.04)"
            : "transparent",
        }}
      >
        <svg
          className="w-5 h-5 inline-block"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="#22C55E"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </td>
    );
  }

  if (value === false) {
    return (
      <td
        className="text-center py-3 px-3"
        style={{
          background: isHighlighted
            ? isDark
              ? "rgba(99,102,241,0.07)"
              : "rgba(99,102,241,0.04)"
            : "transparent",
          color: isDark ? "rgba(255,255,255,0.22)" : "#CBD5E1",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        —
      </td>
    );
  }

  return (
    <td
      className="text-center py-3 px-3 text-sm"
      style={{
        background: isHighlighted
          ? isDark
            ? "rgba(99,102,241,0.07)"
            : "rgba(99,102,241,0.04)"
          : "transparent",
        color: isDark ? "rgba(255,255,255,0.7)" : "#334155",
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {value}
    </td>
  );
}

// ─── Category Section ──────────────────────────────────────────────────────────
function CategorySection({ category, isDark, isExpanded, onToggle, index }) {
  return (
    <>
      {/* Category header row */}
      <tr
        onClick={onToggle}
        className="cursor-pointer select-none"
        style={{
          background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
        }}
      >
        <td
          colSpan={5}
          className="py-3 px-4 text-sm font-semibold"
          style={{
            color: isDark ? "rgba(255,255,255,0.75)" : "#334155",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          <div className="flex items-center justify-between">
            <span>{category.name}</span>
            <motion.svg
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke={isDark ? "rgba(255,255,255,0.4)" : "#94A3B8"}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </motion.svg>
          </div>
        </td>
      </tr>

      {/* Feature rows */}
      <AnimatePresence initial={false}>
        {isExpanded &&
          category.rows.map((row, rowIdx) => {
            const isEven = rowIdx % 2 === 0;
            const rowBg = isEven
              ? "transparent"
              : isDark
              ? "rgba(255,255,255,0.015)"
              : "rgba(0,0,0,0.015)";

            return (
              <motion.tr
                key={row.feature}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15, delay: rowIdx * 0.03 }}
                style={{ background: rowBg }}
              >
                <td
                  className="py-3 px-4 text-sm"
                  style={{
                    color: isDark ? "rgba(255,255,255,0.6)" : "#475569",
                    fontFamily: "'DM Sans', sans-serif",
                    minWidth: "180px",
                  }}
                >
                  {row.feature}
                </td>
                <ValueCell value={row.starter} isDark={isDark} isHighlighted={false} />
                <ValueCell value={row.professional} isDark={isDark} isHighlighted={true} />
                <ValueCell value={row.business} isDark={isDark} isHighlighted={false} />
                <ValueCell value={row.enterprise} isDark={isDark} isHighlighted={false} />
              </motion.tr>
            );
          })}
      </AnimatePresence>
    </>
  );
}

// ─── ComparisonTable ───────────────────────────────────────────────────────────
export default function ComparisonTable() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const { isDark } = usePublicTheme();

  // All categories expanded by default
  const [expandedCategories, setExpandedCategories] = useState(
    () => new Set(COMPARISON_CATEGORIES.map((_, i) => i))
  );

  const toggleCategory = (idx) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
  };

  return (
    <section ref={ref} className="py-20 px-6 lg:px-10 relative overflow-hidden">
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 100%, rgba(99,102,241,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-screen-xl mx-auto relative z-10">
        {/* Section heading */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeUp}
            custom={0}
            className="text-3xl sm:text-4xl font-extrabold mb-3"
            style={{
              color: isDark ? "#E8EDF5" : "#0F172A",
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Compare all features
          </motion.h2>
          <motion.p
            variants={fadeUp}
            custom={1}
            className="text-base"
            style={{
              color: isDark ? "rgba(255,255,255,0.45)" : "#64748B",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            See exactly what's included in each plan
          </motion.p>
        </motion.div>

        {/* Table wrapper — horizontally scrollable on mobile */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          custom={2}
          className="overflow-x-auto rounded-2xl"
          style={{
            border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
          }}
        >
          <table
            className="w-full border-collapse"
            style={{ minWidth: "640px" }}
          >
            {/* Sticky header */}
            <thead>
              <tr
                style={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                  borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                }}
              >
                <th
                  className="py-4 px-4 text-left text-sm font-semibold"
                  style={{
                    color: isDark ? "rgba(255,255,255,0.45)" : "#94A3B8",
                    fontFamily: "'DM Sans', sans-serif",
                    minWidth: "180px",
                  }}
                >
                  Features
                </th>
                {PLAN_HEADERS.map((name, i) => (
                  <th
                    key={name}
                    className="py-4 px-3 text-center text-sm font-bold"
                    style={{
                      color:
                        i === PROFESSIONAL_IDX
                          ? "var(--indigo-aeos, #6366F1)"
                          : isDark
                          ? "#E8EDF5"
                          : "#0F172A",
                      fontFamily: "'Syne', sans-serif",
                      background:
                        i === PROFESSIONAL_IDX
                          ? isDark
                            ? "rgba(99,102,241,0.1)"
                            : "rgba(99,102,241,0.06)"
                          : "transparent",
                      minWidth: "110px",
                    }}
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {COMPARISON_CATEGORIES.map((category, idx) => (
                <CategorySection
                  key={category.name}
                  category={category}
                  isDark={isDark}
                  isExpanded={expandedCategories.has(idx)}
                  onToggle={() => toggleCategory(idx)}
                  index={idx}
                />
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
