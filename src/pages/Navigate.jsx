'use client';
import React, { useMemo, useState, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';
import '../App.css';

import TimelineDotGrid from '../components/TimelineDotGrid';
import DataPanel from '../components/DataPanel';

import deseoData from '../data/deseo-data(1).json';
import cuerpoData from '../data/cuerpo-data(2).json';
import rastroData from '../data/rastro-data(3).json';

const normalizeAndLevelDatasets = (list, level) =>
  list.filter(Boolean).map((d, idx) => ({
    ...d,
    id: d.id ?? `${Number(d.platformId)}-${d.title ?? idx}`,
    level,
    tags: Array.isArray(d.tags) ? d.tags : [],
  }));

export default function Navigate() {
  const [selectedItem, setSelectedItem] = useState(null);
  const zoomHandler = useRef(() => {});
  
  const [organization, setOrganization] = useState('all'); // 'all', 'time', 'awareness', 'platform'

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
      <div className="timeline-labels z-40">
        {organization === 'all' && (
          <>
            <div style={{ top: '25%' }}>DESEO</div>
            <div style={{ top: '50%' }}>CUERPO</div>
            <div style={{ top: '75%' }}>RASTRO</div>
          </>
        )}
      </div>

      <TimelineDotGrid
        data={allData}
        onSelect={setSelectedItem}
        onZoomChange={zoomHandler}
        organization={organization}
      />

      <div className="navigate-ui z-40">
        <Link to="/explore" className="round-cta cursor-target" aria-label="Volver a Explorar">
          <Icon icon="pixelarticons:arrow-left" width="28" height="28" />
        </Link>
        
        <div className="organization-controls">
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

        <div className="zoom-controls">
          <button onClick={() => zoomHandler.current(1.2)} className="round-cta cursor-target" aria-label="Acercar">
            <Icon icon="pixelarticons:zoom-in" width="28" height="28" />
          </button>
          <button onClick={() => zoomHandler.current(1 / 1.2)} className="round-cta cursor-target" aria-label="Alejar">
            <Icon icon="pixelarticons:zoom-out" width="28" height="28" />
          </button>
        </div>

        <div className="timeline-info">
          <p>Línea de tiempo con <strong className='text-accent text-lg'>{allData.length}</strong> puntos de datos.</p>
          <p>Usa la rueda del ratón o los botones para hacer zoom.</p>
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