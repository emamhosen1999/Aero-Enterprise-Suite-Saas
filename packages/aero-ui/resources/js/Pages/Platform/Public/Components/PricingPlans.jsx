import { useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { usePublicTheme } from "../utils/publicTheme.jsx";
import { fadeUp, staggerContainer, scaleIn } from "../utils/motionVariants.js";
import { PRICING_PLANS } from "../utils/pageData.js";

// ─── Checkmark Icon ────────────────────────────────────────────────────────────
function CheckIcon({ color }) {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2.5}
      stroke={color || "var(--cyan-aeos)"}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// ─── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ plan, isAnnual, isDark, index }) {
  const price = isAnnual ? plan.annualPrice : plan.monthlyPrice;
  const otherPrice = isAnnual ? plan.monthlyPrice : plan.annualPrice;
  const annualSavings =
    plan.monthlyPrice && plan.annualPrice && isAnnual
      ? Math.round((plan.monthlyPrice - plan.annualPrice) * 12)
      : null;

  const cardStyle = {
    background: plan.highlight
      ? isDark
        ? "rgba(99,102,241,0.1)"
        : "rgba(99,102,241,0.05)"
      : isDark
      ? "rgba(255,255,255,0.04)"
      : "#FFFFFF",
    border: plan.highlight
      ? `1px solid rgba(99,102,241,0.45)`
      : `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
    boxShadow: plan.highlight
      ? `0 0 0 1px rgba(99,102,241,0.2), 0 8px 32px rgba(99,102,241,0.15)`
      : isDark
      ? "none"
      : "0 1px 3px rgba(0,0,0,0.06)",
    borderRadius: "16px",
    transform: plan.highlight ? "scale(1.02)" : "scale(1)",
  };

  return (
    <motion.div
      variants={scaleIn}
      custom={index}
      className="relative flex flex-col p-6"
      style={cardStyle}
    >
      {/* Most Popular badge */}
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: "var(--indigo-aeos, #6366F1)",
              color: "#FFFFFF",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Most Popular
          </span>
        </div>
      )}

      {/* Plan badge (non-highlight) */}
      {plan.badge && !plan.highlight && (
        <div className="mb-3">
          <span
            className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
            style={{
              background: isDark
                ? `rgba(255,179,71,0.12)`
                : `rgba(255,179,71,0.15)`,
              border: "1px solid rgba(255,179,71,0.3)",
              color: "var(--amber-aeos, #FFB347)",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {plan.badge}
          </span>
        </div>
      )}

      {/* Plan name + tagline */}
      <div className={plan.highlight ? "mt-4" : ""}>
        <h3
          className="text-xl font-bold mb-1"
          style={{
            color: isDark ? "#E8EDF5" : "#0F172A",
            fontFamily: "'Syne', sans-serif",
          }}
        >
          {plan.name}
        </h3>
        <p
          className="text-sm"
          style={{
            color: isDark ? "rgba(255,255,255,0.45)" : "#64748B",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {plan.tagline}
        </p>
      </div>

      {/* Divider */}
      <div
        className="my-5 h-px"
        style={{
          background: isDark
            ? "rgba(255,255,255,0.07)"
            : "rgba(0,0,0,0.07)",
        }}
      />

      {/* Price */}
      <div className="mb-1 min-h-[3.5rem] flex flex-col justify-center">
        {price !== null ? (
          <>
            <div className="flex items-end gap-1">
              <span
                className="text-sm font-medium"
                style={{
                  color: isDark ? "rgba(255,255,255,0.45)" : "#94A3B8",
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: "2.5rem",
                }}
              >
                {plan.currency}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={isAnnual ? "annual" : "monthly"}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="text-4xl font-extrabold leading-none"
                  style={{
                    color: plan.highlight
                      ? "var(--indigo-aeos, #6366F1)"
                      : plan.accentColor,
                    fontFamily: "'Syne', sans-serif",
                  }}
                >
                  {price}
                </motion.span>
              </AnimatePresence>
              <span
                className="text-sm mb-0.5"
                style={{
                  color: isDark ? "rgba(255,255,255,0.35)" : "#94A3B8",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                /mo
              </span>
            </div>
            {isAnnual && (
              <p
                className="text-xs mt-1"
                style={{
                  color: isDark ? "rgba(255,255,255,0.35)" : "#94A3B8",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                billed annually
              </p>
            )}
          </>
        ) : (
          <span
            className="text-4xl font-extrabold"
            style={{
              color: plan.accentColor,
              fontFamily: "'Syne', sans-serif",
            }}
          >
            Custom
          </span>
        )}
      </div>

      {/* Annual savings */}
      {annualSavings && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4"
        >
          <span
            className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "#22C55E",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Save ${annualSavings}/yr
          </span>
        </motion.div>
      )}

      {/* CTA Button */}
      <motion.a
        href={plan.id === "enterprise" ? "#" : "/signup"}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="block w-full py-2.5 text-sm font-semibold text-center rounded-xl transition-all mb-5"
        style={
          plan.highlight
            ? {
                background: "var(--indigo-aeos, #6366F1)",
                color: "#FFFFFF",
                border: "none",
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                textDecoration: "none",
              }
            : {
                background: "transparent",
                color: plan.accentColor,
                border: `1px solid ${plan.accentColor}`,
                fontFamily: "'DM Sans', sans-serif",
                textDecoration: "none",
              }
        }
      >
        {plan.cta}
      </motion.a>

      {/* Divider */}
      <div
        className="mb-4 h-px"
        style={{
          background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)",
        }}
      />

      {/* Modules */}
      <div className="mb-4">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{
            color: isDark ? "rgba(255,255,255,0.35)" : "#94A3B8",
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          Includes:
        </p>
        <div className="flex flex-wrap gap-1.5">
          {plan.modules.map((mod) => (
            <span
              key={mod}
              className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{
                background: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
                color: isDark ? "rgba(255,255,255,0.65)" : "#475569",
                fontFamily: "'DM Sans', sans-serif",
                border: isDark
                  ? "1px solid rgba(255,255,255,0.08)"
                  : "1px solid rgba(0,0,0,0.07)",
              }}
            >
              {mod}
            </span>
          ))}
        </div>
      </div>

      {/* Perks */}
      <ul className="flex flex-col gap-2 mt-auto">
        {plan.perks.map((perk) => (
          <li key={perk} className="flex items-start gap-2">
            <CheckIcon color={plan.accentColor} />
            <span
              className="text-sm leading-snug"
              style={{
                color: isDark ? "rgba(255,255,255,0.6)" : "#475569",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {perk}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

// ─── PricingPlans ──────────────────────────────────────────────────────────────
export default function PricingPlans({ isAnnual }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { isDark } = usePublicTheme();

  return (
    <section ref={ref} className="py-8 px-6 lg:px-10">
      <div className="max-w-screen-xl mx-auto">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
        >
          {PRICING_PLANS.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isAnnual={isAnnual}
              isDark={isDark}
              index={i}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
