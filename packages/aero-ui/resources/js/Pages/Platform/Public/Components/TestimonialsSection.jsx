import { useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { TESTIMONIALS } from "../utils/pageData";
import { slideVariants, staggerContainer, scaleIn } from "../utils/motionVariants";
import { useTestimonialSlider } from "../utils/hooks";
import { usePublicTheme } from "../utils/publicTheme.jsx";

// ─── Star Rating ──────────────────────────────────────────────────────────────
function Stars({ count = 5 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(count)].map((_, i) => (
        <svg key={i} className="w-3.5 h-3.5" style={{ color: "var(--amber-aeos)" }} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ─── Featured Testimonial (large, center) ────────────────────────────────────
function FeaturedCard({ testimonial, direction, isDark }) {
  return (
    <motion.div
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className="w-full"
    >
      <div className="testimonial-card p-8 lg:p-10 relative">
        {/* Large quote mark */}
        <div className="absolute top-6 right-8 text-7xl font-bold leading-none select-none"
             style={{ color: "rgba(0,229,255,0.08)", fontFamily: "'Syne',sans-serif" }}>
          "
        </div>

        <div className="flex flex-col gap-6 relative z-10">
          <Stars count={testimonial.rating} />

          <blockquote
            className="text-xl lg:text-2xl font-medium leading-relaxed"
            style={{ color: isDark ? "#ffffff" : "#0F172A", fontFamily: "'DM Sans',sans-serif", fontStyle: "italic" }}
          >
            "{testimonial.quote}"
          </blockquote>

          <div className="flex items-center gap-4 pt-2 border-t"
               style={{ borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)" }}>
            {/* Avatar */}
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: `${testimonial.avatarColor}20`,
                border: `2px solid ${testimonial.avatarColor}40`,
                color: testimonial.avatarColor,
                fontFamily: "'Syne',sans-serif",
              }}
            >
              {testimonial.avatar}
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: isDark ? "#ffffff" : "#0F172A", fontFamily: "'DM Sans',sans-serif" }}>
                {testimonial.name}
              </p>
              <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#64748B", fontFamily: "'DM Sans',sans-serif" }}>
                {testimonial.role} · {testimonial.company}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── TestimonialsSection ──────────────────────────────────────────────────────
export default function TestimonialsSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const { isDark } = usePublicTheme();
  const { index, direction, goTo, next, prev } = useTestimonialSlider(TESTIMONIALS.length, 6000);

  return (
    <section ref={ref} className="relative py-24 px-6 lg:px-10 xl:px-16 overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: "radial-gradient(ellipse 70% 50% at 50% 80%, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />

      <div className="max-w-screen-xl mx-auto">
        {/* Header */}
        <motion.div
          className="flex flex-col items-center text-center mb-14"
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="label-mono mb-3" style={{ color: "var(--cyan-aeos)" }}>CLIENT STORIES</p>
          <h2 className="display-section mb-4" style={{ color: isDark ? undefined : "#0F172A" }}>
            Teams That Ship
            <br />
            <span className="text-gradient-cyan">Faster With AEOS</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: mini cards */}
          <motion.div
            className="hidden lg:flex flex-col gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {TESTIMONIALS.slice(0, 2).map((t, i) => (
              <motion.div
                key={t.id}
                variants={scaleIn}
                custom={i}
                className="testimonial-card p-5 cursor-pointer"
                onClick={() => goTo(i)}
                style={{ opacity: index === i ? 1 : 0.6 }}
              >
                <Stars count={t.rating} />
                <p className="mt-3 text-sm leading-relaxed"
                   style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontFamily: "'DM Sans',sans-serif", fontStyle: "italic" }}>
                  "{t.quote.substring(0, 90)}…"
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold"
                       style={{ background: `${t.avatarColor}20`, color: t.avatarColor }}>
                    {t.avatar}
                  </div>
                  <p className="text-xs font-medium" style={{ color: isDark ? "#ffffff" : "#0F172A", fontFamily: "'DM Sans',sans-serif" }}>
                    {t.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Center: featured slider */}
          <motion.div
            className="lg:col-span-1 relative"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <div className="relative overflow-hidden">
              <AnimatePresence custom={direction} mode="wait">
                <FeaturedCard
                  key={TESTIMONIALS[index].id}
                  testimonial={TESTIMONIALS[index]}
                  direction={direction}                  isDark={isDark}                />
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center gap-2">
                {TESTIMONIALS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === index ? "24px" : "8px",
                      height: "8px",
                      background: i === index ? "var(--cyan-aeos)" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)",
                    }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {[prev, next].map((fn, i) => (
                  <motion.button
                    key={i}
                    onClick={fn}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"}`, color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)" }}
                    whileHover={{ borderColor: "rgba(0,229,255,0.4)", color: "var(--cyan-aeos)" }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round"
                            d={i === 0 ? "M15.75 19.5L8.25 12l7.5-7.5" : "M8.25 4.5l7.5 7.5-7.5 7.5"} />
                    </svg>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right: mini cards */}
          <motion.div
            className="hidden lg:flex flex-col gap-4"
            variants={staggerContainer}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
          >
            {TESTIMONIALS.slice(2, 4).map((t, i) => (
              <motion.div
                key={t.id}
                variants={scaleIn}
                custom={i}
                className="testimonial-card p-5 cursor-pointer"
                onClick={() => goTo(i + 2)}
                style={{ opacity: index === i + 2 ? 1 : 0.6 }}
              >
                <Stars count={t.rating} />
                <p className="mt-3 text-sm leading-relaxed"
                   style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontFamily: "'DM Sans',sans-serif", fontStyle: "italic" }}>
                  "{t.quote.substring(0, 90)}…"
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[0.6rem] font-bold"
                       style={{ background: `${t.avatarColor}20`, color: t.avatarColor }}>
                    {t.avatar}
                  </div>
                  <p className="text-xs font-medium" style={{ color: isDark ? "#ffffff" : "#0F172A", fontFamily: "'DM Sans',sans-serif" }}>
                    {t.name}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
