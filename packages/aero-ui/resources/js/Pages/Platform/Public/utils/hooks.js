import { useState, useEffect, useRef, useCallback } from "react";
import { useMotionValue, useSpring } from "framer-motion";

// ─── useMouseParallax ──────────────────────────────────────────────────────────
// Returns spring-smoothed mouse position (0–1) for parallax layers.
// Usage: const { mouseX, mouseY } = useMouseParallax()
// Then: useTransform(mouseX, [0,1], ["-10px","10px"])

export function useMouseParallax(stiffness = 80, damping = 20) {
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);

  const mouseX = useSpring(rawX, { stiffness, damping, mass: 0.5 });
  const mouseY = useSpring(rawY, { stiffness, damping, mass: 0.5 });

  useEffect(() => {
    const handleMove = (e) => {
      rawX.set(e.clientX / window.innerWidth);
      rawY.set(e.clientY / window.innerHeight);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [rawX, rawY]);

  return { mouseX, mouseY };
}

// ─── useCountUp ───────────────────────────────────────────────────────────────
// Animates a number from 0 to `end` when `trigger` becomes true.
// Usage: const count = useCountUp(250, inView, 2000)

export function useCountUp(end, trigger, duration = 1800, decimals = 0) {
  const [count, setCount] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!trigger) return;
    let startTime = null;
    const startValue = 0;
    const endValue = end;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startValue + (endValue - startValue) * eased;

      setCount(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.floor(current));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [trigger, end, duration, decimals]);

  return count;
}

// ─── useScrollProgress ────────────────────────────────────────────────────────
// Returns scroll progress (0–1) of a specific element ref.
// Used for narrative section per-step parallax.

export function useElementScrollProgress(ref) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const total = rect.height + windowH;
      const scrolled = windowH - rect.top;
      setProgress(Math.min(Math.max(scrolled / total, 0), 1));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [ref]);

  return progress;
}

// ─── useBentoMouseGlow ─────────────────────────────────────────────────────────
// Updates CSS custom properties on bento cards for the cursor-following glow.

export function useBentoMouseGlow(ref) {
  const handleMouseMove = useCallback((e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    el.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }, [ref]);

  return { onMouseMove: handleMouseMove };
}

// ─── useNavScroll ─────────────────────────────────────────────────────────────
// Returns true when the page has scrolled past a threshold.

export function useNavScroll(threshold = 60) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [threshold]);

  return scrolled;
}

// ─── useTestimonialSlider ─────────────────────────────────────────────────────

export function useTestimonialSlider(total, autoInterval = 5000) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = useCallback((i) => {
    setDirection(i > index ? 1 : -1);
    setIndex(i);
  }, [index]);

  const next = useCallback(() => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  useEffect(() => {
    const timer = setInterval(next, autoInterval);
    return () => clearInterval(timer);
  }, [next, autoInterval]);

  return { index, direction, goTo, next, prev };
}
