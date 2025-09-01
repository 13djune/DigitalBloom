'use client';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import '../styles/filters.css';

gsap.registerPlugin(InertiaPlugin);

/* ---------- CONSTANTES Y MAPEOS ---------- */
const DEFAULT_PLATFORM_ID_TO_KEY = {
  1: 'SPOTIFY', 2: 'YOUTUBE', 3: 'TIKTOK', 4: 'INSTAGRAM',
  5: 'IPHONE', 6: 'WHATSAPP', 7: 'STREAMING', 8: 'GOOGLE',
};
const TIME_ID_TO_BUCKET = { 1: '4w', 2: '6m', 3: '1y' };

/* ---------- FUNCIONES UTILITARIAS ---------- */
const hexToRgb = hex => {
  const m = hex?.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
};

const throttle = (fn, ms) => {
  let t = 0;
  return (...a) => {
    const n = performance.now();
    if (n - t >= ms) {
      t = n;
      fn(...a);
    }
  };
};

const pseudoRandom = (seed) => {
  let h = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++) {
    h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^= (h >>> 16)) >>> 0);
};

/* ---------- COMPONENTE PRINCIPAL ---------- */
export default function DataDotGrid({
  data = [],
  filters,
  dotSize = 12,
  gap = 12,
  baseColor = '#1B1F3A',
  activeColor = '#d9fef4',
  proximity = 120,
  speedTrigger = 120,
  resistance = 700,
  returnDuration = 1.25,
  hitTestPadding = 15,
  hoverScale = 1.2,
  tooltipOffset = { x: 30, y: 0 },
  shockRadius = 250,
  shockStrength = 5,
  colorMapping = {
    SPOTIFY: '#22FF8E',
    YOUTUBE: '#FF5F5F',
    TIKTOK: '#A184FF',
    INSTAGRAM: '#FF8EDB',
    IPHONE: '#F5F84E',
    WHATSAPP: '#148500',
    STREAMING: '#FFBA3B',
    GOOGLE: '#77a9fa'
  },
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
  const actRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const squarePath = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const p = new window.Path2D();
    p.rect(-1, -1, 2, 2); // cuadrado centrado
    return p;
}, []);

  /* ---------- Construcción de la grilla de puntos ---------- */
  const buildGrid = useCallback(() => {
    const wrap = wrapRef.current, cvs = canvasRef.current;
    if (!wrap || !cvs) return;

    const { width, height } = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cvs.width = width * dpr;
    cvs.height = height * dpr;
    cvs.style.width = `${width}px`;
    cvs.style.height = `${height}px`;

    const ctx = cvs.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;
    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;
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

  /* ---------- Normalización y filtrado de datos ---------- */
  const filtered = useMemo(() => {
    if (!Array.isArray(data) || !filters) return [];
    const normalized = data
      .filter(d => d && Number.isFinite(Number(d.platformId)))
      .map(d => {
        const pid = Number(d.platformId);
        return {
          ...d,
          id: d.id ?? `${pid}-${d.title ?? d.url ?? Math.random().toString(36).slice(2)}`,
          platformId: pid,
          platformKey: DEFAULT_PLATFORM_ID_TO_KEY[pid] ?? 'UNKNOWN',
          awareness: Number(d.awareness ?? d.level ?? 1),
          timeBucket: d.timeBucket ?? TIME_ID_TO_BUCKET[Number(d.time) || 1] ?? '4w',
          tags: Array.isArray(d.tags) ? d.tags : []
        };
      })
      .filter(d => d.platformKey !== 'UNKNOWN');

    const lv = Number(filters.level) || 1;
    const tb = TIME_ID_TO_BUCKET[Number(filters.time) || 1] ?? '4w';
    const plats = new Set((filters.platforms || []).map(Number).filter(Number.isFinite));
    const tagSet = new Set(filters.tags || []);

    return normalized.filter(it =>
      it.awareness === lv &&
      it.timeBucket === tb &&
      (plats.size === 0 || plats.has(it.platformId)) &&
      (tagSet.size === 0 || it.tags.some(t => tagSet.has(t)))
    );
  }, [data, filters]);

  /* ---------- Layout de nodos (puntos de datos) ---------- */
  const layoutNodes = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || !filters) return;
  
    const { width, height } = wrap.getBoundingClientRect();
    const SAFE_MARGINS = { top: 160, bottom: 180, left: 220, right: 220 };
    const usableW = Math.max(320, width - SAFE_MARGINS.left - SAFE_MARGINS.right);
    const usableH = Math.max(240, height - SAFE_MARGINS.top - SAFE_MARGINS.bottom);
  
    const rawPlatforms = (filters.platforms?.length ? filters.platforms : Object.keys(DEFAULT_PLATFORM_ID_TO_KEY))
      .map(Number)
      .filter(p => Number.isFinite(p) && DEFAULT_PLATFORM_ID_TO_KEY[p]);
  
    const anchorY = SAFE_MARGINS.top + usableH * 0.50;
  
    // Agrupamos por plataforma
    const grouped = {};
    for (const item of filtered) {
      if (!item || !Number.isFinite(item.platformId)) continue;
      if (!grouped[item.platformId]) grouped[item.platformId] = [];
      grouped[item.platformId].push(item);
    }
  
    const totalItems = filtered.length;
    const totalClusterWidth = Math.min(usableW * 0.75, totalItems * 25); // 25 px por ítem aprox
    const spacePerItem = totalClusterWidth / totalItems;
    const startX = SAFE_MARGINS.left + (usableW - totalClusterWidth) / 2;
  
    let currentX = startX;
    const PLATFORM_ANCHORS = {};
  
    rawPlatforms.sort((a, b) => a - b).forEach((platformId) => {
      const groupSize = grouped[platformId]?.length || 1;
      const groupWidth = groupSize * spacePerItem;
  
      PLATFORM_ANCHORS[platformId] = {
        x: currentX + groupWidth / 2,
        y: anchorY,
      };
  
      currentX += groupWidth;
    });
  
    dotsRef.current.forEach(d => { d._taken = false; });
  
    const newNodes = [];
    const maxClusterRadius = 60;
  
    for (const [platformId, items] of Object.entries(grouped)) {
      const anchor = PLATFORM_ANCHORS[platformId] || { x: SAFE_MARGINS.left + usableW / 2, y: anchorY };
  
      const dynamicRadius = Math.min(
        maxClusterRadius,
        20 + Math.sqrt(items.length) * 3
      );
  
      for (const item of items) {
        const angle = (pseudoRandom('angle' + item.id) / 4294967295) * 2 * Math.PI;
        const radius = Math.sqrt(pseudoRandom('radius' + item.id) / 4294967295) * dynamicRadius;
        const targetX = anchor.x + Math.cos(angle) * radius;
        const targetY = anchor.y + Math.sin(angle) * radius;
  
        let best = -1, bestDist = Infinity;
        dotsRef.current.forEach((d, i) => {
          if (d._taken) return;
          const dist = Math.hypot(d.cx - targetX, d.cy - targetY);
          if (dist < bestDist) { bestDist = dist; best = i; }
        });
  
        if (best >= 0) {
          dotsRef.current[best]._taken = true;
          newNodes.push({
            id: item.id,
            item,
            gridIndex: best,
            baseR: dotSize,
            color: colorMapping[item.platformKey] || '#9BA3B4'
          });
        }
      }
    }
  
    console.log(`👉 Total nodos visibles: ${newNodes.length}`);
    nodesRef.current = newNodes;
  }, [filtered, filters, colorMapping, dotSize]);
  
  

  useEffect(() => { if (wrapRef.current) layoutNodes(); }, [layoutNodes]);

  /* ---------- Bucle de dibujado en Canvas ---------- */
  useEffect(() => {
    if (!squarePath) return;
    let raf;
    const draw = () => {
      const cvs = canvasRef.current;
      const ctx = cvs?.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, cvs.width, cvs.height);
      const hx = hover ? (dotsRef.current[hover.gridIndex]?.cx ?? -9999) + (dotsRef.current[hover.gridIndex]?.xOffset ?? 0) : -9999;
      const hy = hover ? (dotsRef.current[hover.gridIndex]?.cy ?? -9999) + (dotsRef.current[hover.gridIndex]?.yOffset ?? 0) : -9999;

      dotsRef.current.forEach(dot => {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
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
        ctx.fill(squarePath);
        ctx.restore();
      });

      nodesRef.current.forEach(n => {
        const dot = dotsRef.current[n.gridIndex];
        if (!dot) return;
        const isHover = hover?.gridIndex === n.gridIndex;
        const isActive = active?.gridIndex === n.gridIndex;
        const x = dot.cx + dot.xOffset;
        const y = dot.cy + dot.yOffset;
        const R = n.baseR * (isHover ? hoverScale : 1);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(R / 2, R / 2);
        ctx.fillStyle = n.color;
        ctx.fill(squarePath);
        ctx.restore();

        if (isHover || isActive) {
          const side = (R / 2) * 1.2 * 2;
          const offsetX = dot.cx + dot.xOffset;
          const offsetY = dot.cy + dot.yOffset;
        
          ctx.beginPath();
          ctx.rect(offsetX - side / 2, offsetY - side / 2, side, side);
          ctx.strokeStyle = isActive ? '#3be9c9' : 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
        
      
      });

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [squarePath, dotSize, baseColor, baseRgb, actRgb, proximity, hover, active, hoverScale]);

  /* ---------- Eventos de Interacción (Ratón) ---------- */
  useEffect(() => {
    const state = { lastTime: 0, lastX: 0, lastY: 0 };
    const hitTest = (px, py) => {
      for (const n of nodesRef.current) {
        const d = dotsRef.current[n.gridIndex];
        if (!d) continue;
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
      state.lastTime = now;
      state.lastX = e.clientX;
      state.lastY = e.clientY;

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
      
      dotsRef.current.forEach(dot => {
        const dist = Math.hypot(dot.cx - px, dot.cy - py);
        if (dist < shockRadius && !dot._inertia) {
          dot._inertia = true;
          gsap.killTweensOf(dot);
          const falloff = Math.max(0, 1 - dist / shockRadius);
          const pushX = (dot.cx - px) * shockStrength * falloff;
          const pushY = (dot.cy - py) * shockStrength * falloff;
          gsap.to(dot, {
            inertia: { xOffset: pushX, yOffset: pushY, resistance },
            onComplete: () => {
              gsap.to(dot, {
                xOffset: 0, yOffset: 0,
                duration: returnDuration, ease: 'elastic.out(1,0.75)'
              });
              dot._inertia = false;
            }
          });
        }
      });
      
      const n = hitTest(px, py);
      setActive(n);
      if (n) onSelect?.(n.item);
    };

    const el = canvasRef.current;
    if (!el) return;
    const tm = throttle(onMove, 16);
    el.addEventListener('mousemove', tm, { passive: true });
    el.addEventListener('click', onClick);
    el.addEventListener("mouseleave", () => setHover(null));
    return () => {
      el.removeEventListener('mousemove', tm);
      el.removeEventListener('click', onClick);
      el.removeEventListener("mouseleave", () => setHover(null));
    };
  }, [resistance, returnDuration, speedTrigger, proximity, onSelect, hitTestPadding, shockRadius, shockStrength]);

  /* ---------- Eventos Externos (para limpiar estado activo) ---------- */
  useEffect(() => {
    const off = e => { if (e.detail === 'DATADOTGRID_CLEAR_ACTIVE') setActive(null); };
    window.addEventListener('datadotgrid', off);
    return () => window.removeEventListener('datadotgrid', off);
  }, []);

  /* ---------- Lógica del Tooltip ---------- */
  useEffect(() => {
    if (!hover || !hover.item || active) {
      setTooltip(null);
      return;
    }

    const dot = dotsRef.current[hover.gridIndex];
    if (dot) {
      const sourceX = dot.cx + dot.xOffset;
      const sourceY = dot.cy + dot.yOffset;
      
      setTooltip(prev => {
        //  'prev?.item?.id' por si 'prev.item' tampoco existiera.
        if (prev?.item?.id === hover.item.id) {
          return { ...prev, sourceX, sourceY };
        }
        return { item: hover.item, sourceX, sourceY };
      });
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
      
      setTooltip(prev => ({
        ...prev,
        style: { left: `${finalX}px`, top: `${finalY}px` },
        lineEndX,
        lineEndY: finalY + tipRect.height / 2
      }));
    }
  }, [tooltip, tooltipOffset]);

  /* ---------- Renderizado JSX ---------- */
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <div ref={wrapRef} style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, cursor: 'crosshair' }} />
        {tooltip?.item && (
          <>
            {tooltip.style && (
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 100 }}>
                <line
                  x1={tooltip.sourceX} y1={tooltip.sourceY}
                  x2={tooltip.lineEndX} y2={tooltip.lineEndY}
                  stroke="#19258D" strokeWidth="4"
                />
              </svg>
            )}
            <div
              ref={tooltipRef}
              style={{
                position: 'absolute',
                background: '#0e1861cf',
                border: '10px solid #19258D',
                padding: '20px',
                color: '#cfe8ff',
                pointerEvents: 'none',
                maxWidth: 280,
                zIndex: 101,
                boxShadow: '0 6px 20px rgba(0,0,0,0.35)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                opacity: tooltip.style ? 1 : 0,
                left: tooltip.style ? tooltip.style.left : '-9999px',
                top: tooltip.style ? tooltip.style.top : '0px',
              }}
            >
              <div style={{ color: '#B5EBF8', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {DEFAULT_PLATFORM_ID_TO_KEY[tooltip.item?.platformId]}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {typeof tooltip.item?.rank === 'number' && tooltip.item?.platformId === 1 && (
                  <div style={{ background: '#a9fdee', color: 'rgb(17, 20, 35)', padding: '8px', fontWeight: 'bold', fontSize: '16px', lineHeight: 1 }}>
                    #{tooltip.item.rank}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '16px' }}>
                    {tooltip.item?.title}
                  </div>
                  {tooltip.item?.artists && (
                    <div style={{ color: 'rgba(216, 225, 255, 0.7)', fontSize: '14px' }}>
                      {tooltip.item.artists}
                    </div>
                  )}
                </div>
              </div>
              {tooltip.item?.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tooltip.item.tags.slice(0, 5).map((t, i) => (
                    <span key={i} style={{ fontSize: 11, background: 'rgba(82,39,255,0.15)', border: '1px solid rgba(82,39,255,0.4)', padding: '2px 6px', borderRadius: 999 }}>
                      {t}
                    </span>
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