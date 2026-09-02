import { useEffect, useRef, useState, type ReactNode } from 'react';

/* ══════════════════════════════════════════════════
   MOTION SYSTEM — Refined animation primitives
   ══════════════════════════════════════════════════ */

// ── Easings ────────────────────────────────────────
const EASE_OUT = 'cubic-bezier(0.16, 1, 0.3, 1)';

// ── FadeIn ──────────────────────────────────────────

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  className?: string;
  style?: React.CSSProperties;
  threshold?: number;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 500,
  y = 12,
  x = 0,
  className = '',
  style,
  threshold = 0.15,
}: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setVisible(true); return; }

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'none' : `translate(${x}px, ${y}px)`,
        transition: `opacity ${duration}ms ${EASE_OUT} ${delay}ms, transform ${duration}ms ${EASE_OUT} ${delay}ms`,
        ...(visible ? {} : { willChange: 'opacity, transform' }),
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── StaggerChildren ─────────────────────────────────
// Caps at maxItems to avoid motion saturation on long lists

interface StaggerProps {
  children: ReactNode;
  stagger?: number;
  className?: string;
  maxItems?: number;
}

export function StaggerChildren({ children, stagger = 80, className = '', maxItems = 6 }: StaggerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setVisible(true); return; }

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => {
            const shouldAnimate = visible && i < maxItems;
            const delay = i < maxItems ? i * stagger : 0;
            return (
              <div
                key={i}
                style={{
                  opacity: shouldAnimate ? 1 : visible ? 1 : 0,
                  transform: shouldAnimate ? 'none' : visible ? 'none' : 'translateY(8px)',
                  transition: i < maxItems
                    ? `opacity 350ms ${EASE_OUT} ${delay}ms, transform 350ms ${EASE_OUT} ${delay}ms`
                    : 'none',
                  willChange: !visible ? 'opacity, transform' : undefined,
                }}
              >
                {child}
              </div>
            );
          })
        : children}
    </div>
  );
}

// ── CountUp ─────────────────────────────────────────
// Uses prevValue ref to avoid re-triggering on parent rerenders

interface CountUpProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CountUp({
  value,
  duration = 800,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
  style,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(0);
  const [started, setStarted] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setDisplayed(value); prevValue.current = value; return; }

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const from = prevValue.current;
    const to = value;
    prevValue.current = value;

    if (from === to) return;

    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(from + (to - from) * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [started, value, duration]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}{displayed.toFixed(decimals)}{suffix}
    </span>
  );
}

// ── useMousePosition ────────────────────────────────
// Smoothed with lerp — object has "mass"

export function useMousePosition(smoothing = 0.08) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    function onMove(e: MouseEvent) {
      target.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      };
    }

    function tick() {
      const dx = target.current.x - current.current.x;
      const dy = target.current.y - current.current.y;
      current.current.x += dx * smoothing;
      current.current.y += dy * smoothing;

      if (Math.abs(dx) > 0.0001 || Math.abs(dy) > 0.0001) {
        setPos({ x: current.current.x, y: current.current.y });
      }
      raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener('mousemove', onMove);
    };
  }, [smoothing]);

  return pos;
}

// ── useScrollProgress ───────────────────────────────

export function useScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setProgress(1); return; }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setProgress(entry.intersectionRatio);
        }
      },
      { threshold: Array.from({ length: 20 }, (_, i) => i / 20) },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return { ref, progress };
}

// ── TiltCard ────────────────────────────────────────
// Smoothed lerp tilt with elevation + shadow

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number;
}

export function TiltCard({ children, className = '', style, maxTilt = 4 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const targetRot = useRef({ x: 0, y: 0 });
  const currentRot = useRef({ x: 0, y: 0 });
  const raf = useRef<number>(0);
  const [transform, setTransform] = useState('');
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    function onMove(e: MouseEvent) {
      const rect = el!.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetRot.current = { x: x * maxTilt, y: -y * maxTilt };
    }

    function onEnter() { setHovered(true); }
    function onLeave() {
      setHovered(false);
      targetRot.current = { x: 0, y: 0 };
    }

    function tick() {
      const dx = targetRot.current.x - currentRot.current.x;
      const dy = targetRot.current.y - currentRot.current.y;
      currentRot.current.x += dx * 0.12;
      currentRot.current.y += dy * 0.12;

      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        const rx = currentRot.current.x;
        const ry = currentRot.current.y;
        setTransform(`perspective(800px) rotateY(${ry}deg) rotateX(${rx}deg) translateZ(4px)`);
      }
      raf.current = requestAnimationFrame(tick);
    }

    raf.current = requestAnimationFrame(tick);
    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(raf.current);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [maxTilt]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: transform || 'perspective(800px)',
        transition: hovered
          ? 'transform 80ms linear'
          : `transform 350ms ${EASE_OUT}`,
        willChange: hovered ? 'transform' : undefined,
        transformStyle: 'preserve-3d',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.3)' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
