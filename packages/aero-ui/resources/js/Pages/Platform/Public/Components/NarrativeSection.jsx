import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { NARRATIVE_STEPS } from "../utils/pageData";

// ─── NarrativeSection ─────────────────────────────────────────────────────────
// Sticky scroll narrative: as user scrolls through the tall container,
// the text content transitions through steps while the left panel is sticky.
export default function NarrativeSection() {
  const containerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);

  // Track scroll within this section
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  });

  // Update active step based on scroll position
  useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (v) => {
      const step = Math.min(
        Math.floor(v * NARRATIVE_STEPS.length),
        NARRATIVE_STEPS.length - 1
      );
      setActiveStep(step);
    });
    return unsubscribe;
  }, [scrollYProgress]);

  return (
    <section
      ref={containerRef}
      className="relative py-24"
      style={{ minHeight: `${NARRATIVE_STEPS.length * 80}vh` }}
    >
      {/* Background accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px"
             style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
             style={{ background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)" }} />
        <div className="absolute inset-0 bg-grid opacity-20" />
      </div>

      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-10 xl:px-16 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Step Indicators + Progress */}
            <div className="flex flex-col gap-6">

              {/* Section label */}
              <div>
                <p className="label-mono mb-2" style={{ color: "var(--cyan-aeos)" }}>
                  THE ARCHITECTURE
                </p>
                <h2 className="display-section text-white">
                  How AEOS
                  <br />
                  <span className="text-gradient-full">Works</span>
                </h2>
              </div>

              {/* Step list */}
              <div className="flex flex-col gap-3 mt-4">
                {NARRATIVE_STEPS.map((step, i) => (
                  <motion.div
                    key={step.tag}
                    className="flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300"
                    animate={{
                      background: i === activeStep
                        ? "rgba(0,229,255,0.06)"
                        : "transparent",
                      borderColor: i === activeStep
                        ? "rgba(0,229,255,0.2)"
                        : "rgba(255,255,255,0.04)",
                    }}
                    style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    {/* Step number */}
                    <motion.div
                      className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
                      animate={{
                        background: i === activeStep
                          ? "linear-gradient(135deg, #00E5FF, #6366F1)"
                          : "rgba(255,255,255,0.06)",
                        color: i === activeStep ? "#03040A" : "rgba(255,255,255,0.3)",
                      }}
                      transition={{ duration: 0.3 }}
                      style={{ fontFamily: "'JetBrains Mono',monospace" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </motion.div>

                    {/* Step tag */}
                    <motion.span
                      className="label-mono text-[0.65rem]"
                      animate={{
                        color: i === activeStep ? "var(--cyan-aeos)" : "var(--text-muted)",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      {step.tag}
                    </motion.span>
                  </motion.div>
                ))}
              </div>

              {/* Scroll progress bar */}
              <div className="h-1 rounded-full overflow-hidden mt-2"
                   style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #00E5FF, #6366F1)",
                    scaleX: scrollYProgress,
                    transformOrigin: "left",
                  }}
                />
              </div>
            </div>

            {/* Right: Active content panel */}
            <div className="relative min-h-[340px] flex items-center">
              {NARRATIVE_STEPS.map((step, i) => (
                <motion.div
                  key={step.tag}
                  className="absolute inset-0 flex flex-col justify-center"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{
                    opacity: i === activeStep ? 1 : 0,
                    x: i === activeStep ? 0 : i < activeStep ? -40 : 40,
                    pointerEvents: i === activeStep ? "auto" : "none",
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* Decorative vertical line */}
                  <div className="absolute left-0 top-4 bottom-4 w-px"
                       style={{ background: "linear-gradient(to bottom, transparent, rgba(0,229,255,0.4), transparent)" }} />

                  <div className="pl-8 flex flex-col gap-6">
                    {/* Tag */}
                    <p className="label-mono text-[0.65rem]" style={{ color: "var(--cyan-aeos)" }}>
                      {step.tag}
                    </p>

                    {/* Title */}
                    <div>
                      <h3 className="text-white text-3xl font-bold leading-tight"
                          style={{ fontFamily: "'Syne',sans-serif" }}>
                        {step.title}
                      </h3>
                      <h3 className="text-3xl font-bold leading-tight text-gradient-cyan"
                          style={{ fontFamily: "'Syne',sans-serif" }}>
                        {step.highlight}
                      </h3>
                    </div>

                    {/* Body */}
                    <p className="text-base leading-relaxed max-w-lg"
                       style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}>
                      {step.body}
                    </p>

                    {/* Micro diagram (visual accent) */}
                    <div className="p-4 rounded-xl"
                         style={{ background: "rgba(0,229,255,0.04)", border: "1px solid rgba(0,229,255,0.1)" }}>
                      <NarrativeDiagram step={i} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Micro Architecture Diagram per step ──────────────────────────────────────
function NarrativeDiagram({ step }) {
  const diagrams = [
    // Step 0: Module blocks
    <div key={0} className="flex items-center gap-2 flex-wrap">
      {["HRM", "PAY", "INV", "CRM", "ANA", "WFL"].map((mod, i) => (
        <motion.div
          key={mod}
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{
            background: "rgba(0,229,255,0.1)",
            border: "1px solid rgba(0,229,255,0.2)",
            color: "var(--cyan-aeos)",
            fontFamily: "'JetBrains Mono',monospace",
          }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 200 }}
        >
          {mod}
        </motion.div>
      ))}
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>→ One platform</span>
    </div>,

    // Step 1: Tenant isolation
    <div key={1} className="flex gap-3">
      {["Tenant A", "Tenant B", "Tenant C"].map((t, i) => (
        <div key={t} className="flex-1 p-2 rounded-lg flex flex-col gap-1"
             style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-[0.6rem] font-bold" style={{ color: ["var(--cyan-aeos)","var(--amber-aeos)","#6366F1"][i] }}>{t}</p>
          <div className="h-6 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
          <div className="h-6 rounded" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
      ))}
    </div>,

    // Step 2: Job queue
    <div key={2} className="flex items-center gap-3">
      <div className="flex flex-col gap-1 flex-1">
        {["Payroll Run", "Report Gen", "Bulk Import"].map((job) => (
          <div key={job} className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
               style={{ background: "rgba(255,179,71,0.08)", border: "1px solid rgba(255,179,71,0.15)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--amber-aeos)" }} />
            <span className="text-[0.62rem]" style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans',sans-serif" }}>{job}</span>
            <span className="ml-auto label-mono text-[0.55rem]" style={{ color: "var(--text-muted)" }}>QUEUED</span>
          </div>
        ))}
      </div>
      <svg className="w-5 h-5" style={{ color: "var(--amber-aeos)" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    </div>,

    // Step 3: Config tree
    <div key={3} className="flex flex-col gap-1.5">
      {[
        { depth: 0, label: "Tenant Config", color: "var(--cyan-aeos)" },
        { depth: 1, label: "Custom Fields (12)", color: "rgba(255,255,255,0.5)" },
        { depth: 1, label: "Approval Chains (3)", color: "rgba(255,255,255,0.5)" },
        { depth: 1, label: "Role Definitions (8)", color: "rgba(255,255,255,0.5)" },
      ].map(({ depth, label, color }) => (
        <div key={label} className="flex items-center gap-2" style={{ paddingLeft: `${depth * 16}px` }}>
          {depth > 0 && <span className="text-[0.6rem]" style={{ color: "rgba(0,229,255,0.3)" }}>└─</span>}
          <span className="text-[0.65rem]" style={{ color, fontFamily: "'JetBrains Mono',monospace" }}>{label}</span>
        </div>
      ))}
    </div>,
  ];

  return diagrams[step] || null;
}
