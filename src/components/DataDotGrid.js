'use client';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import '../styles/filters.css';

import { 
    colorMapping as globalColorMapping,
    DEFAULT_PLATFORM_ID_TO_KEY,
    TIME_ID_TO_BUCKET
} from '../utils/globalConfig';

gsap.registerPlugin(InertiaPlugin);

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

export default function DataDotGrid({
  data = [],
  filters,
  dotSize = 12,
  gap = 12,
  baseColor = '#1B1F3A',
  activeColor = '#C7F0FA',
  proximity = 120,
  speedTrigger = 120,
  resistance = 700,
  returnDuration = 1.25,
  hitTestPadding = 15,
  hoverScale = 1.2,
  tooltipOffset = { x: 30, y: 0 },
  shockRadius = 250,
  shockStrength = 5,
  colorMapping = globalColorMapping,
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
    p.rect(-1, -1, 2, 2);
    return p;
  }, []);

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

  const layoutNodes = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || !filters) return;

    const { width, height } = wrap.getBoundingClientRect();
    const SAFE_MARGINS = { top: 180, bottom: 200, left: 180, right: 180 }; 
    const usableW = Math.max(320, width - SAFE_MARGINS.left - SAFE_MARGINS.right);
    const usableH = Math.max(240, height - SAFE_MARGINS.top - SAFE_MARGINS.bottom);
    const centerX = usableW / 2;
    const centerY = usableH / 2;
    
    const grouped = {};
    for (const item of filtered) {
        if (!grouped[item.platformId]) grouped[item.platformId] = [];
        grouped[item.platformId].push(item);
    }
    
    const clusters = Object.entries(grouped).map(([platformId, items]) => {
      const radius = 30 + Math.sqrt(items.length) * 9; 
      return {
        id: platformId,
        items,
        radius: radius,
        x: centerX + (pseudoRandom('initX' + platformId) / 4294967295 - 0.5) * (usableW * 0.1), 
        y: centerY + (pseudoRandom('initY' + platformId) / 4294967295 - 0.5) * (usableH * 0.1),
      };
    });

    const iterations = 300;
    const baseSeparationPadding = 80;
    const separationForceFactor = 1.0;
    const boundaryStrength = 0.003;

    for (let i = 0; i < iterations; i++) {
        for (let j = 0; j < clusters.length; j++) {
            for (let k = j + 1; k < clusters.length; k++) {
                const c1 = clusters[j];
                const c2 = clusters[k];
                const dx = c2.x - c1.x;
                const dy = c2.y - c1.y;
                let dist = Math.hypot(dx, dy);
                if (dist === 0) dist = 0.001; 
                
                const min_dist = c1.radius + c2.radius + baseSeparationPadding;

                if (dist < min_dist) {
                    const angle = Math.atan2(dy, dx);
                    const overlap = (min_dist - dist) * separationForceFactor;
                    const pushX = Math.cos(angle) * overlap;
                    const pushY = Math.sin(angle) * overlap;
                    
                    c1.x -= pushX / 2;
                    c1.y -= pushY / 2;
                    c2.x += pushX / 2;
                    c2.y += pushY / 2;
                }
            }
        }

        clusters.forEach(c => {
            const toCenterX = centerX - c.x;
            const toCenterY = centerY - c.y;
            c.x += toCenterX * boundaryStrength; 
            c.y += toCenterY * boundaryStrength;

            c.x = Math.max(c.radius, Math.min(usableW - c.radius, c.x));
            c.y = Math.max(c.radius, Math.min(usableH - c.radius, c.y));
        });
    }

    dotsRef.current.forEach(d => { d._taken = false; });
    const newNodes = [];

    for (const cluster of clusters) {
        const anchorX = cluster.x + SAFE_MARGINS.left;
        const anchorY = cluster.y + SAFE_MARGINS.top;
        const placementRadius = cluster.radius * 0.85;

        for (const item of cluster.items) {
            const angle = (pseudoRandom('angle' + item.id) / 4294967295) * 2 * Math.PI;
            const radius = Math.sqrt(pseudoRandom('radius' + item.id) / 4294967295) * placementRadius;
            const targetX = anchorX + Math.cos(angle) * radius;
            const targetY = anchorY + Math.sin(angle) * radius;

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

    nodesRef.current = newNodes;
  }, [filtered, filters, colorMapping, dotSize]);


  useEffect(() => { if (wrapRef.current) layoutNodes(); }, [layoutNodes]);

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
          ctx.beginPath();
          ctx.rect(x - side / 2, y - side / 2, side, side);
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

  useEffect(() => {
    const state = { lastTime: 0, lastX: 0, lastY: 0 };
    const hitTest = (px, py) => {
      for (const n of nodesRef.current) {
        const d = dotsRef.current[n.gridIndex];
        if (!d) continue;
        const halfSide = (n.baseR / 2) + hitTestPadding;
        const dx = Math.abs(px - (d.cx + d.xOffset));
        const dy = Math.abs(py - (d.cy + d.yOffset));
        if (dx < halfSide && dy < halfSide) return n;
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

  useEffect(() => {
    const off = e => { if (e.detail === 'DATADOTGRID_CLEAR_ACTIVE') setActive(null); };
    window.addEventListener('datadotgrid', off);
    return () => window.removeEventListener('datadotgrid', off);
  }, []);

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
                background: '#0e1861c5',
                border: '10px solid #19258D',
                padding: '24px',
                color: '#cfe8ff',
                pointerEvents: 'none',
                maxWidth: 285,
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
                  <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '20px' }}>
                    {tooltip.item?.title}
                  </div>
                  {tooltip.item?.artists && (
                    <div style={{ color: 'rgba(216, 225, 255, 0.9)', fontSize: '16px' }}>
                      {tooltip.item.artists}
                    </div>
                  )}
                </div>
              </div>
              {tooltip.item?.tags?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tooltip.item.tags.slice(0, 5).map((t, i) => (
                    <span key={i} style={{ fontSize: 16, background: 'rgba(82,39,255,0.3)', border: '1px solid rgba(82,39,255,0.4)', padding: '2px 6px', borderRadius: 999 }}>
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