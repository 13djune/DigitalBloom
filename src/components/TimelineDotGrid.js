'use client';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import '../styles/filters.css';

gsap.registerPlugin(InertiaPlugin);

/* ---------- CONSTANTES Y MAPEOS ---------- */
const DEFAULT_PLATFORM_ID_TO_KEY = { 1: 'SPOTIFY', 2: 'YOUTUBE', 3: 'TIKTOK', 4: 'INSTAGRAM', 5: 'IPHONE', 6: 'WHATSAPP', 7: 'STREAMING', 8: 'GOOGLE' };
const TIME_ID_TO_BUCKET = { 1: '4w', 2: '6m', 3: '1y' };

/* ---------- FUNCIONES UTILITARIAS ---------- */
const hexToRgb = hex => {
  const m = hex?.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
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


/* ---------- COMPONENTE PRINCIPAL: TIMELINE ---------- */
export default function TimelineDotGrid({
  data = [],
  dotSize = 8,
  gap = 18,
  baseColor = '#1B1F3A',
  activeColor = '#19258D',
  proximity = 100,
  resistance = 700,
  returnDuration = 1.25,
  hitTestPadding = 15,
  hoverScale = 1.2,
  tooltipOffset = { x: 30, y: 0 },
  shockRadius = 250,
  shockStrength = 5,
  colorMapping = { SPOTIFY: '#5ffd79', YOUTUBE: '#FF5353', TIKTOK: '#8170ff', INSTAGRAM: '#fb96e2', IPHONE: '#f2fb73', WHATSAPP: '#44be56', STREAMING: '#ffa536', GOOGLE: '#4285F4' },
  onSelect,
  onZoomChange,
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  const dotsRef = useRef([]);
  const nodesRef = useRef([]);
  const [hover, setHover] = useState(null);
  const [active, setActive] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const [view, setView] = useState({ x: 0, y: 0, zoom: 1 });
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const actRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const p = new window.Path2D();
    p.arc(0, 0, 1, 0, Math.PI * 2);
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

  const layoutNodes = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap || !Array.isArray(data)) return;

    const { width, height } = wrap.getBoundingClientRect();
    const lanes = { 1: height * 0.25, 2: height * 0.50, 3: height * 0.75 };
    const timeAnchors = { '4w': width * 0.2, '6m': width * 0.5, '1y': width * 0.8 };
    const CLUSTER_RADIUS = Math.min(width, height) * 0.1;

    dotsRef.current.forEach(d => { d._taken = false; });
    const newNodes = [];
    
    const normalizedData = data.map(d => ({
        ...d,
        id: d.id ?? `${d.platformId}-${Math.random()}`,
        level: d.awareness ?? d.level ?? 1,
        timeBucket: d.timeBucket ?? TIME_ID_TO_BUCKET[d.time] ?? '4w',
        platformKey: DEFAULT_PLATFORM_ID_TO_KEY[d.platformId] ?? 'UNKNOWN',
    }));

    for (const item of normalizedData) {
      if (!item || !lanes[item.level] || !timeAnchors[item.timeBucket]) continue;

      const anchorY = lanes[item.level];
      const anchorX = timeAnchors[item.timeBucket];
      
      const angle = (pseudoRandom('angle' + item.id) / 4294967295) * 2 * Math.PI;
      const radius = Math.sqrt(pseudoRandom('radius' + item.id) / 4294967295) * CLUSTER_RADIUS;
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
          id: item.id, item, gridIndex: best, baseR: dotSize,
          color: colorMapping[item.platformKey] || '#9BA3B4'
        });
      }
    }
    nodesRef.current = newNodes;
  }, [data, dotSize, colorMapping]);

  useEffect(() => { if (wrapRef.current) layoutNodes(); }, [layoutNodes, data]);

  useEffect(() => {
    if (!circlePath) return;
    let raf;
    const draw = () => {
      const cvs = canvasRef.current;
      const ctx = cvs?.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, cvs.width, cvs.height);
      ctx.save();
      
      ctx.translate(view.x, view.y);
      ctx.scale(view.zoom, view.zoom);

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
        ctx.fill(circlePath);
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
        ctx.fill(circlePath);
        ctx.restore();

        if (isHover || isActive) {
          ctx.beginPath();
          ctx.arc(x, y, (R / 2) * 0.85, 0, Math.PI * 2);
          ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 2 / view.zoom;
          ctx.stroke();
        }
      });
      
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [circlePath, dotSize, baseColor, baseRgb, actRgb, proximity, hover, active, hoverScale, view]);

  const screenToWorld = useCallback((px, py) => ({
    x: (px - view.x) / view.zoom,
    y: (py - view.y) / view.zoom,
  }), [view]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    const hitTest = (worldX, worldY) => {
      for (const n of nodesRef.current) {
        const d = dotsRef.current[n.gridIndex];
        if (!d) continue;
        const dsq = Math.hypot(worldX - (d.cx + d.xOffset), worldY - (d.cy + d.yOffset));
        if (dsq < (n.baseR / 2) + hitTestPadding) return n;
      }
      return null;
    };
    
    const onMove = e => {
      const rect = el.getBoundingClientRect();
      const { x: worldX, y: worldY } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      setHover(hitTest(worldX, worldY));
    };
    
    const onClick = e => {
      const rect = el.getBoundingClientRect();
      const { x: worldX, y: worldY } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      
      dotsRef.current.forEach(dot => {
        const dist = Math.hypot(dot.cx - worldX, dot.cy - worldY);
        if (dist < shockRadius && !dot._inertia) {
          dot._inertia = true;
          gsap.killTweensOf(dot);
          const falloff = Math.max(0, 1 - dist / shockRadius);
          const pushX = (dot.cx - worldX) * shockStrength * falloff;
          const pushY = (dot.cy - worldY) * shockStrength * falloff;
          gsap.to(dot, {
            inertia: { xOffset: pushX, yOffset: pushY, resistance },
            onComplete: () => {
              gsap.to(dot, { xOffset: 0, yOffset: 0, duration: returnDuration, ease: 'elastic.out(1,0.75)' });
              dot._inertia = false;
            }
          });
        }
      });
      
      const n = hitTest(worldX, worldY);
      setActive(n);
      if (n) onSelect?.(n.item);
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('click', onClick);
    el.addEventListener("mouseleave", () => setHover(null));
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('click', onClick);
      el.removeEventListener("mouseleave", () => setHover(null));
    };
  }, [resistance, returnDuration, onSelect, hitTestPadding, shockRadius, shockStrength, screenToWorld]);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const handleWheel = e => {
      e.preventDefault();
      const rect = cvs.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const zoomFactor = e.deltaY > 0 ? 1 / 1.15 : 1.15;

      setView(prev => {
        const newZoom = Math.max(0.2, Math.min(5, prev.zoom * zoomFactor));
        const newX = mouseX - (mouseX - prev.x) * (newZoom / prev.zoom);
        const newY = mouseY - (mouseY - prev.y) * (newZoom / prev.zoom);
        return { x: newX, y: newY, zoom: newZoom };
      });
    };

    const handleMouseDown = e => { isDraggingRef.current = true; lastPosRef.current = { x: e.clientX, y: e.clientY }; cvs.style.cursor = 'grabbing'; };
    const handleMouseUp = () => { isDraggingRef.current = false; cvs.style.cursor = 'grab'; };
    const handleMouseMove = e => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      setView(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    };

    cvs.style.cursor = 'grab';
    cvs.addEventListener('wheel', handleWheel, { passive: false });
    cvs.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cvs.style.cursor = 'default';
      cvs.removeEventListener('wheel', handleWheel);
      cvs.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    if (onZoomChange) {
      onZoomChange.current = (factor) => {
        const { width, height } = canvasRef.current.getBoundingClientRect();
        const centerX = width / 2, centerY = height / 2;
        setView(prev => {
          const newZoom = Math.max(0.2, Math.min(5, prev.zoom * factor));
          const newX = centerX - (centerX - prev.x) * (newZoom / prev.zoom);
          const newY = centerY - (centerY - prev.y) * (newZoom / prev.zoom);
          return { x: newX, y: newY, zoom: newZoom };
        });
      };
    }
  }, [onZoomChange]);
  
  useEffect(() => {
    if (!hover || !hover.item || active) { setTooltip(null); return; }
    const dot = dotsRef.current[hover.gridIndex];
    if (dot) {
      const worldX = dot.cx + dot.xOffset;
      const worldY = dot.cy + dot.yOffset;
      const sourceX = worldX * view.zoom + view.x;
      const sourceY = worldY * view.zoom + view.y;
      setTooltip(prev => (prev?.item?.id === hover.item.id) ? { ...prev, sourceX, sourceY } : { item: hover.item, sourceX, sourceY });
    }
  }, [hover, active, view]);

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
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0 }} />
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