// src/components/DataDotGrid.js
'use client';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
gsap.registerPlugin(InertiaPlugin);

// --- UTILIDADES ---
const hexToRgb = hex => {
  const m = hex?.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
};
const throttle = (fn, ms) => {
  let t = 0;
  return (...a) => {
    const n = performance.now();
    if (n - t >= ms) { t = n; fn(...a); }
  };
};

const DEFAULT_PLATFORM_ID_TO_KEY = { 
  1: 'SPOTIFY',
  2: 'YOUTUBE',
  3: 'TIKTOK',
  4: 'INSTAGRAM',
  5: 'IPHONE',
  6: 'WHATSAPP',
  7: 'STREAMING',
  8: 'GOOGLE',
};
const TIME_ID_TO_BUCKET = { 1: '4w', 2: '6m', 3: '1y' };

// hash simple para posicionamiento estable
const pseudoRandom = (seed) => {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= (h >>> 16)) >>> 0);
};

export default function DataDotGrid({
  data = [],
  filters, // importante: que venga desde Explore
  dotSize = 10,
  gap = 12,
  baseColor = '#1B1F3A',
  activeColor = '#19258D',
  proximity = 120,
  speedTrigger = 120,
  resistance = 700,
  returnDuration = 1.25,
  hitTestPadding = 15,
  colorMapping = { 
    SPOTIFY: '#39D353',
    YOUTUBE: '#FF5353',
    TIKTOK: '#A78BFA',
    INSTAGRAM: '#f87ad8',
    IPHONE: '#f2fb73',
    WHATSAPP: '#25d3bc',
    STREAMING: '#b457f7',
    GOOGLE: '#4285F4'
  },
  hoverScale = 1.2,
  tooltipOffset = { x: 30, y: 0 },
  // 👇 nuevo: padding seguro para no quedar detrás de UI
  safePadding = { top: 96, right: 220, bottom: 120, left: 120 },
  // 👇 nuevo: factor para compactar la separación entre clusters
  clusterTightness = 0.78, // <1 = más juntos
  onSelect
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const dotsRef = useRef([]);
  const nodesRef = useRef([]);
  const [hover, setHover] = useState(null);
  const [active, setActive] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const actRgb  = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const p = new window.Path2D();
    p.arc(0, 0, 1, 0, Math.PI * 2);
    return p;
  }, []);

  // Construye la parrilla
  const buildGrid = useCallback(() => {
    const wrap = wrapRef.current, cvs = canvasRef.current;
    if (!wrap || !cvs) return;
    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cvs.width = width * dpr; cvs.height = height * dpr;
    cvs.style.width = `${width}px`; cvs.style.height = `${height}px`;
    const ctx = cvs.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;
    const gridW = cell * cols - gap; const gridH = cell * rows - gap;
    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;
    const arr = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        arr.push({ cx: startX + x * cell, cy: startY + y * cell, xOffset: 0, yOffset: 0, _inertia: false });
      }
    }
    dotsRef.current = arr;
  }, [dotSize, gap]);

  useEffect(() => {
    buildGrid();
    let ro;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(buildGrid);
      if (wrapRef.current) ro.observe(wrapRef.current);
    } else {
      window.addEventListener('resize', buildGrid);
    }
    return () => { ro ? ro.disconnect() : window.removeEventListener('resize', buildGrid); };
  }, [buildGrid]);

  // --- Normalización + filtrado (robusto a datos raros)
  const filtered = useMemo(() => {
    if (!Array.isArray(data) || !filters) return [];

    const normalized = data
      .filter(d => d && typeof d.platformId !== 'undefined')
      .map(d => {
        const pId = Number(d.platformId);
        const pKey = DEFAULT_PLATFORM_ID_TO_KEY[pId];
        if (!pKey || Number.isNaN(pId)) return null;
        return {
          ...d,
          platformId: pId,
          platformKey: pKey,
          awareness: Number(d.awareness ?? 1) || 1,
          timeBucket: (typeof d.timeBucket === 'string' ? d.timeBucket : null)
            ?? TIME_ID_TO_BUCKET[Number(d.time ?? 1)] ?? '4w'
        };
      })
      .filter(Boolean);

    const lv = Number(filters.level) || 1;
    const tb = TIME_ID_TO_BUCKET[Number(filters.time) || 1] ?? '4w';
    const plats = new Set((filters.platforms || []).map(Number).filter(Boolean));
    const tagSet = new Set(filters.tags || []);

    return normalized.filter(it =>
      it.awareness === lv &&
      it.timeBucket === tb &&
      (plats.size === 0 || plats.has(it.platformId)) &&
      (tagSet.size === 0 || (it.tags || []).some(t => tagSet.has(t)))
    );
  }, [data, filters]);

  const computeNodeSize = useCallback(() => dotSize, [dotSize]);

  // --- Layout de clusters (centrado + compacto + fuera de UI)
  const layoutNodes = useCallback(() => {
    const wrap = wrapRef.current; if (!wrap || !filters) return;
    const { width, height } = wrap.getBoundingClientRect();

    // zona util visible evitando UI
    const PAD = {
      top: Math.max(0, safePadding.top ?? 0),
      right: Math.max(0, safePadding.right ?? 0),
      bottom: Math.max(0, safePadding.bottom ?? 0),
      left: Math.max(0, safePadding.left ?? 0),
    };
    const usableW = Math.max(200, width - PAD.left - PAD.right);
    const usableH = Math.max(200, height - PAD.top - PAD.bottom);

    // plataformas activas (para repartir clusters)
    const rawPlatforms = filters.platforms?.length > 0
      ? filters.platforms
      : Object.keys(DEFAULT_PLATFORM_ID_TO_KEY).map(Number);

    const activePlatforms = rawPlatforms
      .filter(p => typeof p === 'number' && DEFAULT_PLATFORM_ID_TO_KEY[p])
      .sort((a, b) => a - b);

    const numClusters = Math.max(1, activePlatforms.length);

    // Radio de cluster (compacto y proporcional al área disponible)
    const maxRByWidth = usableW / (numClusters * 2.2);
    const maxRByHeight = usableH / 3.0;
    const clusterRadius = Math.max(
      60,
      Math.min(160, Math.min(maxRByWidth, maxRByHeight)) * clusterTightness
    );

    // Anchuras/separación entre clusters (más juntos)
    const perClusterSlot = clusterRadius * 2 + 40; // círculo + margen
    const totalClusterWidth = Math.min(usableW, perClusterSlot * (numClusters - 1));
    const startX = PAD.left + (usableW - totalClusterWidth) / 2;
    const stepX = numClusters > 1 ? totalClusterWidth / (numClusters - 1) : 0;

    // Altura centrada dentro del área útil
    const anchorY = PAD.top + usableH / 2;

    const PLATFORM_ANCHORS = {};
    activePlatforms.forEach((platformId, index) => {
      PLATFORM_ANCHORS[platformId] = {
        x: numClusters > 1 ? startX + index * stepX : PAD.left + usableW / 2,
        y: anchorY,
      };
    });

    // liberar celdas
    dotsRef.current.forEach(d => { d._taken = false; });

    const newNodes = [];

    for (const item of filtered) {
      const anchor = PLATFORM_ANCHORS[item.platformId] || { x: PAD.left + usableW / 2, y: anchorY };
      const angle = (pseudoRandom('angle' + item.id) / 4294967295) * Math.PI * 2;
      const radius = Math.sqrt(pseudoRandom('radius' + item.id) / 4294967295) * clusterRadius;
      const targetX = anchor.x + Math.cos(angle) * radius;
      const targetY = anchor.y + Math.sin(angle) * radius;

      let best = -1, bestDist = Infinity;
      for (let i = 0; i < dotsRef.current.length; i++) {
        const d = dotsRef.current[i];
        if (d._taken) continue;
        const dist = Math.hypot(d.cx - targetX, d.cy - targetY);
        if (dist < bestDist) { bestDist = dist; best = i; }
      }

      if (best >= 0) {
        dotsRef.current[best]._taken = true;
        newNodes.push({
          id: item.id,
          item,
          gridIndex: best,
          baseR: computeNodeSize(item),
          color: colorMapping[item.platformKey] || '#9BA3B4'
        });
      }
    }
    nodesRef.current = newNodes;
  }, [filtered, colorMapping, computeNodeSize, filters, safePadding, clusterTightness]);

  useEffect(() => {
    if (wrapRef.current) layoutNodes();
  }, [layoutNodes]);

  // --- Dibujo
  useEffect(() => {
    if (!circlePath) return;
    let raf;
    const draw = () => {
      const cvs = canvasRef.current; const ctx = cvs?.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, cvs.width, cvs.height);

      const hx = hover ? dotsRef.current[hover.gridIndex]?.cx + dotsRef.current[hover.gridIndex]?.xOffset : -9999;
      const hy = hover ? dotsRef.current[hover.gridIndex]?.cy + dotsRef.current[hover.gridIndex]?.yOffset : -9999;

      // fondo de puntos
      dotsRef.current.forEach(dot => {
        const ox = dot.cx + dot.xOffset; const oy = dot.cy + dot.yOffset;
        let fill = baseColor;
        const dsq = Math.hypot(dot.cx - hx, dot.cy - hy);
        if (dsq <= proximity) {
          const t = 1 - dsq / proximity;
          fill = `rgb(${Math.round(baseRgb.r + (actRgb.r - baseRgb.r) * t)},${Math.round(baseRgb.g + (actRgb.g - baseRgb.g) * t)},${Math.round(baseRgb.b + (actRgb.b - baseRgb.b) * t)})`;
        }
        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(dotSize / 2, dotSize / 2);
        ctx.fillStyle = fill;
        ctx.fill(circlePath);
        ctx.restore();
      });

      // nodos de datos
      nodesRef.current.forEach(n => {
        const dot = dotsRef.current[n.gridIndex]; if (!dot) return;
        const isHover = hover?.gridIndex === n.gridIndex;
        const isActive = active?.gridIndex === n.gridIndex;
        const x = dot.cx + dot.xOffset; const y = dot.cy + dot.yOffset;
        const R = n.baseR * (isHover ? hoverScale : 1);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(R / 2, R / 2);
        ctx.fillStyle = n.color;
        ctx.fill(circlePath);
        ctx.restore();
        if (isHover || isActive) {
          ctx.beginPath();
          ctx.arc(x, y, (R / 2) * 0.85, 0, Math.PI * 2);
          ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [circlePath, dotSize, baseColor, baseRgb, actRgb, proximity, hover, active, hoverScale]);

  // --- Interacción
  useEffect(() => {
    const state = { lastTime: 0, lastX: 0, lastY: 0 };
    const hitTest = (px, py) => {
      for (const n of nodesRef.current) {
        const d = dotsRef.current[n.gridIndex]; if (!d) continue;
        const dsq = Math.hypot(px - (d.cx + d.xOffset), py - (d.cy + d.yOffset));
        if (dsq < (n.baseR / 2) + hitTestPadding) return n;
      }
      return null;
    };
    const onMove = e => {
      const rect = canvasRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      setHover(hitTest(px, py));
      const now = performance.now();
      const dt = now - state.lastTime || 16;
      const vx = ((e.clientX - state.lastX) / dt) * 1000;
      const vy = ((e.clientY - state.lastY) / dt) * 1000;
      state.lastTime = now; state.lastX = e.clientX; state.lastY = e.clientY;
      if (Math.hypot(vx, vy) > speedTrigger) {
        for (const d of dotsRef.current) {
          if (Math.hypot(d.cx - px, d.cy - py) < proximity && !d._inertia) {
            d._inertia = true;
            gsap.killTweensOf(d);
            gsap.to(d, {
              inertia: { xOffset: d.cx - px + vx * 0.005, yOffset: d.cy - py + vy * 0.005, resistance },
              onComplete: () => {
                gsap.to(d, { xOffset: 0, yOffset: 0, duration: returnDuration, ease: 'elastic.out(1,0.75)' });
                d._inertia = false;
              }
            });
          }
        }
      }
    };
    const onClick = e => {
      const rect = canvasRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;
      const n = hitTest(px, py);
      setActive(n);
      if (n) onSelect?.(n.item);
    };
    const el = canvasRef.current; if (!el) return;
    const tm = throttle(onMove, 16);
    el.addEventListener('mousemove', tm, { passive: true });
    el.addEventListener('click', onClick);
    el.addEventListener('mouseleave', () => setHover(null));
    return () => {
      el.removeEventListener('mousemove', tm);
      el.removeEventListener('click', onClick);
      el.removeEventListener('mouseleave', () => setHover(null));
    };
  }, [resistance, returnDuration, speedTrigger, proximity, onSelect, hitTestPadding, computeNodeSize]);

  // Broadcasts
  useEffect(() => {
    const off = e => { if (e.detail === 'DATADOTGRID_CLEAR_ACTIVE') setActive(null); };
    window.addEventListener('datadotgrid', off);
    return () => window.removeEventListener('datadotgrid', off);
  }, []);

  // Tooltip
  useEffect(() => {
    if (!hover || active) { setTooltip(null); return; }
    const dot = dotsRef.current[hover.gridIndex];
    if (dot) {
      const sourceX = dot.cx + dot.xOffset;
      const sourceY = dot.cy + dot.yOffset;
      setTooltip({ item: hover.item, sourceX, sourceY });
    }
  }, [hover, active]);

  useEffect(() => {
    if (tooltip && tooltipRef.current && !tooltip.style) {
      const tipRect = tooltipRef.current.getBoundingClientRect();
      const winWidth = window.innerWidth;
      const winHeight = window.innerHeight;
      let finalX, lineEndX;
      if (tooltip.sourceX > winWidth / 2) {
        finalX = tooltip.sourceX - tipRect.width - tooltipOffset.x;
        lineEndX = finalX + tipRect.width;
      } else {
        finalX = tooltip.sourceX + tooltipOffset.x;
        lineEndX = finalX;
      }
      let finalY = tooltip.sourceY - tipRect.height / 2;
      if (finalY < 0) finalY = 0;
      if (finalY + tipRect.height > winHeight) finalY = winHeight - tipRect.height;
      setTooltip(prev => ({ ...prev, style: { opacity: 1, left: `${finalX}px`, top: `${finalY}px` }, lineEndX, lineEndY: finalY + tipRect.height / 2 }));
    }
  }, [tooltip, tooltipOffset]);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={wrapRef} style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }} />
        {tooltip && (
          <>
            {tooltip.style && (
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}>
                <line x1={tooltip.sourceX} y1={tooltip.sourceY} x2={tooltip.lineEndX} y2={tooltip.lineEndY} stroke="#19258D" strokeWidth="4" />
              </svg>
            )}
            <div
              ref={tooltipRef}
              style={{
                position: 'absolute',
                transform: 'translateY(-50%)',
                background: '#0e1861cf',
                border: '10px solid #19258D',
                padding: '20px',
                color: '#cfe8ff',
                pointerEvents: 'none',
                maxWidth: 280,
                zIndex: 2,
                boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'opacity 0.2s ease-in-out',
                ...tooltip.style,
                opacity: tooltip.style?.opacity ?? 0,
              }}
            >
              <div style={{ color: '#cfe8ff', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {DEFAULT_PLATFORM_ID_TO_KEY[tooltip.item.platformId]}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {typeof tooltip.item.rank === 'number' && tooltip.item.platformId === 1 && (
                  <div style={{ background: '#a9fdee', color: 'rgb(17, 20, 35)', padding: '8px', fontWeight: 'bold', fontSize: '16px', lineHeight: 1 }}>
                    #{tooltip.item.rank}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '16px' }}>
                    "{tooltip.item.title}"
                  </div>
                  {tooltip.item.artists && ( <div style={{ color: 'rgba(216, 225, 255, 0.7)', fontSize: '14px' }}> {tooltip.item.artists} </div> )}
                </div>
              </div>
              {tooltip.item.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tooltip.item.tags.slice(0, 5).map((t, i) => (
                    <span key={i} style={{ fontSize: 11, background: 'rgba(82,39,255,0.15)', border: '1px solid rgba(82,39,255,0.4)', padding: '2px 6px', borderRadius: 999 }}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
