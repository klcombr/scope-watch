import { useEffect, useState } from 'react';

/* ══════════════════════════════════════════════════
   CHANGE ORDER 3D — Narrative sequence (Refined)
   Document → lines → request → value → approval
   ══════════════════════════════════════════════════ */

interface ChangeOrder3DProps {
  className?: string;
}

interface Step {
  delay: number;
  opacity: number;
  translateY?: number;
}

const STEPS: Step[] = [
  { delay: 200, opacity: 1 },           // document frame
  { delay: 500, opacity: 0.7, translateY: 0 },   // content lines
  { delay: 700, opacity: 1, translateY: 0 },      // REQUEST label
  { delay: 900, opacity: 1, translateY: 0 },      // OUT OF SCOPE
  { delay: 1100, opacity: 1, translateY: 0 },     // HOURS
  { delay: 1300, opacity: 1, translateY: 0 },     // VALUE
  { delay: 1500, opacity: 1, translateY: 0 },     // APPROVAL
];

export function ChangeOrder3D({ className = '' }: ChangeOrder3DProps) {
  const [phase, setPhase] = useState(-1);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setPhase(STEPS.length - 1); return; }

    let step = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function scheduleNext() {
      if (step >= STEPS.length) return;
      const currentStep = step;
      timers.push(setTimeout(() => {
        setPhase(currentStep);
        step++;
        scheduleNext();
      }, currentStep === 0 ? STEPS[0].delay : STEPS[currentStep].delay - STEPS[currentStep - 1].delay));
    }

    // Initial delay before sequence starts
    timers.push(setTimeout(scheduleNext, 300));
    return () => timers.forEach(clearTimeout);
  }, []);

  const show = (step: number) => phase >= step;

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
          transform: 'rotateX(10deg)',
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
            opacity: show(0) ? 1 : 0,
            transition: 'opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em',
            color: 'var(--text-muted)', marginBottom: '16px', fontFamily: 'var(--mono)',
            opacity: show(0) ? 1 : 0,
            transition: 'opacity 300ms ease 100ms',
          }}>
            CHANGE ORDER #004
          </div>

          {/* Content lines — appear sequentially */}
          <div style={{ height: '2px', width: '70%', background: 'var(--border)', marginBottom: '8px',
            opacity: show(1) ? 0.7 : 0,
            transition: 'opacity 300ms ease',
          }} />
          <div style={{ height: '2px', width: '90%', background: 'var(--border)', marginBottom: '8px',
            opacity: show(1) ? 0.5 : 0,
            transition: 'opacity 300ms ease 80ms',
          }} />

          {/* REQUEST → OUT OF SCOPE */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em',
              fontFamily: 'var(--mono)', padding: '2px 6px',
              border: '1px solid var(--border-strong)',
              opacity: show(2) ? 1 : 0,
              transform: show(2) ? 'none' : 'translateY(4px)',
              transition: 'opacity 300ms ease, transform 300ms ease',
            }}>
              REQUEST
            </span>
            <span style={{
              fontSize: '8px', fontWeight: 700, letterSpacing: '0.1em',
              fontFamily: 'var(--mono)', padding: '2px 6px',
              border: '1px solid var(--text)',
              background: 'var(--text)',
              color: 'var(--black)',
              opacity: show(3) ? 1 : 0,
              transform: show(3) ? 'none' : 'translateY(4px)',
              transition: 'opacity 300ms ease, transform 300ms ease',
            }}>
              OUT OF SCOPE
            </span>
          </div>

          {/* HOURS */}
          <div style={{
            fontSize: '14px', fontWeight: 800, fontFamily: 'var(--mono)',
            letterSpacing: '-0.02em', marginBottom: '4px',
            opacity: show(4) ? 1 : 0,
            transform: show(4) ? 'none' : 'translateY(4px)',
            transition: 'opacity 300ms ease, transform 300ms ease',
          }}>
            4.5h
          </div>

          <div style={{ height: '1px', width: '100%', background: 'var(--border)', margin: '10px 0' }} />

          {/* VALUE + APPROVAL */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{
              fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em',
              color: 'var(--text-muted)', fontFamily: 'var(--mono)',
              opacity: show(5) ? 1 : 0,
              transition: 'opacity 300ms ease',
            }}>
              TOTAL
            </div>
            <div style={{
              fontSize: '20px', fontWeight: 800, letterSpacing: '-0.03em',
              fontFamily: 'var(--mono)',
              opacity: show(5) ? 1 : 0,
              transform: show(5) ? 'none' : 'translateY(4px)',
              transition: 'opacity 300ms ease, transform 300ms ease',
            }}>
              R$ 450
            </div>
          </div>

          {/* Approval status */}
          <div style={{
            marginTop: '12px', fontSize: '8px', fontWeight: 700,
            letterSpacing: '0.1em', fontFamily: 'var(--mono)',
            padding: '4px 0', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'space-between',
            opacity: show(6) ? 1 : 0,
            transition: 'opacity 300ms ease',
          }}>
            <span style={{ color: 'var(--text-muted)' }}>STATUS</span>
            <span>APPROVED</span>
          </div>
        </div>

        {/* Back layer */}
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
            opacity: show(0) ? 0.3 : 0,
            transition: 'opacity 500ms ease 300ms',
          }}
        />
      </div>
    </div>
  );
}
