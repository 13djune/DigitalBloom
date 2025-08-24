// src/pages/Explore.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import TargetCursor from "../components/TargetCursor";
import { Icon } from "@iconify/react";
import Filters from "../components/Filters";
import "../App.css";
import { Link, useSearchParams } from "react-router-dom";
import DataDotGrid from "../components/DataDotGrid";
import DataPanel from "../components/DataPanel";

import deseoData from "../data/deseo-data(1).json";
import cuerpoData from "../data/cuerpo-data(2).json";
import rastroData from "../data/rastro-data(3).json";

const useFirstVisitFlag = (key = "explore_tutorial_seen") => {
  const [shouldShow, setShouldShow] = useState(() => {
    try { return !JSON.parse(localStorage.getItem(key) || "false"); }
    catch { return true; }
  });
  const markSeen = useCallback(() => {
    try { localStorage.setItem(key, "true"); } catch {}
    setShouldShow(false);
  }, [key]);
  return { shouldShow, markSeen };
};

function Walkthrough({ open, step, steps, onNext, onSkip }) {
  const bubbleRef = React.useRef(null);
  const [bubblePos, setBubblePos] = useState({ top: 0, left: 0, arrow: "top" });
  const [spot, setSpot] = useState({ x: null, y: null, r: 200 });

  const place = useCallback(() => {
    if (!open) return;
    const { selector, placement = "auto" } = steps[step] || {};
    const target = selector ? document.querySelector(selector) : null;
    const bubble = bubbleRef.current;
    const vw = window.innerWidth, vh = window.innerHeight;
    if (!target || !bubble) {
      const bw = 320, bh = 96;
      setBubblePos({ top: vh / 2 - bh / 2, left: vw / 2 - bw / 2, arrow: "top" });
      setSpot({ x: vw / 2, y: vh / 2, r: 220 });
      return;
    }
    const r = target.getBoundingClientRect();
    const bw = 320;
    const bh = bubble.offsetHeight || 96;
    const gap = 12;
    const tryTop = { top: r.top - bh - gap, left: r.left + r.width / 2 - bw / 2, arrow: "bottom" };
    const tryRight = { top: r.top + r.height / 2 - bh / 2, left: r.right + gap, arrow: "left" };
    const tryBottom = { top: r.bottom + gap, left: r.left + r.width / 2 - bw / 2, arrow: "top" };
    const tryLeft = { top: r.top + r.height / 2 - bh / 2, left: r.left - bw - gap, arrow: "right" };
    const choices = placement === "auto" ? [tryBottom, tryRight, tryTop, tryLeft] : [tryTop, tryRight, tryBottom, tryLeft];
    const margin = 16;
    const pick = choices.find(c => c.top >= margin && c.left >= margin && c.top + bh <= vh - margin && c.left + bw <= vw - margin) || tryBottom;
    setBubblePos(pick);
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const radius = Math.max(r.width, r.height) / 2 + 22;
    setSpot({ x: cx, y: cy, r: radius });
  }, [open, step, steps]);

  useEffect(() => { place(); }, [place]);
  useEffect(() => {
    if (!open) return;
    const r = () => place();
    window.addEventListener("resize", r);
    window.addEventListener("scroll", r, { passive: true });
    return () => {
      window.removeEventListener("resize", r);
      window.removeEventListener("scroll", r);
    };
  }, [open, place]);

  if (!open) return null;
  const current = steps[step] || {};

  return (
    <>
      <div className="coach-overlay" onClick={onSkip} aria-hidden>
        {spot.x != null && (
          <div className="coach-spot" style={{
            width: spot.r * 2,
            height: spot.r * 2,
            left: spot.x - spot.r,
            top: spot.y - spot.r,
          }} />
        )}
      </div>
      <div ref={bubbleRef} className={`coach-bubble coach-arrow-${bubblePos.arrow}`} style={{ top: bubblePos.top, left: bubblePos.left, width: 320 }} role="dialog" aria-live="polite">
        <div className="coach-body">{current.text}</div>
        <div className="coach-actions">
          <button className="btn ghost cursor-target" onClick={onSkip}>Omitir</button>
          <button className="btn cursor-target" onClick={onNext}>
            {step + 1 === steps.length ? "Entendido" : "Siguiente"}
          </button>
        </div>
        <div className="coach-steps">{step + 1} / {steps.length}</div>
      </div>
    </>
  );
}

export default function Explore() {
  const { shouldShow, markSeen } = useFirstVisitFlag();
  const [isWalkthroughOpen, setWalkthroughOpen] = useState(shouldShow);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const [, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(() => {
    const sp = new URLSearchParams(window.location.search);
    const platforms = sp.getAll('platforms').map(Number).filter(Boolean);
    const tags = sp.getAll('tags');
    return {
      level: Number(sp.get('level')) || 1,
      time: Number(sp.get('time')) || 1,
      platforms,
      tags,
    };
  });

  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (filters.level !== 1) newParams.set('level', filters.level);
    if (filters.time !== 1) newParams.set('time', filters.time);
    filters.platforms.forEach(p => newParams.append('platforms', p));
    filters.tags.forEach(t => newParams.append('tags', t));
    setSearchParams(newParams, { replace: true });
  }, [filters, setSearchParams]);

  const handleLevelChange = (newLevel) => setFilters(prev => ({ ...prev, level: newLevel }));
  const handleTimeChange = (newTime) => setFilters(prev => ({ ...prev, time: newTime }));

  const handleApplyFilters = (newFiltersFromModal) => {
    setFilters({
      time: Number(newFiltersFromModal.time),
      level: Number(newFiltersFromModal.level),
      platforms: (newFiltersFromModal.platforms || []).map(Number),
      tags: (newFiltersFromModal.tags || []),
    });
    
    setShowFiltersModal(false);
  };
  

  const handleResetFilters = () => {
    setFilters({ level: 1, time: 1, platforms: [], tags: [] });
    setShowFiltersModal(false);
  };

  const appliedCount = useMemo(() => {
    const { level, time, platforms, tags } = filters;
  
    const levelCount = level ? 1 : 0;    // ✅ cuenta aunque sea 1
    const timeCount = time ? 1 : 0;      // ✅ cuenta aunque sea 1
  
    return levelCount + timeCount + platforms.length + tags.length;
  }, [filters]);
  

// en Explore.jsx, al obtener allData (dentro de useMemo)
const allData = useMemo(() => {
  return [...deseoData, ...cuerpoData, ...rastroData]
    .filter(d => d && typeof d.platformId === 'number' && !isNaN(d.platformId));
}, []);


    const levels = useMemo(() => [{ id: 1, label: "DESEO" }, { id: 2, label: "CUERPO" }, { id: 3, label: "RASTRO" }], []);
  const times = useMemo(() => [{ id: 1, label: "ÚLTIMAS 4 SEMANAS" }, { id: 2, label: "ÚLTIMOS 6 MESES" }, { id: 3, label: "ÚLTIMO AÑO" }], []);
  const steps = useMemo(() => ([
    { selector: '#level-1', text: 'Puedes explorar los datos por niveles de conciencia.', placement: 'left' },
    { selector: '#timeline', text: 'Y ver como cambian a lo largo del tiempo.', placement: 'top' },
    { selector: '#btn-filter', text: 'Filtra los datos como quieras.', placement: 'right' },
    { selector: '#btn-about', text: 'Conoce más sobre mi y el proyecto.', placement: 'right' },
  ]), []);

  useEffect(() => { setWalkthroughOpen(shouldShow); }, [shouldShow]);
  const handleSkipTutorial = useCallback(() => { setWalkthroughOpen(false); markSeen(); }, [markSeen]);
  const handleNextTutorialStep = useCallback(() => {
    setWalkthroughStep(s => {
      const next = s + 1;
      if (next >= steps.length) { setWalkthroughOpen(false); markSeen(); return s; }
      return next;
    });
  }, [steps.length, markSeen]);

  return (
    <div className="explore-page bg-background">
      <TargetCursor targetSelector=".cursor-target" />

      <div className="left-rail z-40">
        <button id="btn-filter" className="round-cta cursor-target has-badge" onClick={() => setShowFiltersModal(true)} aria-label="Filtros">
          <Icon icon="pixelarticons:sliders" width="28" height="28" />
          {appliedCount > 0 && <span className="cta-badge">{appliedCount}</span>}
        </button>
        <Link to="/about" id="btn-about" className="round-cta cursor-target" aria-label="Acerca de">
          <Icon icon="pixelarticons:lightbulb-2" width="28" height="28" />
        </Link>
      </div>

      <Filters
        open={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        initialState={filters}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
      />

      <div className="levels-vertical z-40">
        {levels.map((lv, i, arr) => (
          <React.Fragment key={lv.id}>
            <button id={`level-${lv.id}`} className={`time node cursor-target level-item ${filters.level === lv.id ? "is-active" : ""}`} onClick={() => handleLevelChange(lv.id)} aria-pressed={filters.level === lv.id} aria-label={lv.label}>
              <div className={`box ${filters.level === lv.id ? "box--active" : "box--inactive"}`}>
                <span className="box-num">{lv.id}</span>
              </div>
              <div className="caption">{lv.label}</div>
            </button>
            {i < arr.length - 1 && <div className="track-vertical" aria-hidden />}
          </React.Fragment>
        ))}
      </div>

      <div id="timeline" className="timeline z-40">
  {times.map((t, i) => (
    <div key={t.id} className="timeline-segment">
      <button
        className={`time-item cursor-target ${filters.time === t.id ? "is-active" : ""}`}
        onClick={() => handleTimeChange(t.id)}
        aria-pressed={filters.time === t.id}
      >
        <div className="time-card">{t.label}</div>
        <div className="time-label">{t.label}</div>
      </button>
      {i < times.length - 1 && <div className="track" aria-hidden />}
    </div>
  ))}
</div>



      <button className="help-fab cursor-target z-40" onClick={() => { setWalkthroughStep(0); setWalkthroughOpen(true); }} aria-label="Ver tutorial" title="Ver tutorial">?</button>

      <Walkthrough open={isWalkthroughOpen} step={walkthroughStep} steps={steps} onNext={handleNextTutorialStep} onSkip={handleSkipTutorial} />

      <DataDotGrid
  data={allData}
  filters={filters}
  safePadding={{ top: 96, right: 260, bottom: 140, left: 140 }}
  clusterTightness={0.7}
  onSelect={(item) => setSelectedItem(item)}
/>


      {/** 👇 Esto es opcional: mensaje si no hay resultados visibles */}
      {allData.length > 0 && (
        <div style={{ textAlign: "center", color: "#ccc", marginTop: "1rem" }}>
          {/* Mostrar algo si no hay resultados */}
        </div>
      )}
<DataPanel
  item={selectedItem}
  allData={allData}
  onSelect={(item) => setSelectedItem(item)}
  onClose={() => {
    setSelectedItem(null);
    window.dispatchEvent(new CustomEvent('datadotgrid', { detail: 'DATADOTGRID_CLEAR_ACTIVE' }));
  }}
/>


    </div>
  );
}
