import { useEffect, useState } from 'react';
import { useMousePosition } from '../lib/motion';

/* ══════════════════════════════════════════════════
   CHANGE ORDER 3D — Floating document element
   ══════════════════════════════════════════════════ */

interface ChangeOrder3DProps {
  className?: string;
}

export function ChangeOrder3D({ className = '' }: ChangeOrder3DProps) {
  const mouse = useMousePosition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setMounted(true); return; }
    const timer = setTimeout(() => setMounted(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const rotX = mouse.y * -4;
  const rotY = mouse.x * 6;

  const lineStyle = (width: string, delay: number): React.CSSProperties => ({
    height: '2px',
    width,
    background: 'var(--border)',
    marginBottom: '6px',
    opacity: mounted ? 0.7 : 0,
    transition: `opacity 400ms ease ${delay}ms`,
  });

  return (
    <div
      className={className}
      style={{
        perspective: '900px',
        perspectiveOrigin: '50% 50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 0',
      }}
    >
      <div
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${12 + rotX}deg) rotateY(${rotY}deg)`,
          transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Main document */}
        <div
          style={{
            width: '220px',
            padding: '24px 20px',
            border: '2px solid var(--border-strong)',
            background: 'var(--bg)',
            boxShadow: '8px 8px 0 var(--black), 12px 12px 0 var(--border)',
            transformStyle: 'preserve-3d',
            transform: 'translateZ(0)',
            opacity: mounted ? 1 : 0,
            transition: 'opacity 500ms ease 200ms',
          }}
        >
          <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'var(--mono)' }}>
            CHANGE ORDER #004
          </div>
          <div style={lineStyle('70%', 400)} />
          <div style={lineStyle('90%', 500)} />
          <div style={lineStyle('50%', 600)} />
          <div style={{ height: '12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--mono)', opacity: mounted ? 1 : 0, transition: 'opacity 400ms ease 700ms' }}>
              TOTAL
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'var(--mono)', opacity: mounted ? 1 : 0, transition: 'opacity 400ms ease 800ms' }}>
              R$ 800
            </div>
          </div>
        </div>

        {/* Back layer — shadow card */}
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '6px',
            width: '220px',
            height: '100%',
            border: '2px solid var(--border)',
            background: 'var(--surface)',
            transform: 'translateZ(-20px)',
            opacity: mounted ? 0.3 : 0,
            transition: 'opacity 600ms ease 500ms',
          }}
        />
      </div>
    </div>
  );
}
