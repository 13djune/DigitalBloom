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

/* ---------- COMPONENTE PRINCIPAL ---------- */
export default function TimelineDotGrid({
    data = [],
    baseDotSize = 12,
    baseGap = 8, 
    baseColor = '#1B1F3A',
    hitTestPadding = 15,
    hoverScale = 1.2,
    colorMapping = globalColorMapping,
    selectedItem = null,
    onSelect,
    onZoomChange,
    organization = 'all',
}) {
    const wrapRef = useRef(null);
    const canvasRef = useRef(null);
    const tooltipRef = useRef(null);
    const lineRef = useRef(null); 
    const dotsRef = useRef([]); 
    const nodesRef = useRef([]);
    
    const contentBounds = useRef({ minX: -100, maxX: 100, minY: -100, maxY: 100 });

    const [hover, setHover] = useState(null);
    const [active, setActive] = useState(null);
    const [tooltipData, setTooltipData] = useState(null); 
    
    const viewRef = useRef({ zoom: 0.5, x: 0, y: 0 });
    const targetViewRef = useRef({ zoom: 0.5, x: 0, y: 0 });

    const isDragging = useRef(false);
    
    // --- NUEVO REF: Guarda dónde empezó EXACTAMENTE el clic para diferenciar Click vs Drag ---
    const dragStartPos = useRef({ x: 0, y: 0 });
    const lastMousePos = useRef({ x: 0, y: 0 });
    
    const requestRef = useRef(null);

    const squarePath = useMemo(() => {
      if (typeof window === 'undefined') return null;
      const p = new window.Path2D();
      p.rect(-1, -1, 2, 2); 
      return p;
    }, []);

    // --- CÁMARA: LÍMITES FÍSICOS ---
    const clampView = useCallback((v, containerWidth, containerHeight) => {
        const minZoom = 0.5; 
        const maxZoom = 3;  

        const zoom = Math.max(minZoom, Math.min(maxZoom, v.zoom));
        const contentW = (contentBounds.current.maxX - contentBounds.current.minX) * zoom;
        const contentH = (contentBounds.current.maxY - contentBounds.current.minY) * zoom;
        
        const padding = 150 * zoom;
        const limitX = Math.max(0, (contentW - containerWidth) / 1 + padding);
        const limitY = Math.max(0, (contentH - containerHeight) / 2 + padding);

        return {
            zoom,
            x: Math.max(-limitX, Math.min(limitX, v.x)),
            y: Math.max(-limitY, Math.min(limitY, v.y))
        };
    }, []);

    const buildAndLayout = useCallback(() => {
        const wrap = wrapRef.current;
        const cvs = canvasRef.current;
        if (!wrap || !cvs || !Array.isArray(data)) return;

        const { width: winW, height: winH } = wrap.getBoundingClientRect();
        const ratio = window.devicePixelRatio || 1;
        cvs.width = winW * ratio;
        cvs.height = winH * ratio;
        cvs.style.width = `${winW}px`;
        cvs.style.height = `${winH}px`;

        const cell = baseDotSize + baseGap;
        const cols = 300; 
        const rows = 250;
        const startX = -(cols * cell) / 2;
        const startY = -(rows * cell) / 2;
        
        const allDots = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                allDots.push({ cx: startX + x * cell, cy: startY + y * cell });
            }
        }
        dotsRef.current = allDots;

        const normalizedData = data.map(d => ({
            ...d, 
            id: d.id ?? `${d.platformId}-${Math.random()}`, 
            level: d.awareness ?? d.level ?? 1,
            timeBucket: d.timeBucket ?? TIME_ID_TO_BUCKET[d.time] ?? '4w',
            platformKey: DEFAULT_PLATFORM_ID_TO_KEY[d.platformId] ?? 'OTHER',
        }));

        const occupiedIndices = new Set(); 
        const newNodes = [];
        let anchors = {};
        
        const spreadX = 550; 
        const spreadY = 450;

        if (organization === 'platform') {
            const platformKeys = [...new Set(normalizedData.map(d => d.platformKey))].sort();
            platformKeys.forEach((key, i) => {
                anchors[key] = { 
                    x: (i % 3 - 1) * spreadX, 
                    y: (Math.floor(i / 3) - 1) * spreadY 
                };
            });
        } else if (organization === 'time' || organization === 'awareness') {
            const keys = organization === 'time' ? ['4w', '6m', '1y'] : Object.keys(AWARENESS_LEVEL_TO_KEY);
            keys.forEach((key, i) => { anchors[key] = { x: (i - 1) * spreadX * 1.5, y: 0 }; });
        } else {
            [1, 2, 3].forEach((l, ri) => {
                ['4w', '6m', '1y'].forEach((b, ci) => {
                    anchors[`${l}-${b}`] = { x: (ci - 1) * spreadX, y: (ri - 1) * spreadY };
                });
            });
        }

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

        const spiralOffsets = [];
        const maxRadius = 60; 
        for (let y = -maxRadius; y <= maxRadius; y++) {
            for (let x = -maxRadius; x <= maxRadius; x++) {
                if (x*x + y*y <= maxRadius*maxRadius) {
                    spiralOffsets.push({ x, y, dist: x*x + y*y });
                }
            }
        }
        spiralOffsets.sort((a, b) => a.dist - b.dist);

        const clusters = {};
        for (const item of normalizedData) {
            const key = organization === 'all' ? `${item.level}-${item.timeBucket}` : (organization === 'time' ? item.timeBucket : (organization === 'awareness' ? item.level : item.platformKey));
            if (!clusters[key]) clusters[key] = [];
            clusters[key].push(item);
        }

        Object.keys(clusters).forEach(key => {
            const items = clusters[key];
            const anchor = anchors[key] || { x: 0, y: 0 };
            
            const noiseX = (pseudoRandom(key + 'x') % 40) - 20;
            const noiseY = (pseudoRandom(key + 'y') % 40) - 20;
            
            const centerGX = Math.round((anchor.x + noiseX - startX) / cell);
            const centerGY = Math.round((anchor.y + noiseY - startY) / cell);

            items.sort((a, b) => (a.id > b.id ? 1 : -1));

            for (const item of items) {
                for (let i = 0; i < spiralOffsets.length; i++) {
                    const off = spiralOffsets[i];
                    const gx = centerGX + off.x;
                    const gy = centerGY + off.y;
                    const gridIndex = gy * cols + gx;

                    if (gx >= 0 && gx < cols && gy >= 0 && gy < rows && !occupiedIndices.has(gridIndex)) {
                        occupiedIndices.add(gridIndex);
                        newNodes.push({ 
                            id: item.id, 
                            item, 
                            gridIndex, 
                            color: colorMapping[item.platformKey] || '#9BA3B4' 
                        });
                        
                        const dot = allDots[gridIndex];
                        if (dot) {
                            if (dot.cx < minX) minX = dot.cx;
                            if (dot.cx > maxX) maxX = dot.cx;
                            if (dot.cy < minY) minY = dot.cy;
                            if (dot.cy > maxY) maxY = dot.cy;
                        }
                        break; 
                    }
                }
            }
        });

        nodesRef.current = newNodes;
        contentBounds.current = { minX: minX - 100, maxX: maxX + 100, minY: minY - 100, maxY: maxY + 100 };

    }, [data, baseDotSize, baseGap, colorMapping, organization]);

    useEffect(() => {
        buildAndLayout();
        window.addEventListener('resize', buildAndLayout);
        return () => window.removeEventListener('resize', buildAndLayout);
    }, [buildAndLayout]);
    
    // --- ANIMACIÓN FLUIDA ---
    const flyTo = useCallback((tx, ty, tz) => {
      const cvs = canvasRef.current;
      const width = cvs ? cvs.offsetWidth : 1000;
      const height = cvs ? cvs.offsetHeight : 800;
      const xOffset = width / 6; 
      const targetX = tx - xOffset; 

      const nextTarget = {
          x: targetX,
          y: ty,
          zoom: tz
      };
      
      targetViewRef.current = clampView(nextTarget, width, height);
  }, [clampView]);

    useEffect(() => {
        if (!selectedItem) {
            setActive(null);
            return;
        }

        if (active && active.id === selectedItem.id) return;

        const node = nodesRef.current.find(n => n.id === selectedItem.id);
        
        if (node) {
            setActive(node);
            const dot = dotsRef.current[node.gridIndex];
            if (dot) {
                flyTo(-dot.cx * 1.8, -dot.cy * 1.8, 1.8);
            }
        }
    }, [selectedItem, flyTo, active]);


    // --- LOOP DE DIBUJADO PRINCIPAL (60fps) ---
    useEffect(() => {
        const draw = () => {
            const cvs = canvasRef.current;
            const ctx = cvs?.getContext('2d');
            if (!ctx) {
                requestRef.current = requestAnimationFrame(draw);
                return;
            }

            const target = targetViewRef.current;
            const current = viewRef.current;
            
            const lerpFactor = 0.12; 
            
            current.x += (target.x - current.x) * lerpFactor;
            current.y += (target.y - current.y) * lerpFactor;
            current.zoom += (target.zoom - current.zoom) * lerpFactor;
            
            if (Math.abs(target.x - current.x) < 0.01) current.x = target.x;
            if (Math.abs(target.y - current.y) < 0.01) current.y = target.y;
            if (Math.abs(target.zoom - current.zoom) < 0.001) current.zoom = target.zoom;

            const ratio = window.devicePixelRatio || 1;
            ctx.setTransform(1, 0, 0, 1, 0, 0); 
            ctx.clearRect(0, 0, cvs.width, cvs.height);

            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
            ctx.save();
            ctx.translate(cvs.width/(2*ratio) + current.x, cvs.height/(2*ratio) + current.y);
            ctx.scale(current.zoom, current.zoom);

            ctx.fillStyle = baseColor;
            dotsRef.current.forEach(dot => {
                ctx.save();
                ctx.translate(dot.cx, dot.cy);
                ctx.scale(baseDotSize/4, baseDotSize/4);
                ctx.fill(squarePath);
                ctx.restore();
            });

            nodesRef.current.forEach(n => {
                const dot = dotsRef.current[n.gridIndex];
                if (!dot) return;
                const isHover = hover?.id === n.id;
                const isActive = active?.id === n.id;
                const R = baseDotSize * (isHover ? hoverScale : 1);
                
                ctx.save();
                ctx.translate(dot.cx, dot.cy);
                ctx.scale(R/2, R/2);
                ctx.fillStyle = n.color;
                ctx.fill(squarePath);
                ctx.restore();

                if (isHover || isActive) {
                    const side = (R/2) * 2.4;
                    ctx.strokeStyle = isActive ? '#3be9c9' : 'white';
                    ctx.lineWidth = 2 / current.zoom;
                    ctx.strokeRect(dot.cx - side/2, dot.cy - side/2, side, side);
                }
            });
            ctx.restore();

            if (tooltipRef.current && hover && !isDragging.current) {
                const dot = dotsRef.current[hover.gridIndex];
                if (dot) {
                    const cvsRect = cvs.getBoundingClientRect();
                    const screenX = dot.cx * current.zoom + cvsRect.width/2 + current.x;
                    const screenY = dot.cy * current.zoom + cvsRect.height/2 + current.y;

                    const boxWidth = tooltipRef.current.offsetWidth || 285;
                    const gap = 40; 
                    const overlap = 10; 

                    const isRightSide = screenX + boxWidth + gap < window.innerWidth;
                    
                    let boxX, lineEndX;

                    if (isRightSide) {
                        boxX = screenX + gap;
                        lineEndX = screenX + gap + overlap;
                    } else {
                        boxX = screenX - gap - boxWidth;
                        lineEndX = screenX - gap - overlap;
                    }
                    
                    const boxY = screenY - 100;
                    
                    tooltipRef.current.style.transform = `translate(${boxX}px, ${boxY}px)`;
                    
                    if (lineRef.current) {
                        lineRef.current.setAttribute('x1', screenX);
                        lineRef.current.setAttribute('y1', screenY);
                        lineRef.current.setAttribute('x2', lineEndX); 
                        lineRef.current.setAttribute('y2', screenY - 40);
                    }
                }
            }

            requestRef.current = requestAnimationFrame(draw);
        };
        requestRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(requestRef.current);
    }, [hover, active, squarePath, baseDotSize, baseColor, hoverScale]);
  
    useEffect(() => {
        const el = canvasRef.current;
        if (!el) return;
        
        const getMouseWorldPos = (e) => {
            const rect = el.getBoundingClientRect();
            const currentV = viewRef.current;
            return {
                x: (e.clientX - rect.left - rect.width/2 - currentV.x) / currentV.zoom,
                y: (e.clientY - rect.top - rect.height/2 - currentV.y) / currentV.zoom
            };
        };

        const handleWheel = (e) => {
            e.preventDefault();
            const rect = el.getBoundingClientRect();
            const targetV = targetViewRef.current;

            const mouseX = e.clientX - rect.left - rect.width/2;
            const mouseY = e.clientY - rect.top - rect.height/2;

            const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85; 
            const newZoom = targetV.zoom * zoomFactor;
            
            const dx = (mouseX - targetV.x) * (newZoom / targetV.zoom - 1);
            const dy = (mouseY - targetV.y) * (newZoom / targetV.zoom - 1);

            targetViewRef.current = clampView({
                zoom: newZoom,
                x: targetV.x - dx,
                y: targetV.y - dy
            }, rect.width, rect.height);
        };

        // --- MANEJO DE EVENTOS DE MOUSE PARA EVITAR SELECCIÓN AL PANEAR ---

        const handleMouseDown = (e) => {
            if (e.button === 0) {
                isDragging.current = true;
                // Guardamos posición inicial y actual
                dragStartPos.current = { x: e.clientX, y: e.clientY };
                lastMousePos.current = { x: e.clientX, y: e.clientY };
                
                // Limpiamos tooltip y hover INMEDIATAMENTE al empezar a interactuar
                setTooltipData(null);
                setHover(null); 
            }
        };

        const handleMouseMove = (e) => {
            if (isDragging.current) {
                const dx = e.clientX - lastMousePos.current.x;
                const dy = e.clientY - lastMousePos.current.y;
                
                const currentTarget = targetViewRef.current;
                targetViewRef.current = clampView({ 
                    ...currentTarget, 
                    x: currentTarget.x + dx, 
                    y: currentTarget.y + dy 
                }, el.offsetWidth, el.offsetHeight);

                lastMousePos.current = { x: e.clientX, y: e.clientY };
            } else {
                const pos = getMouseWorldPos(e);
                const hit = nodesRef.current.find(n => {
                    const d = dotsRef.current[n.gridIndex];
                    return d && Math.abs(pos.x - d.cx) < baseDotSize && Math.abs(pos.y - d.cy) < baseDotSize;
                });
                setHover(hit || null);
            }
        };

        const handleMouseUp = () => isDragging.current = false;

        const handleClick = (e) => {
            // Calculamos cuánto se ha movido desde que se pulsó el botón
            const dist = Math.hypot(
                e.clientX - dragStartPos.current.x,
                e.clientY - dragStartPos.current.y
            );

            // Si se movió más de 5px, asumimos que fue un "drag" (paneo) y NO seleccionamos
            if (dist > 5) return;

            const pos = getMouseWorldPos(e);
            const n = nodesRef.current.find(n => {
                const d = dotsRef.current[n.gridIndex];
                return d && Math.abs(pos.x - d.cx) < baseDotSize && Math.abs(pos.y - d.cy) < baseDotSize;
            });
            if (n) {
                setActive(n);
                onSelect?.(n.item);
                const d = dotsRef.current[n.gridIndex];
                flyTo(-d.cx * 1.8, -d.cy * 1.8, 1.8);
            }
        };

        el.addEventListener('wheel', handleWheel, { passive: false });
        el.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        el.addEventListener('click', handleClick);
        return () => {
            el.removeEventListener('wheel', handleWheel);
            el.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            el.removeEventListener('click', handleClick);
        };
    }, [onSelect, baseDotSize, clampView, flyTo]);

    // Zoom externo
    useEffect(() => {
      if (onZoomChange) {
        onZoomChange.current = (factor, targetItem = null) => {
          if (targetItem) {
            const node = nodesRef.current.find(n => n.id === targetItem.id);
            const dot = node ? dotsRef.current[node.gridIndex] : null;
            if (dot) flyTo(-dot.cx * 2, -dot.cy * 2, 2);
            return;
          }
          const cvs = canvasRef.current;
          if (cvs) {
             const currentT = targetViewRef.current;
             targetViewRef.current = clampView({ ...currentT, zoom: currentT.zoom * factor }, cvs.offsetWidth, cvs.offsetHeight);
          }
        };
      }
    }, [onZoomChange, clampView, flyTo]);
    
 // Sync Tooltip Data
 useEffect(() => {
  // Si se arrastra, no mostramos tooltip
  if (isDragging.current) {
    setTooltipData(null);
    return;
  }
  
  // NUEVO: Si no hay hover O si el punto hovereado es el mismo que el seleccionado (ya abierto en panel)
  // entonces ocultamos el tooltip para que no moleste.
  if (!hover || (selectedItem && hover.id === selectedItem.id)) { 
      setTooltipData(null); 
      return; 
  }

  setTooltipData(hover.item);
}, [hover, selectedItem]); 

    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
          <div ref={wrapRef} style={{ position: 'absolute', width: '100%', height: '100%' }}>
            <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, cursor: isDragging.current ? 'grabbing' : 'crosshair' }} />
            
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10, opacity: tooltipData ? 1 : 0, transition: 'opacity 0.2s' }}>
                 <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
                    {tooltipData && <line ref={lineRef} stroke="#19258D" strokeWidth="4" />}
                 </svg>
                 
                 <div ref={tooltipRef} style={{
                    position: 'absolute', 
                    top: 0, left: 0, 
                    background: '#0e1861c5', border: '10px solid #19258D', padding: '24px', color: '#cfe8ff',
                    pointerEvents: 'none', maxWidth: 285, zIndex: 11, boxShadow: '0 6px 20px rgba(0,0,0,0.35)', display: 'flex',
                    flexDirection: 'column', gap: '16px', 
                    willChange: 'transform'
                  }}>
                  {tooltipData && (
                    <>
                        <div style={{ color: '#B5EBF8', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase' }}>{DEFAULT_PLATFORM_ID_TO_KEY[tooltipData?.platformId]}</div>
                        <div style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: '20px' }}>{tooltipData?.title}</div>
                        {tooltipData?.artists && <div style={{ color: 'rgba(216, 225, 255, 0.7)', fontSize: '16px' }}>{tooltipData.artists}</div>}
                    </>
                  )}
                </div>
            </div>

          </div>
        </div>
      );
}