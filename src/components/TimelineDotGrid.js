'use client';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import '../styles/filters.css';
import { 
    colorMapping as globalColorMapping, 
    DEFAULT_PLATFORM_ID_TO_KEY,
    TIME_ID_TO_BUCKET,
    AWARENESS_LEVEL_TO_KEY 
} from '../utils/globalConfig'; 



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
    baseDotSize = 12,
    baseGap = 10,
    baseColor = '#1B1F3A',
    hitTestPadding = 15,
    hoverScale = 1.2,
    tooltipOffset = { x: 30, y: 0 },
    colorMapping = globalColorMapping,
    onSelect,
    onZoomChange,
    organization = 'all',
}) {
    const wrapRef = useRef(null);
    const canvasRef = useRef(null);
    const tooltipRef = useRef(null);
    const dotsRef = useRef([])  ; 
    const nodesRef = useRef([]);
    const gridMetricsRef = useRef({});

    const [hover, setHover] = useState(null);
    const [active, setActive] = useState(null);
    const [tooltip, setTooltip] = useState(null);
    const [view, setView] = useState({ zoom: 0.5 });
    const squarePath = useMemo(() => {
      if (typeof window === 'undefined') return null;
      const p = new window.Path2D();
      p.rect(-1, -1, 2, 2); // cuadrado centrado
      return p;
    }, []);
  
    // SE HA COMBINADO LA LÓGICA DE LAYOUT DEL CÓDIGO NUEVO
    // CON LA LÓGICA DE ZOOM DEL CÓDIGO ANTIGUO
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

        // La rejilla de fondo ahora SIEMPRE se calcula con el zoom actual (comportamiento original)
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
            ...d, 
            id: d.id ?? `${d.platformId}-${Math.random()}`, 
            level: d.awareness ?? d.level ?? 1,
            timeBucket: d.timeBucket ?? TIME_ID_TO_BUCKET[d.time] ?? '4w',
            platformKey: DEFAULT_PLATFORM_ID_TO_KEY[d.platformId] ?? 'OTHER',
        }));

        const padding = { top: 60, right: 120, bottom: 120, left: 120 };
        const drawableWidth = Math.max(0, width - padding.left - padding.right);
        const drawableHeight = Math.max(0, height - padding.top - padding.bottom);

        const availableDots = new Set(allDots.map((_, i) => i));
        const newNodes = [];

        let anchors = {};
        let CLUSTER_RADIUS;

        switch (organization) {
            case 'time':
            case 'awareness': {
                const keys = organization === 'time' 
                    ? Object.values(TIME_ID_TO_BUCKET)
                    : Object.values(AWARENESS_LEVEL_TO_KEY);
                
                const numClusters = keys.length > 0 ? keys.length : 1;
                const clusterCellWidth = drawableWidth / numClusters;
                
                CLUSTER_RADIUS = Math.min(clusterCellWidth, drawableHeight) * 0.4;
                
                keys.forEach((key, index) => {
                    anchors[key] = { 
                        x: padding.left + clusterCellWidth * (index + 0.5), 
                        y: padding.top + drawableHeight / 2 
                    };
                });
                break;
            }
            case 'platform': {
              const platformKeys = [...new Set(normalizedData.map(d => d.platformKey))].sort();
              const numClusters = platformKeys.length > 0 ? platformKeys.length : 1;
          
              const maxPerRow = Math.max(5, Math.ceil(Math.sqrt(numClusters)));
              const numGridRows = Math.ceil(numClusters / maxPerRow);
              const numGridCols = Math.ceil(numClusters / numGridRows);
          
              const cellWidth = drawableWidth / numGridCols;
              const cellHeight = drawableHeight / numGridRows;
          
              // Paso 1: contar cuántos datos hay por plataforma
              const platformCounts = {};
              platformKeys.forEach(key => platformCounts[key] = 0);
              normalizedData.forEach(d => platformCounts[d.platformKey]++);
          
              // Paso 2: calcular radio proporcional al tamaño
              const maxCount = Math.max(...Object.values(platformCounts));
              const minCount = Math.min(...Object.values(platformCounts));
              const MIN_RADIUS = Math.min(cellWidth, cellHeight) * 0.15;
              const MAX_RADIUS = Math.min(cellWidth, cellHeight) * 0.4;
          
              anchors = {};
              CLUSTER_RADIUS = {}; // ahora es un objeto por plataforma
          
              platformKeys.forEach((key, index) => {
                  const rowIndex = Math.floor(index / numGridCols);
                  const colIndex = index % numGridCols;
          
                  anchors[key] = {
                      x: padding.left + cellWidth * (colIndex + 0.5),
                      y: padding.top + cellHeight * (rowIndex + 0.5),
                  };
          
                  const count = platformCounts[key];
                  const radiusScale = (count - minCount) / Math.max(1, maxCount - minCount);
                  CLUSTER_RADIUS[key] = MIN_RADIUS + radiusScale * (MAX_RADIUS - MIN_RADIUS);
              });
              break;
          }
          
          case 'all':
            default: {
                const numCols = 3;
                const numRows = 3;
            
                const spacingFactorX = 0.45; // ya estaba bien
                const spacingFactorY = 0.65; // 💥 más separación vertical
            
                const cellWidth = drawableWidth / numCols;
                const cellHeight = drawableHeight / numRows;
            
                const effectiveCellWidth = cellWidth * (1 - spacingFactorX);
                const effectiveCellHeight = cellHeight * (1 - spacingFactorY);
            
                const offsetX = (cellWidth - effectiveCellWidth) / 2;
                const offsetY = (cellHeight - effectiveCellHeight) / 2;
            
                
                CLUSTER_RADIUS = Math.min(effectiveCellWidth, effectiveCellHeight) * 0.22;
            
                const awarenessLevels = [1, 2, 3]; // filas
                const timeBuckets = ['4w', '6m', '1y']; // columnas
            
                anchors = {};
                awarenessLevels.forEach((level, rowIndex) => {
                    timeBuckets.forEach((bucket, colIndex) => {
                        const key = `${level}-${bucket}`;
                        anchors[key] = {
                            x: padding.left + colIndex * cellWidth + offsetX + effectiveCellWidth / 2,
                            y: padding.top + rowIndex * cellHeight + offsetY + effectiveCellHeight / 2,
                        };
                    });
                });
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
            const radius = Math.sqrt(pseudoRandom('radius' + item.id) / 4294967295) * (
              organization === 'platform' ? CLUSTER_RADIUS[item.platformKey] : CLUSTER_RADIUS
          );
                      const targetX = anchor.x + Math.cos(angle) * radius;
            const targetY = anchor.y + Math.sin(angle) * radius;

            const { cols, cell, startX, startY } = gridMetricsRef.current;
            const guessX = Math.round((targetX - startX) / cell);
            const guessY = Math.round((targetY - startY) / cell);
            let bestIndex = -1;
            
            for (let r = 0; r < 25 && bestIndex === -1; r++) {
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

    // SE RESTAURA LA DEPENDENCIA DE view.zoom, como en el código original
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

            ctx.fillStyle = baseColor;
            dotsRef.current.forEach(dot => {
                ctx.save();
                ctx.translate(dot.cx, dot.cy);
                ctx.scale(baseDotSize / 4, baseDotSize / 4);
                ctx.fill(squarePath);
                ctx.restore();
            });

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
                ctx.fill(squarePath);
                ctx.restore();

                if (isHover || isActive) {
                  const side = (R / 2) * 1.2 * 2;
                  ctx.beginPath();
                  ctx.rect(dot.cx - side / 2, dot.cy - side / 2, side, side);
                  ctx.strokeStyle = isActive ? '#3be9c9' : 'rgba(255,255,255,0.85)';
                  ctx.lineWidth = 2; // El grosor del borde vuelve a ser fijo, como en el original
                  ctx.stroke();
              }
            });
            rafId = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(rafId);
    }, [view, hover, active, squarePath, hoverScale, baseDotSize, baseColor]);
  
    useEffect(() => {
        const el = canvasRef.current;
        if (!el) return;
        
        const hitTest = (mouseX, mouseY) => {
            const currentDotSize = baseDotSize * view.zoom;
            const hitAreaHalfSide = (currentDotSize / 2) + hitTestPadding;
            for (let i = nodesRef.current.length - 1; i >= 0; i--) {
                const n = nodesRef.current[i];
                const d = dotsRef.current[n.gridIndex];
                if (!d) continue;

                const dx = Math.abs(mouseX - d.cx);
                const dy = Math.abs(mouseY - d.cy);

                if (dx < hitAreaHalfSide && dy < hitAreaHalfSide) {
                    return n;
                }
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
      if (!hover || !hover.item) { 
        setTooltip(null); 
        return; 
      }
    
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
                      <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '20px' }}>
                        {tooltip.item?.title}
                      </div>
                      {tooltip.item?.artists && (
                        <div style={{ color: 'rgba(216, 225, 255, 0.7)', fontSize: '16px' }}>
                          {tooltip.item.artists}
                        </div>
                      )}
                    </div>
                  </div>
                  {tooltip.item?.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {tooltip.item.tags.slice(0, 5).map((t, i) => (
                        <span key={i} style={{ fontSize: 16, background: 'rgba(82,39,255,0.15)', border: '1px solid rgba(82,39,255,0.4)', padding: '2px 6px', borderRadius: 999 }}>
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