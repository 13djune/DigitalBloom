// src/pages/Explore.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Icon } from "@iconify/react";
import Filters from "../components/Filters";
import "../App.css";
import PixelLink from '../components/PixelLink';

import {  useNavigate } from "react-router-dom"; // <-- useSearchParams ya no se importa
import DataDotGrid from "../components/DataDotGrid";
import DataPanel from "../components/DataPanel";
import CustomTooltip from "../components/CustomTooltip";
import "../styles/Tooltip.css";

// Importación de datos
import deseoData from "../data/deseo-data(1).json";
import cuerpoData from "../data/cuerpo-data(2).json";
import rastroData from "../data/rastro-data(3).json";

// NUEVAS IMPORTACIONES: Configuración para normalizar y la utilidad de filtrado
import { TIME_ID_TO_BUCKET, DEFAULT_PLATFORM_ID_TO_KEY } from "../utils/globalConfig";
import { filterData } from "../utils/filterUtils";

// ... (El componente Walkthrough y el hook useFirstVisitFlag no cambian)
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

const normalizeDataset = (data, level) =>
  data.filter(Boolean).map((d, idx) => {
    const pid = Number(d.platformId);
    return {
      ...d,
      id: d.id ?? `${pid}-${d.title ?? d.url ?? idx}`,
      platformId: pid,
      platformKey: DEFAULT_PLATFORM_ID_TO_KEY[pid] ?? 'UNKNOWN',
      awareness: level,
      timeBucket: d.timeBucket ?? TIME_ID_TO_BUCKET[Number(d.time) || 1] ?? '4w',
      tags: Array.isArray(d.tags) ? d.tags : [],
    };
  }).filter(d => d.platformKey !== 'UNKNOWN' && Number.isFinite(d.platformId));


export default function Explore() {
  const { shouldShow, markSeen } = useFirstVisitFlag();
  const [isWalkthroughOpen, setWalkthroughOpen] = useState(shouldShow);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  const navigate = useNavigate();

  // La línea con useSearchParams fue eliminada
  
  const [filters, setFilters] = useState(() => {
    // Leemos la URL directamente para establecer el estado inicial
    const sp = new URLSearchParams(window.location.search);
    return {
      level: Number(sp.get('level')) || 1,
      time: Number(sp.get('time')) || 1,
      platforms: sp.getAll('platforms').map(Number).filter(Boolean),
      tags: sp.getAll('tags'),
    };
  });

  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [tooltip, setTooltip] = useState({ visible: false, text: "", targetRect: null });

  const allData = useMemo(() => {
    return [
      ...normalizeDataset(deseoData, 1),
      ...normalizeDataset(cuerpoData, 2),
      ...normalizeDataset(rastroData, 3)
    ];
  }, []);

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (filters.level !== 1) newParams.set('level', String(filters.level));
    if (filters.time !== 1) newParams.set('time', String(filters.time));
    filters.platforms.forEach(p => newParams.append('platforms', String(p)));
    filters.tags.forEach(t => newParams.append('tags', t));
    navigate(`?${newParams.toString()}`, { replace: true });
  }, [filters, navigate]);

  const currentFilteredData = useMemo(() => filterData(allData, filters), [allData, filters]);

  useEffect(() => {
    if (currentFilteredData.length > 0 || showFiltersModal) {
      return;
    }

    let bestCombination = { level: -1, time: -1, count: 0 };
    const availableLevels = [1, 2, 3];
    const availableTimes = [1, 2, 3];

    for (const level of availableLevels) {
      for (const time of availableTimes) {
        const tempFilters = { ...filters, level, time };
        const result = filterData(allData, tempFilters);
        
        if (result.length > bestCombination.count) {
          bestCombination = { level, time, count: result.length };
        }
      }
    }

    if (bestCombination.count > 0 && (bestCombination.level !== filters.level || bestCombination.time !== filters.time)) {
      setFilters(prev => ({
        ...prev,
        level: bestCombination.level,
        time: bestCombination.time,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFilteredData.length, allData, showFiltersModal]);

  const handleMouseEnter = (e) => {
    const text = e.currentTarget.getAttribute('data-tooltip');
    const rect = e.currentTarget.getBoundingClientRect();
    if (text && rect) setTooltip({ visible: true, text, targetRect: rect });
  };
  
  const handleMouseLeave = () => setTooltip(prev => ({ ...prev, visible: false, targetRect: null }));
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
    return 1 + 1 + filters.platforms.length + filters.tags.length;
  }, [filters]);

  const levels = useMemo(() => [{ id: 1, label: "DESEO" }, { id: 2, label: "CUERPO" }, { id: 3, label: "RASTRO" }], []);
  const times = useMemo(() => [{ id: 1, label: "ÚLTIMAS 4 SEMANAS" }, { id: 2, label: "ÚLTIMOS 6 MESES" }, { id: 3, label: "ÚLTIMO AÑO" }], []);
  const steps = useMemo(() => ([
    { selector: '#level-1', text: 'Puedes explorar los datos por niveles de conciencia, de lo más consciente (deseo) a lo más involuntario (rastro).', placement: 'left' },
    { selector: '#timeline', text: 'Selecciona un periodo de tiempo para ver su evolución. Cada periodo es independiente y no se acumula con los demás.', placement: 'top' },
    { selector: '#btn-filter', text: 'Filtra los datos como quieras.', placement: 'right' },
    { selector: '#btn-navigate', text: 'Haz clic aquí para navegar toda la huella completa.', placement: 'right' },
    { selector: '#btn-about', text: 'Conoce más sobre mí y el proyecto.', placement: 'right' },
    { text: 'Cada punto es un dato. ¡Haz clic en cualquiera para ver su información completa!', placement: 'top' }
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
      <CustomTooltip text={tooltip.text} visible={tooltip.visible} targetRect={tooltip.targetRect} />

      <div className="left-rail z-40">
        <PixelLink   onClick={() => navigate(-1)}
 className="round-cta cursor-target" data-tooltip="Volver" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Icon icon="pixelarticons:arrow-left" width="28" height="28" />
        </PixelLink>
        <button id="btn-filter" className="round-cta cursor-target has-badge" onClick={() => setShowFiltersModal(true)} data-tooltip="Filtros" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Icon icon="pixelarticons:sliders" width="28" height="28" />
          {appliedCount > 2 && <span className="cta-badge">{appliedCount}</span>}
        </button>
        <PixelLink to="/navigate" id="btn-navigate" className="round-cta cursor-target" data-tooltip="Navegar Huella Completa" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Icon icon="pixelarticons:map" width="28" height="28" />
        </PixelLink>
        <PixelLink to="/about" id="btn-about" className="round-cta cursor-target" data-tooltip="Sobre mí y el proyecto" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <Icon icon="pixelarticons:lightbulb-2" width="28" height="28" />
        </PixelLink>
      </div>

      <Filters open={showFiltersModal} onClose={() => setShowFiltersModal(false)} initialState={filters} onApply={handleApplyFilters} onReset={handleResetFilters} />

      <div className="levels-vertical z-40">
        {levels.map((lv, i, arr) => (
          <React.Fragment key={lv.id}>
            <button id={`level-${lv.id}`} className={`time node cursor-target level-item ${filters.level === lv.id ? "is-active" : ""}`} onClick={() => handleLevelChange(lv.id)} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <div className={`box ${filters.level === lv.id ? "box--active" : "box--inactive"}`}><span className="box-num">{lv.id}</span></div>
              <div className="caption">{lv.label}</div>
            </button>
            {i < arr.length - 1 && <div className="track-vertical" aria-hidden />}
          </React.Fragment>
        ))}
      </div>

      <div id="timeline" className="timeline z-40">
        {times.map((t, i) => (
          <div key={t.id} className="timeline-segment">
            <button className={`time-item cursor-target ${filters.time === t.id ? "is-active" : ""}`} onClick={() => handleTimeChange(t.id)}>
              <div className="time-card">{t.label}</div>
              <div className="time-label">{t.label}</div>
            </button>
            {i < times.length - 1 && <div className="track" aria-hidden />}
          </div>
        ))}
      </div>

      <button className="help-fab cursor-target z-40" onClick={() => { setWalkthroughStep(0); setWalkthroughOpen(true); }} data-tooltip="Ver tutorial" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        ?
      </button>

      <Walkthrough open={isWalkthroughOpen} step={walkthroughStep} steps={steps} onNext={handleNextTutorialStep} onSkip={handleSkipTutorial} />

      <DataDotGrid
        data={allData}
        filters={filters}
        onSelect={(item) => setSelectedItem(item)}
      />
      
      <DataPanel
        item={selectedItem}
        allData={allData}
        onClose={() => {
          setSelectedItem(null);
          window.dispatchEvent(new CustomEvent('datadotgrid', { detail: 'DATADOTGRID_CLEAR_ACTIVE' }));
        }}
        onSelect={(itm) => setSelectedItem(itm)}
      />
    </div>
  );
}