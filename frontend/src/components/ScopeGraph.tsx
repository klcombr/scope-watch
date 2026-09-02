import { useEffect, useRef, useState } from 'react';
import { useMousePosition } from '../lib/motion';

/* ══════════════════════════════════════════════════
   SCOPE GRAPH — 3D Hero Element
   CSS 3D, no WebGL, monochrome brutalist
   ══════════════════════════════════════════════════ */

interface Node {
  x: number;
  y: number;
  z: number;
  label: string;
  size: 'sm' | 'md' | 'lg';
  lineTo?: number;
}

const NODES: Node[] = [
  { x: -140, y: -40, z: 20, label: 'PROJETO', size: 'lg', lineTo: 1 },
  { x: -40, y: 10, z: -10, label: 'ESCOPO', size: 'md', lineTo: 2 },
  { x: 60, y: -30, z: 30, label: 'SOLICITACAO', size: 'sm', lineTo: 3 },
  { x: 140, y: 20, z: -20, label: 'CHANGE ORDER', size: 'md', lineTo: 4 },
  { x: 220, y: -10, z: 10, label: 'R$', size: 'lg' },
];

export function ScopeGraph() {
  const mouse = useMousePosition();
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setMounted(true); return; }
    const timer = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const rotX = mouse.y * -3;
  const rotY = mouse.x * 5;

  return (
    <div
      ref={containerRef}
      className="scope-graph"
      style={{
        perspective: '1000px',
        perspectiveOrigin: '50% 50%',
        width: '100%',
        height: '340px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '500px',
          height: '300px',
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Grid lines — subtle background */}
        {[-100, -50, 0, 50, 100].map((y) => (
          <div
            key={`h${y}`}
            style={{
              position: 'absolute',
              left: '-20px',
              right: '-20px',
              top: `${150 + y}px`,
              height: '1px',
              background: 'var(--border)',
              opacity: 0.3,
              transformStyle: 'preserve-3d',
              transform: `translateZ(${y * 0.3}px)`,
            }}
          />
        ))}
        {[-160, -80, 0, 80, 160].map((x) => (
          <div
            key={`v${x}`}
            style={{
              position: 'absolute',
              top: '-20px',
              bottom: '-20px',
              left: `${250 + x}px`,
              width: '1px',
              background: 'var(--border)',
              opacity: 0.2,
              transformStyle: 'preserve-3d',
              transform: `translateZ(${x * 0.15}px)`,
            }}
          />
        ))}

        {/* Connection lines */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            transformStyle: 'preserve-3d',
          }}
        >
          {NODES.filter((n) => n.lineTo !== undefined).map((node, i) => {
            const target = NODES[node.lineTo!];
            return (
              <line
                key={`line${i}`}
                x1={250 + node.x}
                y1={150 + node.y}
                x2={250 + target.x}
                y2={150 + target.y}
                stroke="var(--border-strong)"
                strokeWidth="1"
                strokeDasharray="4 3"
                style={{
                  opacity: mounted ? 0.6 : 0,
                  transition: `opacity 800ms ease ${600 + i * 150}ms`,
                }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {NODES.map((node, i) => {
          const sizeMap = { sm: 6, md: 10, lg: 14 };
          const size = sizeMap[node.size];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${250 + node.x - size / 2}px`,
                top: `${150 + node.y - size / 2}px`,
                width: `${size}px`,
                height: `${size}px`,
                background: 'var(--text)',
                transformStyle: 'preserve-3d',
                transform: `translateZ(${node.z}px)`,
                boxShadow: `${-node.z * 0.2}px ${-node.z * 0.2}px 0 var(--border-strong)`,
                opacity: mounted ? 1 : 0,
                transition: `opacity 500ms ease ${300 + i * 120}ms`,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: `${size + 6}px`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--mono)',
                }}
              >
                {node.label}
              </div>
            </div>
          );
        })}

        {/* Floating document planes */}
        {[
          { x: -60, y: -60, z: 40, w: 36, h: 28, rotate: -8, delay: 900 },
          { x: 100, y: -50, z: -15, w: 32, h: 24, rotate: 5, delay: 1100 },
          { x: 180, y: 30, z: 25, w: 28, h: 20, rotate: -3, delay: 1300 },
        ].map((doc, i) => (
          <div
            key={`doc${i}`}
            style={{
              position: 'absolute',
              left: `${250 + doc.x}px`,
              top: `${150 + doc.y}px`,
              width: `${doc.w}px`,
              height: `${doc.h}px`,
              border: '1px solid var(--border-strong)',
              background: 'var(--bg)',
              transformStyle: 'preserve-3d',
              transform: `translateZ(${doc.z}px) rotateZ(${doc.rotate}deg)`,
              opacity: mounted ? 0.5 : 0,
              transition: `opacity 600ms ease ${doc.delay}ms`,
            }}
          >
            <div style={{ margin: '3px 3px 0', height: '2px', width: '60%', background: 'var(--border)' }} />
            <div style={{ margin: '2px 3px', height: '1px', width: '80%', background: 'var(--border)', opacity: 0.5 }} />
            <div style={{ margin: '2px 3px', height: '1px', width: '50%', background: 'var(--border)', opacity: 0.5 }} />
          </div>
        ))}
      </div>

      {/* Subtle ambient shadow */}
      <div
        style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '4px',
          background: 'var(--border)',
          opacity: 0.3,
          borderRadius: '50%',
          filter: 'blur(8px)',
        }}
      />
    </div>
  );
}
