'use client';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
// import { gsap } from 'gsap'; // Descomenta esta línea si quieres añadir animaciones de transición
import '../styles/filters.css';

/* ---------- CONSTANTES Y MAPEOS ---------- */
const DEFAULT_PLATFORM_ID_TO_KEY = { 1: 'SPOTIFY', 2: 'YOUTUBE', 3: 'TIKTOK', 4: 'INSTAGRAM', 5: 'IPHONE', 6: 'WHATSAPP', 7: 'STREAMING', 8: 'GOOGLE' };
const TIME_ID_TO_BUCKET = { 1: '4w', 2: '6m', 3: '1y' };
const AWARENESS_LEVEL_TO_KEY = { 1: 'DESEO', 2: 'CUERPO', 3: 'RASTRO' };

/* ---------- FUNCIONES UTILITARIAS ---------- */
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
    baseDotSize = 8,
    baseGap = 12,
    baseColor = '#1B1F3A',
    hitTestPadding = 15,
    hoverScale = 1.2,
    tooltipOffset = { x: 30, y: 0 },
    colorMapping = {
        SPOTIFY: '#22FF8E', YOUTUBE: '#FF5F5F', TIKTOK: '#A184FF', INSTAGRAM: '#FF8EDB',
        IPHONE: '#F5F84E', WHATSAPP: '#148500', STREAMING: '#FFBA3B', GOOGLE: '#77a9fa'
    },
    onSelect,
    onZoomChange,
    organization = 'all',
}) {
    const wrapRef = useRef(null);
    const canvasRef = useRef(null);
    const tooltipRef = useRef(null);
    const dotsRef = useRef([]); 
    const nodesRef = useRef([]);
    const gridMetricsRef = useRef({}); // Para optimizar la búsqueda de puntos

    const [hover, setHover] = useState(null);
    const [active, setActive] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    const [view, setView] = useState({ zoom: 1 });

    const circlePath = useMemo(() => {
        if (typeof window === 'undefined') return null;
        const p = new window.Path2D();
        p.arc(0, 0, 1, 0, Math.PI * 2);
        return p;
    }, []);

    const buildAndLayout = useCallback(() => {
        const wrap = wrapRef.current;
        const cvs = canvasRef.current;
        if (!wrap || !cvs || !Array.isArray(data)) return;

        const { width, height } = wrap.getBoundingClientRect();
        if (width === 0) return;

        const dpr = window.devicePixelRatio || 1;
        cvs.width = width * dpr;
        cvs.height = height * dpr;
        cvs.style.width = `${width}px`;
        cvs.style.height = `${height}px`;
        const ctx = cvs.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        const currentDotSize = baseDotSize * view.zoom;
        const currentGap = baseGap * view.zoom;
        const cell = currentDotSize + currentGap;
        const cols = Math.floor((width + currentGap) / cell);
        const rows = Math.floor((height + currentGap) / cell);
        const gridW = cell * cols - currentGap;
        const gridH = cell * rows - currentGap;
        const startX = (width - gridW) / 2 + currentDotSize / 2;
        const startY = (height - gridH) / 2 + currentDotSize / 2;
        
        const allDots = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                allDots.push({ cx: startX + x * cell, cy: startY + y * cell });
            }
        }
        dotsRef.current = allDots;
        gridMetricsRef.current = { cols, rows, cell, startX, startY };

        const normalizedData = data.map(d => ({
            ...d, id: d.id ?? `${d.platformId}-${Math.random()}`, level: d.awareness ?? d.level ?? 1,
            timeBucket: d.timeBucket ?? TIME_ID_TO_BUCKET[d.time] ?? '4w',
            platformKey: DEFAULT_PLATFORM_ID_TO_KEY[d.platformId] ?? 'UNKNOWN',
        }));

        const availableDots = new Set(allDots.map((_, i) => i));
        const newNodes = [];

        let anchors = {};
        const CLUSTER_RADIUS = Math.min(width, height) * 0.1;

        switch (organization) {
            case 'time': {
                const timeKeys = Object.values(TIME_ID_TO_BUCKET);
                timeKeys.forEach((key, index) => {
                    anchors[key] = { x: width * (index + 1) / (timeKeys.length + 1), y: height / 2 };
                });
                break;
            }
            case 'awareness': {
                const awarenessKeys = Object.values(AWARENESS_LEVEL_TO_KEY);
                awarenessKeys.forEach((key, index) => {
                    anchors[key] = { x: width * (index + 1) / (awarenessKeys.length + 1), y: height / 2 };
                });
                break;
            }
            case 'platform': {
                const platformKeys = [...new Set(normalizedData.map(d => d.platformKey))].sort();
                platformKeys.forEach((key, index) => {
                    anchors[key] = { x: width * (index + 1) / (platformKeys.length + 1), y: height / 2 };
                });
                break;
            }
            case 'all':
            default: {
                anchors = {
                '1-4w': { x: width * 0.2, y: height * 0.25 }, '1-6m': { x: width * 0.5, y: height * 0.25 }, '1-1y': { x: width * 0.8, y: height * 0.25 },
                '2-4w': { x: width * 0.2, y: height * 0.50 }, '2-6m': { x: width * 0.5, y: height * 0.50 }, '2-1y': { x: width * 0.8, y: height * 0.50 },
                '3-4w': { x: width * 0.2, y: height * 0.75 }, '3-6m': { x: width * 0.5, y: height * 0.75 }, '3-1y': { x: width * 0.8, y: height * 0.75 },
                };
                break;
            }
        }

        for (const item of normalizedData) {
            if (availableDots.size === 0) continue;
            let anchor;
            switch (organization) {
                case 'time': anchor = anchors[item.timeBucket]; break;
                case 'awareness': anchor = anchors[AWARENESS_LEVEL_TO_KEY[item.level]]; break;
                case 'platform': anchor = anchors[item.platformKey]; break;
                default: anchor = anchors[`${item.level}-${item.timeBucket}`]; break;
            }
            if (!anchor) continue;
            
            const angle = (pseudoRandom('angle' + item.id) / 4294967295) * 2 * Math.PI;
            const radius = Math.sqrt(pseudoRandom('radius' + item.id) / 4294967295) * CLUSTER_RADIUS;
            const targetX = anchor.x + Math.cos(angle) * radius;
            const targetY = anchor.y + Math.sin(angle) * radius;

            // --- ESTA ES LA OPTIMIZACIÓN CLAVE PARA EL RENDIMIENTO ---
            // En lugar de buscar en miles de puntos, busca en un área pequeña alrededor del objetivo.
            const { cols, cell, startX, startY } = gridMetricsRef.current;
            const guessX = Math.round((targetX - startX) / cell);
            const guessY = Math.round((targetY - startY) / cell);
            let bestIndex = -1;
            
            for (let r = 0; r < 20 && bestIndex === -1; r++) { // Aumentado el radio de búsqueda
                for (let i = -r; i <= r; i++) {
                    for (let j = -r; j <= r; j++) {
                        if (Math.abs(i) !== r && Math.abs(j) !== r) continue;
                        const checkX = guessX + j;
                        const checkY = guessY + i;
                        const checkIndex = checkY * cols + checkX;
                        if (availableDots.has(checkIndex)) {
                            bestIndex = checkIndex;
                            break;
                        }
                    }
                    if (bestIndex !== -1) break;
                }
            }
            
            if (bestIndex !== -1) {
                availableDots.delete(bestIndex);
                newNodes.push({
                    id: item.id, item, gridIndex: bestIndex,
                    color: colorMapping[item.platformKey] || '#9BA3B4'
                });
            }
        }
        nodesRef.current = newNodes;

    }, [data, view.zoom, baseDotSize, baseGap, colorMapping, organization]);

    useEffect(() => {
        buildAndLayout();
        window.addEventListener('resize', buildAndLayout);
        return () => window.removeEventListener('resize', buildAndLayout);
    }, [buildAndLayout]);
    
    useEffect(() => {
        let rafId;
        const draw = () => {
            const cvs = canvasRef.current;
            const ctx = cvs?.getContext('2d');
            if (!ctx) {
                rafId = requestAnimationFrame(draw);
                return;
            }
            
            ctx.clearRect(0, 0, cvs.width, cvs.height);
            const currentDotSize = baseDotSize * view.zoom;

            // 1. DIBUJA LA GRILLA DE FONDO (RÁPIDO Y ALINEADO)
            ctx.fillStyle = baseColor;
            dotsRef.current.forEach(dot => {
                ctx.save();
                ctx.translate(dot.cx, dot.cy);
                ctx.scale(currentDotSize / 4, currentDotSize / 4); // Puntos pequeños
                ctx.fill(circlePath);
                ctx.restore();
            });

            // 2. DIBUJA LOS PUNTOS DE DATOS ENCIMA
            nodesRef.current.forEach(n => {
                const dot = dotsRef.current[n.gridIndex];
                if (!dot) return;
                const isHover = hover?.gridIndex === n.gridIndex;
                const isActive = active?.gridIndex === n.gridIndex;
                const R = currentDotSize * (isHover ? hoverScale : 1);
                
                ctx.save();
                ctx.translate(dot.cx, dot.cy);
                ctx.scale(R / 2, R / 2);
                ctx.fillStyle = n.color;
                ctx.fill(circlePath);
                ctx.restore();

                if (isHover || isActive) {
                    ctx.beginPath();
                    ctx.arc(dot.cx, dot.cy, (R / 2) * 1.2, 0, Math.PI * 2);
                    ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });
            rafId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(rafId);
    }, [view, hover, active, circlePath, hoverScale, baseDotSize, baseColor]);
  
    useEffect(() => {
        const el = canvasRef.current;
        if (!el) return;
        
        const hitTest = (mouseX, mouseY) => {
            const currentDotSize = baseDotSize * view.zoom;
            for (let i = nodesRef.current.length - 1; i >= 0; i--) {
                const n = nodesRef.current[i];
                const d = dotsRef.current[n.gridIndex];
                if (!d) continue;
                const dsq = Math.hypot(mouseX - d.cx, mouseY - d.cy);
                if (dsq < (currentDotSize / 2) + hitTestPadding) return n;
            }
            return null;
        };
        
        const onMove = e => {
            const rect = el.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const hitNode = hitTest(mouseX, mouseY);
            setHover(hitNode);
            el.style.cursor = hitNode ? 'pointer' : 'default';
        };
        
        const onClick = e => {
            const rect = el.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const n = hitTest(mouseX, mouseY);
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
    }, [view.zoom, onSelect, hitTestPadding, baseDotSize]);

    useEffect(() => {
      const cvs = canvasRef.current;
      if (!cvs) return;
  
      const handleWheel = e => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1 / 1.1 : 1.1;
        setView(prev => ({ ...prev, zoom: Math.max(0.5, Math.min(5, prev.zoom * zoomFactor)) }));
      };
  
      cvs.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        cvs.removeEventListener('wheel', handleWheel);
      };
    }, []);
  
    useEffect(() => {
      if (onZoomChange) {
        onZoomChange.current = (factor) => {
          setView(prev => ({ ...prev, zoom: Math.max(0.5, Math.min(5, prev.zoom * factor)) }));
        };
      }
    }, [onZoomChange]);
    
    useEffect(() => {
      if (!hover || !hover.item || active) { setTooltip(null); return; }
      const dot = dotsRef.current[hover.gridIndex];
      if (dot) {
        const sourceX = dot.cx;
        const sourceY = dot.cy;
        setTooltip(prev => (prev?.item?.id === hover.item.id) ? { ...prev, sourceX, sourceY } : { item: hover.item, sourceX, sourceY });
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
                    transition: 'opacity 0.2s ease-in-out',
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
