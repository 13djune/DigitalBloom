// src/pages/Navigate.jsx
'use client';
import React, { useMemo, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import '../App.css'; 

import DataDotGrid from '../components/DataDotGrid'; // Volvemos a usar DataDotGrid
import DataPanel from '../components/DataPanel';

import deseoData from '../data/deseo-data(1).json';
import cuerpoData from '../data/cuerpo-data(2).json';
import rastroData from '../data/rastro-data(3).json';

const normalizeDatasets = (list) =>
  list.filter(Boolean).map((d, idx) => {
      const pid = Number(d.platformId);
      return { ...d, id: d.id ?? `${isNaN(pid) ? 'X' : pid}-${d.title ?? d.url ?? idx}`, platformId: isNaN(pid) ? undefined : pid, tags: Array.isArray(d.tags) ? d.tags : [] };
    }).filter(d => typeof d.platformId === 'number');

export default function Navigate() {
  const [selectedItem, setSelectedItem] = useState(null);
  const zoomHandler = useRef(() => {});

  const allData = useMemo(() => {
    const merged = [...deseoData, ...cuerpoData, ...rastroData];
    return normalizeDatasets(merged);
  }, []);

  return (
    <div className="navigate-page bg-background">
      <DataDotGrid 
        data={allData} 
        onSelect={setSelectedItem}
        timelineMode={true} // <-- ACTIVAMOS EL MODO TIMELINE
        onZoomChange={zoomHandler}
        dotSize={6}
        proximity={80}
      />

      <div className="navigate-ui z-40">
        <Link to="/explore" className="round-cta cursor-target" aria-label="Volver a Explorar">
          <Icon icon="pixelarticons:arrow-left" width="28" height="28" />
        </Link>
        
        <div className="zoom-controls">
          <button onClick={() => zoomHandler.current(1.2)} className="round-cta cursor-target" aria-label="Acercar">
            <Icon icon="pixelarticons:zoom-in" width="28" height="28" />
          </button>
          <button onClick={() => zoomHandler.current(1 / 1.2)} className="round-cta cursor-target" aria-label="Alejar">
            <Icon icon="pixelarticons:zoom-out" width="28" height="28" />
          </button>
        </div>

        <div className="timeline-info">
          <p>Línea de tiempo con <strong>{allData.length}</strong> puntos de datos.</p>
          <p>Arrastra para moverte y usa la rueda del ratón o los botones para hacer zoom.</p>
        </div>
      </div>

      <DataPanel
        item={selectedItem}
        allData={allData}
        onClose={() => setSelectedItem(null)}
        onSelect={setSelectedItem}
      />
    </div>
  );
}