// src/components/TimelineView.js
'use client';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(InertiaPlugin, Draggable);

// --- MAPEOS Y CONSTANTES ---
const PLATFORM_ID_TO_KEY = { 1: 'SPOTIFY', 2: 'YOUTUBE', 3: 'TIKTOK', 4: 'INSTAGRAM', 5: 'IPHONE', 6: 'WHATSAPP', 7: 'STREAMING', 8: 'GOOGLE' };
const COLOR_MAPPING = { SPOTIFY: '#5ffd79', YOUTUBE: '#FF5353', TIKTOK: '#8170ff', INSTAGRAM: '#fb96e2', IPHONE: '#f2fb73', WHATSAPP: '#44be56', STREAMING: '#ffa536', GOOGLE: '#4285F4' };
const AWARENESS_LABELS = { 1: 'DESEO', 2: 'CUERPO', 3: 'RASTRO' };

// --- FUNCIONES UTILITARIAS ---
const hexToRgb = hex => {
  const m = hex?.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
};

const pseudoRandom = (seed) => {
  let h = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++) { h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const getDateForItem = (item) => {
  if (item.date) {
    const d = new Date(item.date);
    if (!isNaN(d.getTime())) return d;
  }
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  const randomFactor = pseudoRandom(item.id);
  switch (item.timeBucket) {
    case '4w': return new Date(now.getTime() - randomFactor * 28 * 24 * 3600 * 1000);
    case '6m': return new Date(now.getTime() - randomFactor * 182 * 24 * 3600 * 1000);
    case '1y': default: return new Date(oneYearAgo.getTime() + randomFactor * 365 * 24 * 3600 * 1000);
  }
};

// --- COMPONENTE PRINCIPAL ---
export default function TimelineView({
  data = [],
  onSelect,
  dotSize = 8,
  baseColor = '#1B1F3A',
  activeColor = '#19258D',
  proximity = 150,
  resistance = 700,
  returnDuration = 1.25,
  hitTestPadding = 15,
  hoverScale = 1.5,
  tooltipOffset = { x: 30, y: 0 },
  shockRadius = 250,
  shockStrength = 5,
  onZoomChange, // Para los botones externos
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const tooltipRef = useRef(null);
  
  const state = useRef({
    nodes: [], zoom: 0.1, position: { x: 0, y: 0 }, contentSize: { width: 1, height: 1 },
    hoveredNode: null, activeNode: null, draggable: null, isReady: false,
    canvasSize: { width: 0, height: 0 }
  }).current;

  const [tooltip, setTooltip] = useState(null);

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const actRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  // Layout de datos
  useEffect(() => {
    if (data.length === 0 || !containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;

    const sortedData = data
      .map(item => ({ ...item, date: getDateForItem(item) }))
      .filter(item => item.platformId && item.date)
      .sort((a, b) => a.date - b.date);

    if (sortedData.length === 0) return;

    const minDate = sortedData[0].date;
    const maxDate = sortedData[sortedData.length - 1].date;
    const timeSpan = Math.max(1, maxDate.getTime() - minDate.getTime());
    
    const CONTENT_WIDTH = clientWidth * 15; // 15 pantallas de ancho
    const LANE_HEIGHT = clientHeight / 3;
    const CONTENT_HEIGHT = LANE_HEIGHT * 3;
    
    state.contentSize = { width: CONTENT_WIDTH, height: CONTENT_HEIGHT };
    
    state.nodes = sortedData.map(item => {
      const timeDiff = item.date.getTime() - minDate.getTime();
      const x = (timeDiff / timeSpan) * (CONTENT_WIDTH - 200) + 100;
      const awarenessIndex = (item.awareness || 1) - 1;
      const y = (awarenessIndex * LANE_HEIGHT) + (LANE_HEIGHT / 2) + (pseudoRandom(item.id + 'y') - 0.5) * (LANE_HEIGHT * 0.8);
      return {
        item, x, y, xOffset: 0, yOffset: 0, _inertia: false,
        color: COLOR_MAPPING[PLATFORM_ID_TO_KEY[item.platformId]] || '#ccc',
        baseR: dotSize
      };
    });

    state.isReady = true;
  }, [data, dotSize, state]);

  // Bucle de dibujado y lógica de interacción
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    let rafId;

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      if (!state.isReady) return;

      const { width, height } = state.canvasSize;
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.translate(state.position.x, state.position.y);
      ctx.scale(state.zoom, state.zoom);
      
      const view = {
        x1: -state.position.x / state.zoom, y1: -state.position.y / state.zoom,
        x2: (-state.position.x + width) / state.zoom, y2: (-state.position.y + height) / state.zoom,
      };
      
      const hx = state.hoveredNode ? state.hoveredNode.x + state.hoveredNode.xOffset : -9999;
      const hy = state.hoveredNode ? state.hoveredNode.y + state.hoveredNode.yOffset : -9999;

      for (const n of state.nodes) {
        if (n.x > view.x1 - proximity && n.x < view.x2 + proximity && n.y > view.y1 - proximity && n.y < view.y2 + proximity) {
          const x = n.x + n.xOffset, y = n.y + n.yOffset;
          const isHover = state.hoveredNode?.item.id === n.item.id;
          const isActive = state.activeNode?.item.id === n.item.id;
          const r = n.baseR * (isHover ? hoverScale : 1);
          
          let finalColor = n.color;
          const dsq = Math.hypot(x - hx, y - hy);
          if (dsq <= proximity) {
            const t = 1 - dsq / proximity;
            const rC = Math.round(baseRgb.r + (actRgb.r - baseRgb.r) * t);
            const gC = Math.round(baseRgb.g + (actRgb.g - baseRgb.g) * t);
            const bC = Math.round(baseRgb.b + (actRgb.b - baseRgb.b) * t);
            ctx.fillStyle = `rgb(${rC},${gC},${bC})`;
          } else {
            ctx.fillStyle = finalColor;
          }

          ctx.beginPath();
          ctx.arc(x, y, r / 2, 0, Math.PI * 2);
          ctx.fill();

          if (isHover || isActive) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2 / state.zoom;
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      ctx.save();
      ctx.font = 'bold 24px "Pixelated", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const LANE_HEIGHT = state.contentSize.height / 3;
      [1, 2, 3].forEach((level, i) => {
        const yPos = state.position.y + ((i + 0.5) * LANE_HEIGHT) * state.zoom;
        if (yPos > -50 && yPos < height + 50) {
            ctx.save();
            ctx.translate(50, yPos);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(AWARENESS_LABELS[level], 0, 0);
            ctx.restore();
        }
      });
      ctx.restore();
    };
    draw();

    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      state.canvasSize = { width, height };
    });
    resizeObserver.observe(container);

    const hitTest = (worldX, worldY) => {
      for (let i = state.nodes.length - 1; i >= 0; i--) {
        const n = state.nodes[i];
        if (Math.hypot(worldX - (n.x + n.xOffset), worldY - (n.y + n.yOffset)) < n.baseR / 2 + hitTestPadding / state.zoom) return n;
      }
      return null;
    };
    
    const onMouseMove = e => {
      if (state.draggable?.isDragging) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
      const worldX = (mouseX - state.position.x) / state.zoom;
      const worldY = (mouseY - state.position.y) / state.zoom;
      state.hoveredNode = hitTest(worldX, worldY);
      setTooltip(state.hoveredNode);
    };

    const onClick = e => {
        if (state.draggable?.isDragging) return;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
        const worldX = (mouseX - state.position.x) / state.zoom;
        const worldY = (mouseY - state.position.y) / state.zoom;
        
        state.nodes.forEach(n => {
          const dist = Math.hypot(n.x - worldX, n.y - worldY);
          if (dist < shockRadius / state.zoom && !n._inertia) {
            n._inertia = true;
            gsap.killTweensOf(n);
            const falloff = Math.max(0, 1 - dist / (shockRadius / state.zoom));
            const pushX = (n.x - worldX) * shockStrength * falloff;
            const pushY = (n.y - worldY) * shockStrength * falloff;
            gsap.to(n, {
              inertia: { xOffset: pushX, yOffset: pushY, resistance },
              onComplete: () => {
                gsap.to(n, { xOffset: 0, yOffset: 0, duration: returnDuration, ease: 'elastic.out(1,0.75)' });
                n._inertia = false;
              }
            });
          }
        });
        
        const node = hitTest(worldX, worldY);
        state.activeNode = node;
        onSelect?.(node?.item || null);
    };

    const handleZoom = (factor) => {
      const { width, height } = state.canvasSize;
      const centerX = width / 2;
      const centerY = height / 2;
      const newZoom = Math.max(0.02, Math.min(5, state.zoom * factor));
      const worldX = (centerX - state.position.x) / state.zoom;
      const worldY = (centerY - state.position.y) / state.zoom;
      state.position = { x: centerX - worldX * newZoom, y: centerY - worldY * newZoom };
      state.zoom = newZoom;
    };
    onZoomChange.current = handleZoom;

    const onWheel = e => {
      e.preventDefault();
      const scaleMultiplier = 1 - e.deltaY * 0.001;
      handleZoom(scaleMultiplier);
    };
    
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    container.addEventListener('mouseleave', () => { state.hoveredNode = null; setTooltip(null); });

    state.draggable = Draggable.create(panRef.current, {
        type: 'x,y', edgeResistance: 0.65, inertia: true,
        bounds: container,
        onDrag: function() { state.position = { x: this.x, y: this.y }; },
        onThrowUpdate: function() { state.position = { x: this.x, y: this.y }; }
    })[0];

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      state.draggable?.kill();
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
    };
  }, [data, onSelect, dotSize, hoverScale, hitTestPadding, state, baseRgb, actRgb, proximity, resistance, returnDuration, shockRadius, shockStrength, onZoomChange]);
  
  useEffect(() => {
    if (state.draggable && containerRef.current) {
        state.draggable.applyBounds({
            minX: Math.min(0, state.canvasSize.width - state.contentSize.width * state.zoom), maxX: 0,
            minY: Math.min(0, state.canvasSize.height - state.contentSize.height * state.zoom), maxY: 0,
        });
    }
  }, [state, state.zoom, state.contentSize, state.canvasSize]);

  useEffect(() => {
    const tipEl = tooltipRef.current;
    if (!tooltip || state.activeNode || !tipEl || !containerRef.current) {
      if (tipEl) tipEl.style.opacity = '0';
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const screenX = (tooltip.x * state.zoom + state.position.x) + containerRect.left;
    const screenY = (tooltip.y * state.zoom + state.position.y) + containerRect.top;
    
    const { width: tipW, height: tipH } = tipEl.getBoundingClientRect();
    let finalX = screenX + tooltipOffset.x;
    if (finalX + tipW > window.innerWidth) finalX = screenX - tipW - tooltipOffset.x;
    
    let finalY = screenY - tipH / 2;
    if (finalY < 0) finalY = 0;
    if (finalY + tipH > window.innerHeight) finalY = window.innerHeight - tipH;
    
    tipEl.style.transform = `translate(${finalX}px, ${finalY}px)`;
    tipEl.style.opacity = '1';

  }, [tooltip, state, tooltipOffset]);

  return (
    <div ref={containerRef} className="navigate-container">
      <div ref={panRef} style={{ width: state.contentSize.width, height: state.contentSize.height, position: 'absolute', top: 0, left: 0 }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </div>
      <div ref={tooltipRef} className="data-tooltip" style={{ position: 'fixed', top: 0, left: 0, opacity: 0, transition: 'opacity 0.2s', pointerEvents: 'none' }}>
        {tooltip?.item && (
          <>
            <div className='tooltip-platform'>{PLATFORM_ID_TO_KEY[tooltip.item.platformId]}</div>
            <div className='tooltip-title'>{tooltip.item.title}</div>
            {tooltip.item.artists && <div className='tooltip-artist'>{tooltip.item.artists}</div>}
          </>
        )}
      </div>
    </div>
  );
}