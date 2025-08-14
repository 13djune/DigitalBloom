
'use client';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { InertiaPlugin } from 'gsap/InertiaPlugin';

gsap.registerPlugin(InertiaPlugin);

/**
 * DATA esperado por elemento:
 * {
 *   id, title, artists?,
 *   awareness|level: 1|2|3,
 *   time|timeBucket: 1|2|3 ó '4w'|'6m'|'1y',
 *   platformId|platform: number|string,
 *   rank?: number,
 *   tags?: string[]
 * }
 */

const hexToRgb = (hex) => {
  const m = hex?.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? { r: parseInt(m[1],16), g: parseInt(m[2],16), b: parseInt(m[3],16) } : { r:0,g:0,b:0 };
};

const DEFAULT_PLATFORM_ID_TO_KEY = {
  1:'SPOTIFY', 2:'YOUTUBE', 3:'TIKTOK', 4:'INSTAGRAM', 5:'TWITTER', 6:'REELS', 7:'SHORTS', 8:'TWITCH'
};
const DEFAULT_PLATFORM_KEY_TO_ID = Object.fromEntries(
  Object.entries(DEFAULT_PLATFORM_ID_TO_KEY).map(([id,k])=>[k, Number(id)])
);
const TIME_ID_TO_BUCKET = { 1:'4w', 2:'6m', 3:'1y' };

class SpatialHash {
  constructor(cell=56){ this.c=cell; this.map=new Map(); }
  _k(x,y){ return `${Math.floor(x/this.c)}:${Math.floor(y/this.c)}`; }
  clear(){ this.map.clear(); }
  add(obj){ const k=this._k(obj.x,obj.y); if(!this.map.has(k)) this.map.set(k,[]); this.map.get(k).push(obj); }
  query(x,y){ const i=Math.floor(x/this.c), j=Math.floor(y/this.c); const out=[];
    for(let di=-1;di<=1;di++) for(let dj=-1;dj<=1;dj++){ const k=`${i+di}:${j+dj}`; const a=this.map.get(k); if(a) out.push(...a); }
    return out;
  }
}
const throttle = (fn, ms) => { let t=0; return (...a)=>{ const n=performance.now(); if(n-t>=ms){ t=n; fn(...a); } }; };

export default function DataDotGrid({
  data = [],
  filters = { level: 1, time: 1, platforms: [], tags: [] },

  // GRID (apariencia/física)
  dotSize = 12,
  gap = 24,
  baseColor = '#1B1F3A',
  activeColor = '#4A67FF',
  proximity = 120,
  speedTrigger = 120,     // px/s para empujar
  shockRadius = 260,
  shockStrength = 5,
  resistance = 700,
  returnDuration = 1.25,

  // DATA (color por plataforma)
  platformIdToKey = DEFAULT_PLATFORM_ID_TO_KEY,
  platformKeyToId = DEFAULT_PLATFORM_KEY_TO_ID,
  colorMapping = {
    SPOTIFY:'#39D353', YOUTUBE:'#FF5353', TIKTOK:'#A78BFA', INSTAGRAM:'#FF9AE6',
    TWITCH:'#8B5CF6', TWITTER:'#1DA1F2', REELS:'#FF7EB6', SHORTS:'#FFB347'
  },

  // DATA (tamaño/hover)
  sizeBy = 'rank',
  sizeRange = [10, 22],
  hoverScale = 1.2,

  // tooltip
  tooltipOffset = { x: 14, y: 10 },

  className = '',
  style,
  onSelect
}) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);

  // malla base
  const dotsRef = useRef([]); // {cx,cy,xOffset,yOffset,_inertia,_frozenBy:null|'hover'|'active'}
  // nodos de datos
  const nodesRef = useRef([]); // {id,item,gridIndex,color,baseR}
  // índice de hit test (coordenadas actuales con offset)
  const indexRef = useRef(new SpatialHash(56));

  const [hover, setHover] = useState(null); // {id,x,y,r,item}
  const [active, setActive] = useState(null); // nodo activo (panel abierto)

  const baseRgb = useMemo(()=>hexToRgb(baseColor), [baseColor]);
  const actRgb = useMemo(()=>hexToRgb(activeColor), [activeColor]);

  const circlePath = useMemo(() => {
    if (typeof window === 'undefined' || !window.Path2D) return null;
    const p = new window.Path2D();
    p.arc(0, 0, 1, 0, Math.PI * 2);
    return p;
  }, []);

  /* ---------- Construir malla ---------- */
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
    ctx.setTransform(dpr,0,0,dpr,0,0);

    const cols = Math.floor((width + gap) / (dotSize + gap));
    const rows = Math.floor((height + gap) / (dotSize + gap));
    const cell = dotSize + gap;
    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;
    const startX = (width - gridW)/2 + dotSize/2;
    const startY = (height - gridH)/2 + dotSize/2;

    const arr = [];
    for (let y=0;y<rows;y++) for (let x=0;x<cols;x++) {
      arr.push({ cx:startX+x*cell, cy:startY+y*cell, xOffset:0, yOffset:0, _inertia:false, _frozenBy:null });
    }
    dotsRef.current = arr;
  }, [dotSize, gap]);

  useEffect(() => {
    buildGrid();
    let ro;
    if ('ResizeObserver' in window) {
      ro = new ResizeObserver(buildGrid);
      wrapRef.current && ro.observe(wrapRef.current);
    } else {
      window.addEventListener('resize', buildGrid);
    }
    return () => { ro ? ro.disconnect() : window.removeEventListener('resize', buildGrid); };
  }, [buildGrid]);

  /* ---------- Normalizar + filtrar ---------- */
  const normalized = useMemo(() => data.map(d=>{
    const awareness = d.awareness ?? d.level ?? 1;
    const timeBucket = d.timeBucket ?? TIME_ID_TO_BUCKET[d.time ?? 1] ?? '4w';
    const platformId = d.platformId ?? (d.platform ? platformKeyToId[d.platform] : undefined);
    const platformKey = d.platform ?? (typeof platformId==='number' ? platformIdToKey[platformId] : undefined);
    return { ...d, awareness, timeBucket, platformId, platformKey };
  }), [data, platformKeyToId, platformIdToKey]);

  const filtered = useMemo(() => {
    const lv = Number(filters.level) || 1;
    const tb = TIME_ID_TO_BUCKET[Number(filters.time) || 1] ?? '4w';
    const plats = new Set(filters.platforms || []);
    const tagSet = new Set(filters.tags || []);
    return normalized.filter(it => {
      const passLevel = it.awareness === lv;
      const passTime  = it.timeBucket === tb;
      const passPlat  = plats.size===0 ? true : plats.has(it.platformId);
      const passTags  = tagSet.size===0 ? true : (it.tags||[]).some(t=>tagSet.has(t));
      return passLevel && passTime && passPlat && passTags;
    });
  }, [normalized, filters]);

  /* ---------- Layout de nodos: asignar a celdas del grid ---------- */
  const computeNodeSize = useCallback((item) => {
    if (sizeBy === 'rank' && typeof item.rank === 'number') {
      const ranks = filtered.map(d=>d.rank).filter(n=>typeof n==='number' && !Number.isNaN(n));
      const maxR = Math.max(1, ...ranks);
      const minR = Math.min(...ranks, 1);
      const t = (maxR === minR) ? 1 : 1 - (item.rank - minR) / (maxR - minR);
      return sizeRange[0] + (sizeRange[1]-sizeRange[0]) * t;
    }
    return dotSize;
  }, [filtered, sizeBy, sizeRange, dotSize]);

  const layoutNodes = useCallback(() => {
    const wrap = wrapRef.current; if (!wrap) return;
    const { width, height } = wrap.getBoundingClientRect();
    const anchorX = { 1: width*0.70, 2: width*0.82, 3: width*0.90 }[Number(filters.level)||1];

    // liberamos flags de celdas usadas
    dotsRef.current.forEach(d => { d._taken=false; });

    const nodes = [];
    for (const item of filtered) {
      const anchorY = height*0.20 + Math.random()*height*0.60;
      let best=-1, bestDist=Infinity;
      for (let i=0;i<dotsRef.current.length;i++) {
        const d = dotsRef.current[i];
        if (d._taken) continue;
        const dx=d.cx-anchorX, dy=d.cy-anchorY, dist=dx*dx+dy*dy;
        if (dist<bestDist) { bestDist=dist; best=i; }
      }
      if (best>=0) {
        dotsRef.current[best]._taken=true;
        const baseR = computeNodeSize(item);
        const color = colorMapping[item.platform ?? item.platformKey] ||
                      colorMapping[DEFAULT_PLATFORM_ID_TO_KEY[item.platformId]] || '#9BA3B4';
        nodes.push({ id:item.id, item, gridIndex:best, baseR, color });
      }
      
    }
    nodesRef.current = nodes;
  }, [filtered, filters.level, colorMapping, computeNodeSize]);

  useEffect(() => { layoutNodes(); }, [layoutNodes]);

  /* ---------- Draw loop ---------- */
  useEffect(() => {
    if (!circlePath) return;
    let raf;
    const draw = () => {
      const cvs = canvasRef.current; if (!cvs) return;
      const ctx = cvs.getContext('2d'); if (!ctx) return;
      ctx.clearRect(0,0,cvs.width,cvs.height);

      // Re‑construir índice de hit-test con posiciones ACTUALES (incluye offsets)
      indexRef.current.clear();

      const proxSq = proximity * proximity;
      const hx = hover?.x ?? -9999, hy = hover?.y ?? -9999;

      // --- pinto malla base ---
      for (const dot of dotsRef.current) {
        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;

        // color con halo de proximidad (solo visual, no altera física)
        let fill = baseColor;
        const dx = dot.cx - hx, dy = dot.cy - hy, dsq = dx*dx + dy*dy;
        if (dsq <= proxSq) {
          const dist = Math.sqrt(dsq);
          const t = 1 - dist / proximity;
          const r = Math.round(baseRgb.r + (actRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (actRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (actRgb.b - baseRgb.b) * t);
          fill = `rgb(${r},${g},${b})`;
        }

        ctx.save();
        ctx.translate(ox, oy);
        ctx.scale(dotSize/2, dotSize/2);
        ctx.fillStyle = fill;
        ctx.fill(circlePath);
        ctx.restore();
      }

      // --- pinto data nodes (SIGUEN al grid) ---
      for (const n of nodesRef.current) {
        const dot = dotsRef.current[n.gridIndex];
        if (!dot) continue;
        const isHover = hover?.gridIndex === n.gridIndex;
        const isActive = active?.gridIndex === n.gridIndex;
        const isFrozen = dot._frozenBy === 'hover' || dot._frozenBy === 'active';
const x = isFrozen ? dot.cx : dot.cx + dot.xOffset;
const y = isFrozen ? dot.cy : dot.cy + dot.yOffset;

        
      
        const R = (n.baseR) * (isHover ? hoverScale : 1);
      
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(R / 2, R / 2);
        ctx.fillStyle = n.color;
        ctx.fill(circlePath);
        ctx.restore();
      
        if (isHover || isActive) {
          ctx.beginPath();
          ctx.arc(x, y, R * 0.85, 0, Math.PI * 2);
          ctx.strokeStyle = isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.85)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      
        indexRef.current.add({ x, y, r: R, ref: { id: n.id, x, y, r: R, item: n.item, gridIndex: n.gridIndex } });
      }
      

      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [circlePath, dotSize, baseColor, baseRgb, actRgb, proximity, hover, active, hoverScale]);

  /* ---------- Interacciones ---------- */
  useEffect(() => {
    const state = { lastTime:0, lastX:0, lastY:0 };

    const hitTestByCell = (px, py) => {
        const nodes = nodesRef.current;
        for (const n of nodes) {
          const dot = dotsRef.current[n.gridIndex];
          const cx = dot?.cx ?? 0;
          const cy = dot?.cy ?? 0;
          const r = n.baseR;
          if (Math.hypot(cx - px, cy - py) <= r) {
            return { ...n, x: cx, y: cy, r };
          }
        }
        return null;
      };
      

      const freezeCell = (gridIndex, reason) => {
        const d = dotsRef.current[gridIndex];
        if (!d) return;
        if (d._frozenBy === 'active') return;
      
        d._frozenBy = reason;
        gsap.killTweensOf(d);
      
        // ❄️ Reinicia offsets inmediatamente para que no se mueva
        d.xOffset = 0;
        d.yOffset = 0;
        d._inertia = false;
      };
      
      
      

    const unfreezeCell = (gridIndex, reason) => {
      const d = dotsRef.current[gridIndex];
      if (!d) return;
      if (reason === 'hover' && d._frozenBy === 'hover') d._frozenBy = null;
      if (reason === 'active' && d._frozenBy === 'active') d._frozenBy = null;
    };

    const onMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const px = e.clientX - rect.left, py = e.clientY - rect.top;
      
        // 1) Hacemos HIT‑TEST sobre la posición base del dot (cx, cy)
        let found = null;
        for (const n of nodesRef.current) {
          const d = dotsRef.current[n.gridIndex];
          const dx = px - d.cx;
          const dy = py - d.cy;
          const dist = Math.hypot(dx, dy);
          if (dist <= n.baseR) {
            found = { ...n, x: d.cx, y: d.cy, r: n.baseR };
            break;
          }
        }
      
        // 2) Gestionamos el hover y congelamos al instante el dot
        if (found) {
            if (hover?.gridIndex != null && hover.gridIndex !== found.gridIndex) {
              unfreezeCell(hover.gridIndex, 'hover');
            }
// 2) Congela el dot en el frame de hover y detiene física inmediatamente
if (found) {
    if (hover?.gridIndex != null && hover.gridIndex !== found.gridIndex) {
      unfreezeCell(hover.gridIndex, 'hover');
    }
    freezeCell(found.gridIndex, 'hover');
    setHover({ id: found.id, x: px, y: py, r: found.r, item: found.item, gridIndex: found.gridIndex });
    return; // Establecido: no se corre la física en este movimiento
  }
  
          }
          
      
        // 3) Física: no empujar dots congelados ni el que está en hover
        const now = performance.now();
        const dt = state.lastTime ? now - state.lastTime : 16;
        const dx = e.clientX - state.lastX;
        const dy = e.clientY - state.lastY;
        state.lastTime = now;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
      
        let vx = (dx / dt) * 1000;
        let vy = (dy / dt) * 1000;
        let speed = Math.hypot(vx, vy);
        const maxSpeed = 5000;
        if (speed > maxSpeed) {
          const s = maxSpeed / speed;
          vx *= s;
          vy *= s;
          speed = maxSpeed;
        }
      
        if (speed > speedTrigger) {
          for (const d of dotsRef.current) {
            if (d._frozenBy) continue; // ❄️ No empujar si está congelado
            if (hover && dotsRef.current[hover.gridIndex] === d) continue; // 👈 No empujar si es el hover actual
      
            const dist = Math.hypot(d.cx - px, d.cy - py);
            if (dist < proximity && !d._inertia) {
              d._inertia = true;
              gsap.killTweensOf(d);
              const pushX = d.cx - px + vx * 0.005;
              const pushY = d.cy - py + vy * 0.005;
              gsap.to(d, {
                inertia: { xOffset: pushX, yOffset: pushY, resistance },
                onComplete: () => {
                  gsap.to(d, {
                    xOffset: 0,
                    yOffset: 0,
                    duration: returnDuration,
                    ease: 'elastic.out(1,0.75)',
                  });
                  d._inertia = false;
                },
              });
            }
          }
        }
      };
      

    const onClick = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const px = e.clientX - rect.left, py = e.clientY - rect.top;

      const n = hitTestByCell(px, py);

      // Shockwave SIEMPRE, pero excluye la celda activa (para que no se mueva)
      const excludeIndex = (active?.gridIndex != null) ? active.gridIndex : null;

      for (const d of dotsRef.current) {
        if (d._frozenBy === 'active') continue;           // activo nunca se mueve
        if (excludeIndex != null && dotsRef.current[excludeIndex] === d) continue;

        const dist = Math.hypot(d.cx - px, d.cy - py);
        if (dist < shockRadius && !d._inertia && !d._frozenBy) {
          d._inertia = true;
          gsap.killTweensOf(d);
          const fall = Math.max(0, 1 - dist / shockRadius);
          gsap.to(d, {
            inertia: { xOffset:(d.cx-px)*shockStrength*fall, yOffset:(d.cy-py)*shockStrength*fall, resistance },
            onComplete: () => {
              gsap.to(d, { xOffset:0, yOffset:0, duration:returnDuration, ease:'elastic.out(1,0.75)' });
              d._inertia = false;
            }
          });
        }
      }

      // Si se clicó un data dot -> marcar activo y congelar sólo su celda
      if (n) {
        // descongela cualquier antiguo 'active'
        if (active?.gridIndex != null) unfreezeCell(active.gridIndex, 'active');

        freezeCell(n.gridIndex, 'active');
        setActive(n);
        onSelect?.(n.item);
      } else {
        // click vacío: no cambiamos el panel
      }
    };

    const el = canvasRef.current;
    if (!el) return;
    const tm = throttle(onMove, 16);
    el.addEventListener('mousemove', tm, { passive:true });
    el.addEventListener('click', onClick);

    return () => {
      el.removeEventListener('mousemove', tm);
      el.removeEventListener('click', onClick);
      // al desmontar, limpia cualquier 'hover' freeze
      if (hover?.gridIndex != null) unfreezeCell(hover.gridIndex, 'hover');
    };
  }, [hover, active, speedTrigger, proximity, resistance, returnDuration, shockRadius, shockStrength, onSelect]);

  /* ---------- API: desactivar activo (cuando cierres panel) ---------- */
  // Llama a onSelect(null) desde fuera y pasa active=null aquí para soltar el freeze:
  useEffect(() => {
    if (!active) return;
    // cuando el padre haga onSelect(null), desactiva:
    const off = (e) => {
      if (e.detail !== 'DATADOTGRID_CLEAR_ACTIVE') return;
      // unfreeze active cell
      if (active.gridIndex != null) {
        const d = dotsRef.current[active.gridIndex];
        if (d && d._frozenBy === 'active') d._frozenBy = null;
      }
      setActive(null);
    };
    window.addEventListener('datadotgrid', off);
    return () => window.removeEventListener('datadotgrid', off);
  }, [active]);

  /* ---------- Tooltip HTML ---------- */
  const [tooltip, setTooltip] = useState(null);
  useEffect(() => {
    if (!hover || active) { setTooltip(null); return; }
    setTooltip({ x: hover.x + tooltipOffset.x, y: hover.y + tooltipOffset.y, item: hover.item });
  }, [hover, active, tooltipOffset.x, tooltipOffset.y]);

  return (
    <div className={`data-dot-grid ${className}`} style={{ position:'absolute', width:'100%', height:'100%', ...style }}>
      <div ref={wrapRef} style={{ position:'absolute', width:'100%', height:'100%' }}>
        <canvas
          ref={canvasRef}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', cursor:'crosshair' }}
        />
        {tooltip && (
          <div
            style={{
              position:'absolute',
              left: tooltip.x, top: tooltip.y, transform:'translateY(-50%)',
              background:'rgba(17,20,35,0.95)', border:'1px solid rgba(130,150,255,0.4)',
              borderRadius:8, padding:'10px 12px', color:'#D8E1FF',
              pointerEvents:'none', maxWidth:280, zIndex:2, boxShadow:'0 6px 20px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{fontSize:12, opacity:0.7}}>{tooltip.item.platform ?? tooltip.item.platformKey}</div>
            <div style={{fontWeight:700}}>{tooltip.item.title}</div>
            {tooltip.item.artists && <div style={{fontSize:12, opacity:0.85}}>{tooltip.item.artists}</div>}
            {typeof tooltip.item.rank==='number' && <div style={{marginTop:4, fontSize:12, color:'#9AE6B4'}}>#{tooltip.item.rank}</div>}
            {!!(tooltip.item.tags?.length) && (
              <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:6}}>
                {tooltip.item.tags.slice(0,5).map(t=>
                  <span key={t} style={{fontSize:11, background:'rgba(82,39,255,0.15)', border:'1px solid rgba(82,39,255,0.4)', padding:'2px 6px', borderRadius:999}}>{t}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}