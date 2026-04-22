import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ctaVariants } from "../utils/motionVariants";

export default function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="relative py-20 px-6 lg:px-10 xl:px-16 overflow-hidden">

      {/* Far background glow */}
      <div className="absolute inset-0 pointer-events-none"
           style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,229,255,0.06) 0%, transparent 70%)" }} />

      <div className="max-w-screen-xl mx-auto">
        <motion.div
          variants={ctaVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="cta-glass rounded-3xl p-10 lg:p-16 relative overflow-hidden"
        >
          {/* Decorative grid inside card */}
          <div className="absolute inset-0 bg-grid opacity-30 rounded-3xl pointer-events-none" />

          {/* Animated corner accents */}
          <div className="absolute top-0 left-0 w-24 h-24 pointer-events-none">
            <div className="absolute top-4 left-4 w-px h-12"
                 style={{ background: "linear-gradient(to bottom, var(--cyan-aeos), transparent)" }} />
            <div className="absolute top-4 left-4 w-12 h-px"
                 style={{ background: "linear-gradient(to right, var(--cyan-aeos), transparent)" }} />
          </div>
          <div className="absolute bottom-0 right-0 w-24 h-24 pointer-events-none">
            <div className="absolute bottom-4 right-4 w-px h-12"
                 style={{ background: "linear-gradient(to top, var(--amber-aeos), transparent)" }} />
            <div className="absolute bottom-4 right-4 w-12 h-px"
                 style={{ background: "linear-gradient(to left, var(--amber-aeos), transparent)" }} />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-start justify-between gap-10">
            {/* Left: text */}
            <div className="flex flex-col gap-5 max-w-2xl text-center lg:text-left">
              <p className="label-mono" style={{ color: "var(--cyan-aeos)" }}>
                START TODAY
              </p>
              <h2 className="display-section text-white leading-none">
                Ready to modernize
                <br />
                your <span className="text-gradient-full">enterprise stack?</span>
              </h2>
              <p className="text-base leading-relaxed"
                 style={{ color: "var(--text-muted)", fontFamily: "'DM Sans',sans-serif" }}>
                Get a personalized demo tailored to your organization's size, modules of interest, and technical requirements. No lock-in, no surprises.
              </p>

              {/* Feature bullets */}
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {[
                  "14-day pilot environment",
                  "Dedicated solutions engineer",
                  "SOC2 Type II compliant",
                  "99.97% SLA guarantee",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--cyan-aeos)" }}
                         fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)", fontFamily: "'DM Sans',sans-serif" }}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: form-ish card */}
            <div className="w-full lg:w-80 flex-shrink-0 flex flex-col gap-4 p-6 rounded-2xl"
                 style={{ background: "rgba(3,4,10,0.7)", border: "1px solid rgba(0,229,255,0.12)" }}>
              <p className="font-semibold text-white text-sm" style={{ fontFamily: "'Syne',sans-serif" }}>
                Request a Demo
              </p>

              {[
                { placeholder: "Full name", type: "text" },
                { placeholder: "Work email", type: "email" },
                { placeholder: "Company name", type: "text" },
              ].map(({ placeholder, type }) => (
                <input
                  key={placeholder}
                  type={type}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#E8EDF5",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                  onFocus={e => e.target.style.borderColor = "rgba(0,229,255,0.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
              ))}

              {/* Team size select */}
              <select
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none appearance-none cursor-pointer"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#8892A4",
                  fontFamily: "'DM Sans',sans-serif",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(0,229,255,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              >
                <option value="">Team size</option>
                <option>50–200 employees</option>
                <option>200–1,000 employees</option>
                <option>1,000–5,000 employees</option>
                <option>5,000+ employees</option>
              </select>

              <motion.button
                className="btn-primary w-full mt-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Book Demo Slot
              </motion.button>

              <p className="text-center text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                No credit card required. Responds within 2 business hours.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
