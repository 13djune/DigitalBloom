'use client';
import React, { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { Icon } from '@iconify/react';
import '../App.css';
import PixelLink from '../components/PixelLink';
import { useNavigate } from "react-router-dom";

import TimelineDotGrid from '../components/TimelineDotGrid';
import DataPanel from '../components/DataPanel';
import CustomTooltip from '../components/CustomTooltip'; 
import '../styles/Tooltip.css'; 

import deseoData from '../data/deseo-data(1).json';
import cuerpoData from '../data/cuerpo-data(2).json';
import rastroData from '../data/rastro-data(3).json';

import { platformConfig as PLATFORM_CONFIG } from '../utils/globalConfig';

const normalizeAndLevelDatasets = (list, level) =>
  list.filter(Boolean).map((d, idx) => ({
    ...d,
    id: d.id ?? `${Number(d.platformId)}-${d.title ?? idx}`,
    level,
    tags: Array.isArray(d.tags) ? d.tags : [],
  }));

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

function Walkthrough({ open, step, steps, onNext, onSkip }) {
    const bubbleRef = React.useRef(null);
    const [bubblePos, setBubblePos] = useState({ top: 0, left: 0, arrow: "top" });
    const [spot, setSpot] = useState({ x: null, y: null, r: 200 });
  
    const place = useCallback(() => {
      if (!open) return;
      const { selector } = steps[step] || {};
      const target = selector ? document.querySelector(selector) : null;
      const bubble = bubbleRef.current;
      const vw = window.innerWidth, vh = window.innerHeight;
      if (!target || !bubble) {
        setBubblePos({ top: vh / 2 - 48, left: vw / 2 - 160, arrow: "top" });
        setSpot({ x: vw / 2, y: vh / 2, r: 220 });
        return;
      }
      const r = target.getBoundingClientRect();
      setBubblePos({ top: r.bottom + 12, left: r.left + r.width / 2 - 160, arrow: "top" });
      setSpot({ x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.max(r.width, r.height) / 2 + 22 });
    }, [open, step, steps]);
  
    useEffect(() => { place(); }, [place]);

    if (!open) return null;
    const current = steps[step] || {};
  
    return (
      <>
        <div className="coach-overlay" onClick={onSkip} aria-hidden>
          {spot.x != null && (
            <div className="coach-spot" style={{ width: spot.r * 2, height: spot.r * 2, left: spot.x - spot.r, top: spot.y - spot.r }} />
          )}
        </div>
        <div ref={bubbleRef} className={`coach-bubble coach-arrow-${bubblePos.arrow}`} style={{ top: bubblePos.top, left: bubblePos.left, width: 320 }}>
          <div className="coach-body">{current.text}</div>
          <div className="coach-actions">
            <button className="btn ghost cursor-target" onClick={onSkip}>Omitir</button>
            <button className="btn cursor-target" onClick={onNext}>{step + 1 === steps.length ? "Entendido" : "Siguiente"}</button>
          </div>
          <div className="coach-steps">{step + 1} / {steps.length}</div>
        </div>
      </>
    );
}

function LayoutLegends({ organization, totalPoints }) {
    const TIME_PERIODS = ['ÚLTIMAS 4 SEMANAS', 'ÚLTIMOS 6 MESES', 'ÚLTIMO AÑO'];
    const AWARENESS = ['DESEO', 'CUERPO', 'RASTRO'];

    return (
    <>
        <div className="timeline-info fixed top-4 left-1/2 -translate-x-1/2 z-50">
          <p className="text-white bg-black/40 px-4 py-1 rounded-full text-lg">
            Línea de tiempo con <strong className='text-accent'>{totalPoints}</strong> puntos de datos.
          </p>
        </div>

        <div className="screen-legend legend-bottom-left">
            <p className="legend-title">Plataformas</p>
            {PLATFORM_CONFIG.map(p => (
              <div key={p.id} className="legend-item">
                <span className="color-swatch" style={{ backgroundColor: p.color }}></span>
                {p.name}
              </div>
            ))}
        </div>
        
        {organization === 'all' && (
          <div className="screen-legend legend-top-right-deseo">
            <div className="legend-vertical-items-only">
              {AWARENESS.map(level => <div key={level} className="legend-item">{level}</div>)}
            </div>
          </div>
        )}

        {(organization === 'all' || organization === 'time') && (
            <div className="screen-legend legend-bottom-center">
                <div className="legend-horizontal-items">
                    {TIME_PERIODS.map(period => <div key={period} className="legend-item">{period}</div>)}
                </div>
            </div>
        )}
        
        {organization === 'awareness' && (
            <div className="screen-legend legend-bottom-center">
                <div className="legend-horizontal-items">
                    {AWARENESS.map(level => <div key={level} className="legend-item">{level}</div>)}
                </div>
            </div>
        )}
    </>
  );
}

export default function Navigate() {
  const [selectedItem, setSelectedItem] = useState(null);
  const zoomHandler = useRef(() => {}); 
  const [organization, setOrganization] = useState('all');
  const navigate = useNavigate();

  const { shouldShow, markSeen } = useFirstVisitFlag('navigate_tutorial_seen');
  const [isWalkthroughOpen, setWalkthroughOpen] = useState(shouldShow);
  const [walkthroughStep, setWalkthroughStep] = useState(0);
  
  const [tooltip, setTooltip] = useState({ visible: false, text: "", targetRect: null });

  const handleMouseEnter = (e) => {
    const text = e.currentTarget.getAttribute('data-tooltip');
    const rect = e.currentTarget.getBoundingClientRect();
    if (text && rect) setTooltip({ visible: true, text, targetRect: rect });
  };
  const handleMouseLeave = () => setTooltip(prev => ({ ...prev, visible: false, targetRect: null }));

  const steps = useMemo(() => ([
    { selector: '.screen-legend', text: 'Las leyendas te dan información clave.' },
    { selector: '#organization-controls', text: 'Cambia la organización de los datos.' },
    { selector: '#zoom-controls', text: 'Explora en detalle.' }
  ]), []);
  
  const handleSkipTutorial = useCallback(() => { setWalkthroughOpen(false); markSeen(); }, [markSeen]);
  const handleNextTutorialStep = useCallback(() => {
    setWalkthroughStep(s => {
      if (s + 1 >= steps.length) { setWalkthroughOpen(false); markSeen(); return s; }
      return s + 1;
    });
  }, [steps.length, markSeen]);

  const allData = useMemo(() => {
    const d = normalizeAndLevelDatasets(deseoData, 1);
    const c = normalizeAndLevelDatasets(cuerpoData, 2);
    const r = normalizeAndLevelDatasets(rastroData, 3);
    return [...d, ...c, ...r];
  }, []);

  // --- MODIFICACIÓN CLAVE: Simplificado para solo actualizar estado ---
  const handleSelectItem = (item) => {
    setSelectedItem(item);
    // Ya no llamamos a zoomHandler manualmente aquí porque
    // TimelineDotGrid escucha cambios en la prop 'selectedItem'
  };

  return (
    <div className="navigate-page bg-background">
      <CustomTooltip text={tooltip.text} visible={tooltip.visible} targetRect={tooltip.targetRect} />

      <TimelineDotGrid
        data={allData}
        selectedItem={selectedItem} // <--- NUEVA PROP CONECTADA
        onSelect={handleSelectItem}
        onZoomChange={zoomHandler}
        organization={organization}
      />

      <div className='navigate-ui-right z-40'>
        <div id="organization-controls" className="organization-controls">
          {[
            { id: 'all', label: 'Todo Junto', icon: 'pixelarticons:grid' },
            { id: 'time', label: 'Por Tiempos', icon: 'pixelarticons:clock' },
            { id: 'awareness', label: 'Por Conciencia', icon: 'pixelarticons:human-handsup' },
            { id: 'platform', label: 'Por Plataformas', icon: 'pixelarticons:device-phone' },
          ].map(opt => (
            <button key={opt.id} onClick={() => setOrganization(opt.id)} className={`round-cta m-5 cursor-target ${organization === opt.id ? 'active' : ''}`} data-tooltip={opt.label} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              <Icon icon={opt.icon} width="28" height="28" />
            </button>
          ))}
        </div>
      </div>

      <div className="navigate-ui z-40">
        <PixelLink onClick={() => navigate(-1)} className="round-cta cursor-target" data-tooltip="Volver">
          <Icon icon="pixelarticons:arrow-left" width="28" height="28" />
        </PixelLink>
        <div id="zoom-controls" className="zoom-controls">
          {/* Estos controles siguen usando el zoomHandler ref para zoom manual */}
          <button onClick={() => zoomHandler.current(1.1)} className="round-cta cursor-target" data-tooltip="Acercar" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <Icon icon="pixelarticons:zoom-in" width="28" height="28" />
          </button>
          <button onClick={() => zoomHandler.current(1 / 1.1)} className="round-cta cursor-target" data-tooltip="Alejar" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <Icon icon="pixelarticons:zoom-out" width="28" height="28" />
          </button>
        </div>
      </div>
      
      <DataPanel 
        item={selectedItem} 
        allData={allData} 
        onClose={() => setSelectedItem(null)} 
        onSelect={handleSelectItem} 
        className="z-100"
      />
      
      <LayoutLegends organization={organization} totalPoints={allData.length} />
      
      <button className="help-fab cursor-target z-50" onClick={() => { setWalkthroughStep(0); setWalkthroughOpen(true); }}>?</button>

      <Walkthrough open={isWalkthroughOpen} step={walkthroughStep} steps={steps} onNext={handleNextTutorialStep} onSkip={handleSkipTutorial} />
    </div>
  );
}