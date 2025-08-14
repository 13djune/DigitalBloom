// src/pages/Explore.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import TargetCursor from "../components/TargetCursor";
import { Icon } from "@iconify/react";
import Filters from "../components/Filters";
import "../App.css";
import { Link, useLocation } from "react-router-dom";
import DataDotGrid from "../components/DataDotGrid";
import DataPanel from "../components/DataPanel"; 

/* ---------------------------------- */
/* Flag primera visita (tutorial)     */
/* ---------------------------------- */
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


/* ---------------------------------- */
/* Walkthrough                        */
/* ---------------------------------- */
function Walkthrough({ open, step, steps, onNext, onSkip }) {
  const bubbleRef = useRef(null);
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

    const choices = placement === "auto"
      ? [tryBottom, tryRight, tryTop, tryLeft]
      : placement === "top" ? [tryTop]
      : placement === "bottom" ? [tryBottom]
      : placement === "left" ? [tryLeft]
      : [tryRight];

    const margin = 16;
    const pick = choices.find(c =>
      c.top >= margin && c.left >= margin &&
      c.top + bh <= vh - margin && c.left + bw <= vw - margin
    ) || tryBottom;

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
          <div
            className="coach-spot"
            style={{
              width: spot.r * 2,
              height: spot.r * 2,
              left: spot.x - spot.r,
              top: spot.y - spot.r,
            }}
          />
        )}
      </div>

      <div
        ref={bubbleRef}
        className={`coach-bubble coach-arrow-${bubblePos.arrow}`}
        style={{ top: bubblePos.top, left: bubblePos.left, width: 320 }}
        role="dialog"
        aria-live="polite"
      >
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

/* ---------------------------------- */
/* Explore                            */
/* ---------------------------------- */
export default function Explore() {
  const { shouldShow, markSeen } = useFirstVisitFlag();
  const [open, setOpen] = useState(shouldShow);
  const [step, setStep] = useState(0);

  // tutorial steps
  const steps = useMemo(() => ([
    { selector: '#level-1',  text: 'Puedes explorar los datos por niveles de conciencia.', placement: 'left' },
    { selector: '#timeline', text: 'Y ver como cambian a lo largo del tiempo.', placement: 'top' },
    { selector: '#btn-filter', text: 'Filtra los datos como quieras.', placement: 'right' },
    { selector: '#btn-about',  text: 'Conoce mas sobre mi y el proyecto.', placement: 'right' },
  ]), []);

  useEffect(() => { setOpen(shouldShow); }, [shouldShow]);

  const handleSkip = useCallback(() => { setOpen(false); markSeen(); }, [markSeen]);

  const handleNext = useCallback(() => {
    setStep(s => {
      const next = s + 1;
      if (next >= steps.length) { setOpen(false); markSeen(); return s; }
      return next;
    });
  }, [steps.length, markSeen]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleNext(); }
      else if (e.key === "Escape") { handleSkip(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleNext, handleSkip]);

  /* ---------- Estado UI local ---------- */
  const [activeLevel, setActiveLevel] = useState(1);
  const levels = [
    { id: 1, label: "DESEO" },
    { id: 2, label: "CUERPO" },
    { id: 3, label: "RASTRO" },
  ];

  const [activeTime, setActiveTime] = useState(1);
  const times = [
    { id: 1, label: "ULTIMAS 4 SEMANAS" },
    { id: 2, label: "ULTIMOS 6 MESES" },
    { id: 3, label: "ULTIMO AÑO" },
  ];

  const [showFilters, setShowFilters] = useState(false);

  /* ---------- Filtros aplicados + badge ---------- */
  const [appliedFilters, setAppliedFilters] = useState(null);
  const appliedCount = useMemo(() => {
    if (!appliedFilters) return 0;
    const { level, time, platforms = [], tags = [] } = appliedFilters;
    return (level ? 1 : 0) + (time ? 1 : 0) + platforms.length + tags.length;
  }, [appliedFilters]);

  /* ---------- Leer filtros desde la URL ---------- */
  const location = useLocation();

  const parseList = (sp, key, asNumber = false) => {
    // admite ?tag=a&tag=b y también ?tag=a,b
    const many = sp.getAll(key);
    const vals = many.length ? many : (sp.get(key)?.split(",") || []);
    const clean = vals.map(v => v?.trim()).filter(Boolean);
    return asNumber ? clean.map(Number).filter(Boolean) : clean;
  };

  useEffect(() => {
    if (!location.search) return;
    const sp = new URLSearchParams(location.search);

    const level = Number(sp.get("level")) || 1;
    const time  = Number(sp.get("time"))  || 1;
    const platforms = parseList(sp, "platform", true);
    const tags      = parseList(sp, "tag", false);

    const state = { level, time, platforms, tags };
    setAppliedFilters(state);       // badge
    setActiveLevel(level);          // UI niveles
    setActiveTime(time);            // UI tiempo
  }, [location.search]);
  const dummyData = [
    {
      id: 1,
      title: "Track 1",
      artists: "Artista 1",
      awareness: 1,
      timeBucket: "4w",
      platformId: 1,
      rank: 1,
      tags: ["Pop", "Inglés"]
    },
    {
      id: 2,
      title: "Track 2",
      artists: "Artista 2",
      awareness: 2,
      timeBucket: "6m",
      platformId: 2,
      rank: 3,
      tags: ["Rock", "Español"]
    },
    {
      id: 3,
      title: "Track 3",
      artists: "Artista 3",
      awareness: 3,
      timeBucket: "1y",
      platformId: 3,
      rank: 2,
      tags: ["Electroclash"]
    }
  ];
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <div className="explore-page bg-background">
      <TargetCursor targetSelector=".cursor-target" />

      {/* Izquierda: botones de filtro e info */}
      <div className="left-rail z-40">
        <button
          id="btn-filter"
          className="round-cta cursor-target has-badge"
          onClick={() => setShowFilters(true)}
          aria-label="Filtros"
        >
          <Icon icon="pixelarticons:sliders" width="28" height="28" />
          {appliedCount > 0 && <span className="cta-badge">{appliedCount}</span>}
        </button>

        <Link
          to="/about"
          id="btn-about"
          className="round-cta cursor-target"
          aria-label="Acerca de"
        >
          <Icon icon="pixelarticons:lightbulb-2" width="28" height="28" />
        </Link>
      </div>

      {/* Modal de filtros */}
      <Filters
        open={showFilters}
        onClose={() => setShowFilters(false)}
        initialState={appliedFilters}  
        onApply={(state) => {
          setAppliedFilters(state);
          setShowFilters(false);
          if (state?.level) setActiveLevel(state.level);
          if (state?.time) setActiveTime(state.time);
          
        }}
        onReset={() => {
          // si limpiar el badge al resetear:
          setAppliedFilters(null);
        }}
      />

      {/* Derecha: niveles estilo timeline vertical */}
      <div className="levels-vertical z-40">
        {levels.map((lv, i) => (
          <React.Fragment key={lv.id}>
            <button
              id={`level-${lv.id}`}
              className={`time node cursor-target level-item ${activeLevel === lv.id ? "is-active" : ""}`}
              onClick={() => setActiveLevel(lv.id)}
              aria-pressed={activeLevel === lv.id}
              aria-label={lv.label}
            >
              <div className={`box ${activeLevel === lv.id ? "box--active" : "box--inactive"}`}>
                <span className="box-num">{lv.id}</span>
              </div>
              <div className="caption">{lv.label}</div>
            </button>
            {i < levels.length - 1 && <div className="track-vertical" aria-hidden />}
          </React.Fragment>
        ))}
      </div>

      {/* Abajo: timeline */}
      <div id="timeline" className="timeline z-40">
        {times.map((t, i) => (
          <div key={t.id} className="timeline-segment">
            <button
              className={`time-item cursor-target ${activeTime === t.id ? "is-active" : ""}`}
              onClick={() => setActiveTime(t.id)}
              aria-pressed={activeTime === t.id}
            >
              <div className="time-card">{t.label}</div>
              <div className="time-label">{t.label}</div>
            </button>
            {i < times.length - 1 && <div className="track" aria-hidden />}
          </div>
        ))}
      </div>

      {/* Re-abrir tutorial si ya fue visto */}
      <button
        className="help-fab cursor-target z-40"
        onClick={() => { setStep(0); setOpen(true); }}
        aria-label="Ver tutorial"
        title="Ver tutorial"
      >
        ?
      </button>

      {/* Walkthrough */}
      <Walkthrough
        open={open}
        step={step}
        steps={steps}
        onNext={handleNext}
        onSkip={handleSkip}
      />
   <DataDotGrid
  data={dummyData}
  filters={appliedFilters || { level: 1, time: 1, platforms: [], tags: [] }}
  onSelect={(item) => {
    setSelectedItem(item);
  }}
/>
<DataPanel
  item={selectedItem}
  onClose={() => {
    setSelectedItem(null);
    window.dispatchEvent(new CustomEvent('datadotgrid', { detail: 'DATADOTGRID_CLEAR_ACTIVE' }));
  }}
/>


    </div>
  );
}
