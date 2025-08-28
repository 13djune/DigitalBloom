// src/components/TimelineDotGrid.js
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';

gsap.registerPlugin(Draggable);

// --- MAPEOS Y CONSTANTES ---
const PLATFORM_ID_TO_KEY = { 1: 'SPOTIFY', 2: 'YOUTUBE', 3: 'TIKTOK', 4: 'INSTAGRAM', 5: 'IPHONE', 6: 'WHATSAPP', 7: 'STREAMING', 8: 'GOOGLE' };
const COLOR_MAPPING = { SPOTIFY: '#5ffd79', YOUTUBE: '#FF5353', TIKTOK: '#8170ff', INSTAGRAM: '#fb96e2', IPHONE: '#f2fb73', WHATSAPP: '#44be56', STREAMING: '#ffa536', GOOGLE: '#4285F4' };
const AWARENESS_LABELS = { 1: 'DESEO', 2: 'CUERPO', 3: 'RASTRO' };

// --- FUNCIONES UTILITARIAS ---
const pseudoRandom = (seed) => {
  let h = 1779033703 ^ String(seed).length;
  for (let i = 0; i < String(seed).length; i++) {
    h = Math.imul(h ^ String(seed).charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
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
export default function TimelineDotGrid({
  data = [],
  onSelect,
  dotSize = 4,
  hoverScale = 2.0,
  hitTestPadding = 10,
  tooltipOffset = { x: 20, y: 0 }
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const panRef = useRef(null);
  const tooltipRef = useRef(null);
  
  const stateRef = useRef({
    nodes: [], zoom: 0.1, position: { x: 0, y: 0 }, contentSize: { width: 1, height: 1 },
    hoveredNode: null, activeNode: null, draggable: null, isReady: false,
  }).current;

  // FIX: El estado se llama 'tooltip' y 'setTooltip' para consistencia
  const [tooltip, setTooltip] = useState(null);

  // 1. Procesamiento y layout de datos
  useEffect(() => {
    if (data.length === 0 || !containerRef.current) return;
    
    const processedData = data
      .map(item => ({ ...item, date: getDateForItem(item) }))
      .filter(item => item.platformId && item.date)
      .sort((a, b) => a.date - b.date);

    if (processedData.length === 0) return;

    const minDate = processedData[0].date;
    const maxDate = processedData[processedData.length - 1].date;
    const timeSpan = Math.max(1, maxDate.getTime() - minDate.getTime());
    
    const CONTENT_WIDTH = 50000;
    const LANE_HEIGHT = 300;
    const CONTENT_HEIGHT = LANE_HEIGHT * 3;
    
    stateRef.contentSize = { width: CONTENT_WIDTH, height: CONTENT_HEIGHT };
    
    stateRef.nodes = processedData.map(item => {
      const timeDiff = item.date.getTime() - minDate.getTime();
      const x = (timeDiff / timeSpan) * (CONTENT_WIDTH - 300) + 150;
      const awarenessIndex = (item.awareness || 1) - 1;
      const y = (awarenessIndex * LANE_HEIGHT) + (LANE_HEIGHT / 2) + (pseudoRandom(item.id + 'y') - 0.5) * (LANE_HEIGHT * 0.9);
      return { item, x, y, color: COLOR_MAPPING[PLATFORM_ID_TO_KEY[item.platformId]] || '#ccc', baseR: dotSize };
    });

    const { clientWidth, clientHeight } = containerRef.current;
    if(clientWidth > 0 && CONTENT_WIDTH > 0) {
      const initialZoom = clientWidth / CONTENT_WIDTH;
      stateRef.zoom = initialZoom;
      stateRef.position = { x: 0, y: (clientHeight - CONTENT_HEIGHT * initialZoom) / 2 };
    }
    stateRef.isReady = true;
  }, [data, dotSize, stateRef]);

  // 2. Bucle de dibujado e interacciones
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d');
    
    let rafId;

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      const { width, height } = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
          canvas.width = width * dpr;
          canvas.height = height * dpr;
          ctx.scale(dpr, dpr);
      }
      
      ctx.clearRect(0, 0, width, height);
      if (!stateRef.isReady) return;

      ctx.save();
      ctx.translate(stateRef.position.x, stateRef.position.y);
      ctx.scale(stateRef.zoom, stateRef.zoom);
      
      const view = {
        x1: -stateRef.position.x / stateRef.zoom, y1: -stateRef.position.y / stateRef.zoom,
        x2: (-stateRef.position.x + width) / stateRef.zoom, y2: (-stateRef.position.y + height) / stateRef.zoom,
      };
      
      for (const n of stateRef.nodes) {
        if (n.x > view.x1 && n.x < view.x2 && n.y > view.y1 && n.y < view.y2) {
          const isHover = stateRef.hoveredNode?.item.id === n.item.id;
          const isActive = stateRef.activeNode?.item.id === n.item.id;
          const r = n.baseR * (isHover ? hoverScale : 1);
          
          ctx.beginPath();
          ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = n.color;
          ctx.fill();
          if (isHover || isActive) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2 / stateRef.zoom;
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
      const LANE_HEIGHT = stateRef.contentSize.height / 3;
      [1, 2, 3].forEach(level => {
        const yPos = stateRef.position.y + ((level - 0.5) * LANE_HEIGHT) * stateRef.zoom;
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

    const getMouseWorldPos = e => ({
        x: (e.clientX - container.getBoundingClientRect().left - stateRef.position.x) / stateRef.zoom,
        y: (e.clientY - container.getBoundingClientRect().top - stateRef.position.y) / stateRef.zoom
    });

    const hitTest = (worldX, worldY) => {
        for (let i = stateRef.nodes.length - 1; i >= 0; i--) {
            const n = stateRef.nodes[i];
            if (Math.hypot(worldX - n.x, worldY - n.y) < n.baseR + hitTestPadding / stateRef.zoom) return n;
        }
        return null;
    };
    
    const onMouseMove = e => {
      if (stateRef.draggable?.isDragging) return;
      stateRef.hoveredNode = hitTest(getMouseWorldPos(e).x, getMouseWorldPos(e).y);
    };
    
    const onClick = e => {
        if (stateRef.draggable?.isDragging) return;
        const node = hitTest(getMouseWorldPos(e).x, getMouseWorldPos(e).y);
        stateRef.activeNode = node;
        onSelect?.(node?.item || null);
    };

    const onWheel = e => {
        e.preventDefault();
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const scaleMultiplier = 1 - e.deltaY * 0.001;
        const newZoom = Math.max(0.02, Math.min(5, stateRef.zoom * scaleMultiplier));
        const worldX = (mouseX - stateRef.position.x) / stateRef.zoom;
        const worldY = (mouseY - stateRef.position.y) / stateRef.zoom;
        stateRef.position = { x: mouseX - worldX * newZoom, y: mouseY - worldY * newZoom };
        stateRef.zoom = newZoom;
    };
    
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('click', onClick);
    container.addEventListener('mouseleave', () => { stateRef.hoveredNode = null; });

    stateRef.draggable = Draggable.create(panRef.current, {
        type: 'x,y', edgeResistance: 0.65, inertia: true,
        bounds: container,
        onDrag: function() { stateRef.position = { x: this.x, y: this.y }; },
        onThrowUpdate: function() { stateRef.position = { x: this.x, y: this.y }; }
    })[0];

    return () => {
      cancelAnimationFrame(rafId);
      stateRef.draggable?.kill();
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('click', onClick);
    };
  }, [data, onSelect, dotSize, hoverScale, hitTestPadding, stateRef]);
  
  useEffect(() => {
    if (stateRef.draggable && containerRef.current) {
        stateRef.draggable.applyBounds({
            minX: Math.min(0, containerRef.current.clientWidth - stateRef.contentSize.width * stateRef.zoom), maxX: 0,
            minY: Math.min(0, containerRef.current.clientHeight - stateRef.contentSize.height * stateRef.zoom), maxY: 0,
        });
    }
  }, [stateRef, stateRef.zoom, stateRef.contentSize]);

  useEffect(() => {
    const interval = setInterval(() => {
        setTooltip(stateRef.activeNode ? null : stateRef.hoveredNode);
    }, 50);
    return () => clearInterval(interval);
  }, [stateRef]);

  useEffect(() => {
    const tipEl = tooltipRef.current;
    if (!tooltip || !tipEl || !containerRef.current) {
      if (tipEl) tipEl.style.opacity = '0';
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const screenX = (tooltip.x * stateRef.zoom + stateRef.position.x) + containerRect.left;
    const screenY = (tooltip.y * stateRef.zoom + stateRef.position.y) + containerRect.top;
    
    const { width: tipW, height: tipH } = tipEl.getBoundingClientRect();
    let finalX = screenX + tooltipOffset.x;
    if (finalX + tipW > window.innerWidth) {
      finalX = screenX - tipW - tooltipOffset.x;
    }
    let finalY = screenY - tipH / 2;
    if (finalY < 0) finalY = 0;
    if (finalY + tipH > window.innerHeight) {
      finalY = window.innerHeight - tipH;
    }
    
    tipEl.style.transform = `translate(${finalX}px, ${finalY}px)`;
    tipEl.style.opacity = '1';

  }, [tooltip, stateRef, tooltipOffset]);

  return (
    <div ref={containerRef} className="navigate-container">
      <div ref={panRef} style={{ width: stateRef.contentSize.width, height: stateRef.contentSize.height, position: 'absolute', top: 0, left: 0 }}>
        <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      </div>
      <div ref={tooltipRef} className="data-tooltip" style={{ position: 'fixed', top: 0, left: 0, opacity: 0, transition: 'opacity 0.2s' }}>
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