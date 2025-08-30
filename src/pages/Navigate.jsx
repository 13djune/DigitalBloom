'use client';
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import '../App.css';

import TimelineDotGrid from '../components/TimelineDotGrid';
import DataPanel from '../components/DataPanel';

import deseoData from '../data/deseo-data(1).json';
import cuerpoData from '../data/cuerpo-data(2).json';
import rastroData from '../data/rastro-data(3).json';

// --- CAMBIO: Importamos la configuración global ---
import { platformConfig as PLATFORM_CONFIG } from '../utils/globalConfig'; // Asegúrate de que la ruta sea correcta

// Normaliza los datos y les asigna un nivel
const normalizeAndLevelDatasets = (list, level) =>
  list.filter(Boolean).map((d, idx) => ({
    ...d,
    id: d.id ?? `${Number(d.platformId)}-${d.title ?? idx}`,
    level,
    tags: Array.isArray(d.tags) ? d.tags : [],
  }));

/* ---------- HOOK PARA GESTIONAR LA PRIMERA VISITA ---------- */
const useFirstVisitFlag = (key = "navigate_tutorial_seen") => {
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

/* ---------- COMPONENTE DEL WALKTHROUGH ---------- */
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


/* ---------- DATOS Y COMPONENTE PARA LAS LEYENDAS EN PANTALLA ---------- */
// --- CAMBIO: La constante PLATFORM_CONFIG se ha eliminado de aquí ---
const AWARENESS_LEVELS = ['DESEO', 'CUERPO', 'RASTRO'];
const TIME_PERIODS = ['ÚLTIMAS 4 SEMANAS', 'ÚLTIMOS 6 MESES', 'ÚLTIMO AÑO'];

function LayoutLegends({ organization }) {
  return (
    <>
      {/* --- LEYENDAS PARA VISTA "TODO JUNTO" --- */}
      {organization === 'all' && (
        <>
          <div className="screen-legend legend-bottom-left">
            <p className="legend-title">Plataformas</p>
            {PLATFORM_CONFIG.map(p => (
              <div key={p.id} className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: p.color }}></span>
                {p.name}
              </div>
            ))}
          </div>
          <div className="screen-legend legend-top-right-deseo">
            <div className="legend-vertical-items-only">
              {AWARENESS_LEVELS.map(level => (
                <div key={level} className="legend-item">{level}</div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* --- LEYENDA INDIVIDUAL PARA VISTA "PLATAFORMAS" --- */}
      {organization === 'platform' && (
        <div className="screen-legend legend-bottom-left">
          <p className="legend-title">Plataformas</p>
          <div className='flex justify-around items-center w-[15dvw] flex-wrap'>

          {PLATFORM_CONFIG.map(p => (
            <div key={p.id} className="legend-item">
              <span className="color-swatch" style={{ backgroundColor: p.color }}></span>
              {p.name}
            </div>
          ))}
          </div>
        </div>
      )}

      {/* --- LEYENDA DE PERIODOS DE TIEMPO --- */}
      {(organization === 'all' || organization === 'time') && (
        <div className="screen-legend legend-bottom-center">
          <div className="legend-horizontal-items">
            {TIME_PERIODS.map(period => <div key={period}>{period}</div>)}
          </div>
        </div>
      )}



      {/* --- LEYENDA HORIZONTAL PARA VISTA "CONCIENCIA" --- */}
      {organization === 'awareness' && (
        <div className="screen-legend legend-bottom-center">
          <div className="legend-horizontal-items">
            {AWARENESS_LEVELS.map(level => <div key={level}>{level}</div>)}
          </div>
        </div>
      )}
    </>
  );
}


/* ---------- PÁGINA PRINCIPAL ---------- */
export default function Navigate() {
  const [selectedItem, setSelectedItem] = useState(null);
  const zoomHandler = useRef(() => {});
  const [organization, setOrganization] = useState('all');

  const { shouldShow, markSeen } = useFirstVisitFlag('navigate_tutorial_seen');
  const [isWalkthroughOpen, setWalkthroughOpen] = useState(shouldShow);
  const [walkthroughStep, setWalkthroughStep] = useState(0);

  const steps = useMemo(() => ([
    { selector: '.screen-legend', text: 'Las leyendas te dan información clave sobre los datos que estás viendo.', placement: 'right' },
    { selector: '#organization-controls', text: 'Usa estos botones para cambiar la forma en que se organizan los datos en pantalla.', placement: 'left'},
    { selector: '#zoom-controls', text: 'Acércate o aléjate para explorar en detalle.', placement: 'top'},
    { text: 'Cada punto es un dato. ¡Haz clic en cualquiera para ver su información completa!' }
  ]), []);
  
  const handleSkipTutorial = useCallback(() => { setWalkthroughOpen(false); markSeen(); }, [markSeen]);
  const handleNextTutorialStep = useCallback(() => {
    setWalkthroughStep(s => {
      const next = s + 1;
      if (next >= steps.length) { setWalkthroughOpen(false); markSeen(); return s; }
      return next;
    });
  }, [steps.length, markSeen]);

  useEffect(() => { setWalkthroughOpen(shouldShow); }, [shouldShow]);

  const allData = useMemo(() => {
    const deseo = normalizeAndLevelDatasets(deseoData, 1);
    const cuerpo = normalizeAndLevelDatasets(cuerpoData, 2);
    const rastro = normalizeAndLevelDatasets(rastroData, 3);
    return [...deseo, ...cuerpo, ...rastro];
  }, []);

  const organizationOptions = [
    { id: 'all', label: 'Todo Junto', icon: 'pixelarticons:grid' },
    { id: 'time', label: 'Por Tiempos', icon: 'pixelarticons:clock' },
    { id: 'awareness', label: 'Por Consciente', icon: 'pixelarticons:human-handsup' },
    { id: 'platform', label: 'Por Plataformas', icon: 'pixelarticons:device-phone' },
  ];
  
  return (
    <div className="navigate-page bg-background">
      
      <TimelineDotGrid
        data={allData}
        onSelect={setSelectedItem}
        onZoomChange={zoomHandler}
        organization={organization}
      />

      <div className='navigate-ui-right z-40'>
        <div id="organization-controls" className="organization-controls">
          {organizationOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setOrganization(opt.id)}
              className={`round-cta cursor-target ${organization === opt.id ? 'active' : ''}`}
              aria-label={opt.label}
              title={opt.label}
            >
              <Icon icon={opt.icon} width="28" height="28" />
            </button>
          ))}
        </div>
      </div>

      <div className="navigate-ui z-40">
        <Link to="/explore" id="btn-back-to-explore" className="round-cta cursor-target" aria-label="Volver a Explorar">
          <Icon icon="pixelarticons:arrow-left" width="28" height="28" />
        </Link>
        <div id="zoom-controls" className="zoom-controls">
          <button onClick={() => zoomHandler.current(1.2)} className="round-cta cursor-target" aria-label="Acercar">
            <Icon icon="pixelarticons:zoom-in" width="28" height="28" />
          </button>
          <button onClick={() => zoomHandler.current(1 / 1.2)} className="round-cta cursor-target" aria-label="Alejar">
            <Icon icon="pixelarticons:zoom-out" width="28" height="28" />
          </button>
        </div>
        <div className="timeline-info">
          <p>Línea de tiempo con <strong className='text-accent text-lg'>{allData.length}</strong> puntos de datos.</p>
        </div>
      </div>
      
      <DataPanel
        item={selectedItem}
        allData={allData}
        onClose={() => setSelectedItem(null)}
        onSelect={setSelectedItem}
      />
      
      <LayoutLegends organization={organization} />
      
      <button className="help-fab cursor-target z-50" onClick={() => { setWalkthroughStep(0); setWalkthroughOpen(true); }} aria-label="Ver tutorial" title="Ver tutorial">
        ?
      </button>

      <Walkthrough
        open={isWalkthroughOpen}
        step={walkthroughStep}
        steps={steps}
        onNext={handleNextTutorialStep}
        onSkip={handleSkipTutorial}
      />
    </div>
  );
}