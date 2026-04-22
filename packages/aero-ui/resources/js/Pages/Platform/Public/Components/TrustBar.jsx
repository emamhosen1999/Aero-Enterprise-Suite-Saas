import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TRUST_LOGOS } from "../utils/pageData";

// Duplicate list for seamless loop
const LOGOS_DOUBLED = [...TRUST_LOGOS, ...TRUST_LOGOS];

function LogoBadge({ name }) {
  return (
    <div
      className="flex items-center gap-2.5 px-6 py-3 rounded-xl mx-3 flex-shrink-0 transition-all duration-300 cursor-default"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Generic geometric logo shape */}
      <div className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center"
           style={{ background: "rgba(0,229,255,0.15)" }}>
        <div className="w-2 h-2 rounded-sm rotate-45"
             style={{ background: "var(--cyan-aeos)", opacity: 0.8 }} />
      </div>
      <span
        className="text-sm font-medium whitespace-nowrap"
        style={{ color: "rgba(255,255,255,0.45)", fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.01em" }}
      >
        {name}
      </span>
    </div>
  );
}

export default function TrustBar() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="relative py-14 overflow-hidden">
      {/* Top/bottom fades */}
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute inset-y-0 left-0 w-24 lg:w-40"
             style={{ background: "linear-gradient(to right, #03040A, transparent)" }} />
        <div className="absolute inset-y-0 right-0 w-24 lg:w-40"
             style={{ background: "linear-gradient(to left, #03040A, transparent)" }} />
      </div>

      {/* Divider lines */}
      <div className="divider-cyan mb-8 mx-6 lg:mx-16" />

      {/* Label */}
      <motion.div
        className="text-center mb-6"
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <p className="label-mono text-[0.65rem]" style={{ color: "var(--text-muted)" }}>
          TRUSTED BY FORWARD-THINKING ENTERPRISES
        </p>
      </motion.div>

      {/* Marquee track */}
      <motion.div
        className="relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div
          className="flex"
          style={{
            width: "max-content",
            animation: "marquee 32s linear infinite",
          }}
        >
          {LOGOS_DOUBLED.map((name, i) => (
            <LogoBadge key={`${name}-${i}`} name={name} />
          ))}
        </div>
      </motion.div>

      <div className="divider-cyan mt-8 mx-6 lg:mx-16" />
    </section>
  );
}
