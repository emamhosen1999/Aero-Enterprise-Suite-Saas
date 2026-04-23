import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useMouseParallax } from "../utils/hooks";
import { usePublicTheme } from "../utils/publicTheme.jsx";
import {
  heroContainer, heroLabel, heroTitle, heroSubtitle,
  heroButtons, heroMockup, parallaxConfigs,
} from "../utils/motionVariants";

// ─── Platform Mockup Window ───────────────────────────────────────────────────
function PlatformMockup({ isDark }) {
  return (
    <div className="mockup-window w-full">
      {/* Title bar */}
      <div className="mockup-titlebar">
        <div className="mockup-dot" style={{ background: "#FF5F57" }} />
        <div className="mockup-dot" style={{ background: "#FEBC2E" }} />
        <div className="mockup-dot" style={{ background: "#28C840" }} />
        <div className="flex-1 mx-4">
          <div className="h-5 rounded-md px-3 flex items-center justify-center"
               style={{ background: "rgba(0,229,255,0.06)", border: "1px solid rgba(0,229,255,0.12)" }}>
            <span className="label-mono text-[0.6rem]" style={{ color: "var(--text-muted)" }}>
              demo.aeos365.com/dashboard
            </span>
          </div>
        </div>
      </div>

      {/* App content simulation */}
      <div className="p-4" style={{ background: isDark ? "rgba(7,11,20,0.98)" : "#FFFFFF", minHeight: "340px" }}>

        {/* Sidebar + Main layout */}
        <div className="flex gap-3 h-full">

          {/* Sidebar */}
          <div className="w-40 shrink-0 flex flex-col gap-2">
            {["Dashboard", "Employees", "Payroll", "Analytics", "Settings"].map((item, i) => (
              <div
                key={item}
                className="px-3 py-2 rounded-lg flex items-center gap-2"
                style={{
                  background: i === 0 ? "rgba(0,229,255,0.12)" : "transparent",
                  border: i === 0 ? "1px solid rgba(0,229,255,0.2)" : "1px solid transparent",
                }}
              >
                <div className="w-2.5 h-2.5 rounded-sm"
                     style={{ background: i === 0 ? "var(--cyan-aeos)" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" }} />
                <span className="text-[0.65rem] font-medium"
                      style={{ color: i === 0 ? "var(--cyan-aeos)" : "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col gap-3">

            {/* KPI Row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Active Staff",  value: "1,247", delta: "+12", color: "var(--cyan-aeos)" },
                { label: "Payroll Due",   value: "$284K",  delta: "7d",  color: "var(--amber-aeos)" },
                { label: "Open Tickets",  value: "38",     delta: "-4",  color: "#6366F1" },
              ].map(({ label, value, delta, color }) => (
                <div key={label} className="p-2.5 rounded-lg"
                     style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.04)", border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}` }}>
                  <p className="text-[0.58rem] mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
                  <p className="text-sm font-bold" style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>{value}</p>
                  <p className="text-[0.56rem] mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)" }}>{delta}</p>
                </div>
              ))}
            </div>

            {/* Chart area */}
            <div className="rounded-lg p-3 flex-1 relative overflow-hidden"
                 style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}` }}>
              <p className="text-[0.6rem] mb-2" style={{ color: "var(--text-muted)" }}>Headcount Trend — 12M</p>
              <svg viewBox="0 0 280 80" className="w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#00E5FF" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,60 C20,55 40,50 60,45 C80,40 100,38 120,32 C140,26 160,28 180,22 C200,16 220,18 240,14 C260,10 270,12 280,10 L280,80 L0,80Z"
                      fill="url(#chartGrad)" />
                <path d="M0,60 C20,55 40,50 60,45 C80,40 100,38 120,32 C140,26 160,28 180,22 C200,16 220,18 240,14 C260,10 270,12 280,10"
                      fill="none" stroke="#00E5FF" strokeWidth="1.5" />
                {/* Data points */}
                {[[60,45],[120,32],[180,22],[240,14],[280,10]].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="2.5" fill={isDark ? "#03040A" : "#F8FAFC"} stroke="#00E5FF" strokeWidth="1.5" />
                ))}
              </svg>
            </div>

            {/* Recent activity */}
            <div className="rounded-lg p-2.5"
                 style={{ background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.03)", border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}` }}>
              <p className="text-[0.6rem] mb-2" style={{ color: "var(--text-muted)" }}>Recent Activity</p>
              {[
                { event: "Payroll batch #0412 queued", time: "2m ago", color: "var(--amber-aeos)" },
                { event: "3 new employees onboarded", time: "18m ago", color: "var(--cyan-aeos)" },
                { event: "Leave policy updated", time: "1h ago", color: "#6366F1" },
              ].map(({ event, time, color }) => (
                <div key={event} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                    <span className="text-[0.6rem]" style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)", fontFamily: "'DM Sans',sans-serif" }}>{event}</span>
                  </div>
                  <span className="text-[0.56rem]" style={{ color: "var(--text-muted)" }}>{time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── HeroSection ──────────────────────────────────────────────────────────────
export default function HeroSection() {
  const containerRef = useRef(null);
  const { isDark } = usePublicTheme();
  const { mouseX, mouseY } = useMouseParallax(60, 18);

  // Scroll-linked transforms
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });

  const textY    = useTransform(scrollYProgress, parallaxConfigs.heroTextY.inputRange, parallaxConfigs.heroTextY.outputRange);
  const textOp   = useTransform(scrollYProgress, parallaxConfigs.heroTextOpacity.inputRange, parallaxConfigs.heroTextOpacity.outputRange);
  const mockupY  = useTransform(scrollYProgress, parallaxConfigs.heroMockupScroll.inputRange, parallaxConfigs.heroMockupScroll.outputRange);

  // Mouse parallax layers
  const bgX  = useTransform(mouseX, [0, 1], ["-3%",  "3%"]);
  const bgY  = useTransform(mouseY, [0, 1], ["-2%",  "2%"]);
  const m1X  = useTransform(mouseX, [0, 1], ["-12px", "12px"]);
  const m1Y  = useTransform(mouseY, [0, 1], ["-8px",  "8px"]);
  const m2X  = useTransform(mouseX, [0, 1], ["6px", "-6px"]);
  const m2Y  = useTransform(mouseY, [0, 1], ["4px", "-4px"]);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16"
    >
      {/* ── Background Layers (Parallax) ── */}

      {/* Grid texture */}
      <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" />

      {/* Gradient mesh — moves with mouse */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ x: bgX, y: bgY }}
      >
        <div className="absolute inset-0"
             style={{
               background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,229,255,0.12) 0%, transparent 65%)",
             }} />
        <div className="absolute inset-0"
             style={{
               background: "radial-gradient(ellipse 50% 50% at 85% 55%, rgba(255,179,71,0.08) 0%, transparent 55%)",
             }} />
        <div className="absolute inset-0"
             style={{
               background: "radial-gradient(ellipse 40% 50% at 10% 70%, rgba(99,102,241,0.08) 0%, transparent 55%)",
             }} />
      </motion.div>

      {/* Floating orbs (secondary parallax layer — moves opposite) */}
      <motion.div
        className="absolute pointer-events-none"
        style={{ x: m1X, y: m1Y, top: "15%", right: "8%", width: 320, height: 320 }}
      >
        <div className="w-full h-full rounded-full"
             style={{
               background: "radial-gradient(circle, rgba(0,229,255,0.07) 0%, transparent 70%)",
               filter: "blur(40px)",
             }} />
      </motion.div>
      <motion.div
        className="absolute pointer-events-none"
        style={{ x: m2X, y: m2Y, bottom: "20%", left: "5%", width: 240, height: 240 }}
      >
        <div className="w-full h-full rounded-full"
             style={{
               background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
               filter: "blur(50px)",
             }} />
      </motion.div>

      {/* Horizontal accent line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-24"
           style={{ background: "linear-gradient(to bottom, transparent, rgba(0,229,255,0.5), transparent)" }} />

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: Text block */}
          <motion.div
            style={{ y: textY, opacity: textOp }}
            className="flex flex-col items-start"
          >
            <motion.div
              variants={heroContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-6"
            >
              {/* Label */}
              <motion.div variants={heroLabel} className="flex items-center gap-2">
                <div className="px-3 py-1 rounded-full flex items-center gap-2"
                     style={{ background: "rgba(0,229,255,0.08)", border: "1px solid rgba(0,229,255,0.2)" }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--cyan-aeos)" }} />
                  <span className="label-mono text-[0.65rem]" style={{ color: "var(--cyan-aeos)" }}>
                    MODULAR ENTERPRISE PLATFORM
                  </span>
                </div>
                <div className="h-px flex-1 max-w-16"
                     style={{ background: "linear-gradient(to right, rgba(0,229,255,0.4), transparent)" }} />
              </motion.div>

              {/* Headline */}
              <motion.h1 variants={heroTitle} className="display-hero text-white">
                Enterprise{" "}
                <span className="text-gradient-cyan">Software</span>
                <br />
                That{" "}
                <span className="relative inline-block">
                  Scales With You
                  <motion.span
                    className="absolute -bottom-1 left-0 h-[2px] rounded-full"
                    style={{ background: "linear-gradient(90deg, var(--cyan-aeos), #6366F1)" }}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ delay: 1.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </span>
              </motion.h1>

              {/* Subtext */}
              <motion.p
                variants={heroSubtitle}
                className="text-lg leading-relaxed max-w-lg"
                style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#64748B", fontFamily: "'DM Sans',sans-serif" }}
              >
                AEOS unifies HR, Payroll, Analytics, and Operations into one coherent, multi-tenant platform. Built for enterprises that demand isolation, speed, and extensibility.
              </motion.p>

              {/* Buttons */}
              <motion.div variants={heroButtons} className="flex flex-wrap items-center gap-3 mt-2">
                <motion.a
                  href="https://demo.aeos365.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                  </svg>
                  <span>See Live Demo</span>
                </motion.a>
                <motion.a
                  component="Link"
                  href="/docs"
                  className="btn-ghost flex items-center gap-2"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                  </svg>
                  <span>Explore Docs</span>
                </motion.a>
              </motion.div>

              {/* Trust micro-bar */}
              <motion.div
                variants={heroButtons}
                className="flex items-center gap-4 pt-2"
              >
                <div className="flex -space-x-2">
                  {["SC","RH","JO","PN"].map((initials, i) => (
                    <div key={i}
                         className="w-8 h-8 rounded-full flex items-center justify-center text-[0.6rem] font-bold border-2 border-obsidian-900"
                         style={{
                           background: ["#00E5FF22","#FFB34722","#6366F122","#00E5FF22"][i],
                           borderColor: "#070B14",
                           color: ["var(--cyan-aeos)","var(--amber-aeos)","#6366F1","var(--cyan-aeos)"][i],
                           fontFamily: "'DM Sans',sans-serif",
                           zIndex: 4 - i,
                         }}>
                      {initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-3 h-3" style={{ color: "var(--amber-aeos)" }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#64748B" }}>
                    Trusted by <strong style={{ color: isDark ? "#ffffff" : "#0F172A" }}>250+</strong> enterprise teams
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right: Platform Mockup */}
          <motion.div
            variants={heroMockup}
            initial="hidden"
            animate="visible"
            style={{ y: mockupY }}
            className="relative"
          >
            {/* Glow behind mockup */}
            <div className="absolute -inset-8 rounded-3xl pointer-events-none"
                 style={{
                   background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,229,255,0.1) 0%, transparent 70%)",
                   filter: "blur(20px)",
                 }} />

            {/* Floating badge: top-left */}
            <motion.div
              className="absolute -top-4 -left-4 z-20 px-3 py-2 rounded-xl flex items-center gap-2"
              style={{ background: isDark ? "rgba(7,11,20,0.95)" : "rgba(255,255,255,0.95)", border: "1px solid rgba(0,229,255,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: "#22C55E", boxShadow: "0 0 6px #22C55E" }} />
              <span className="text-xs font-medium" style={{ color: isDark ? "#ffffff" : "#0F172A", fontFamily: "'DM Sans',sans-serif" }}>Live Processing</span>
            </motion.div>

            {/* Floating badge: bottom-right */}
            <motion.div
              className="absolute -bottom-4 -right-4 z-20 px-3 py-2.5 rounded-xl"
              style={{ background: isDark ? "rgba(7,11,20,0.95)" : "rgba(255,255,255,0.95)", border: "1px solid rgba(255,179,71,0.2)", boxShadow: "0 8px 24px rgba(0,0,0,0.6)" }}
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <p className="text-[0.6rem] mb-0.5" style={{ color: isDark ? "rgba(255,255,255,0.45)" : "#64748B" }}>Payroll Engine</p>
              <p className="text-sm font-bold" style={{ color: "var(--amber-aeos)", fontFamily: "'JetBrains Mono',monospace" }}>
                $2.8M processed
              </p>
            </motion.div>

            {/* The mockup itself */}
            <div className="animate-float" style={{ animationDuration: "7s" }}>
              <PlatformMockup isDark={isDark} />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Scroll indicator ── */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.8 }}
      >
        <span className="label-mono text-[0.6rem]" style={{ color: "var(--text-muted)" }}>SCROLL</span>
        <motion.div
          className="w-[1px] h-8"
          style={{ background: "linear-gradient(to bottom, rgba(0,229,255,0.6), transparent)" }}
          animate={{ scaleY: [1, 0.5, 1], opacity: [0.8, 0.3, 0.8] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
