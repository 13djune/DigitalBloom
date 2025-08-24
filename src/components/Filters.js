// src/components/Filters.js
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import "../styles/filters.css";
import PixelButton from "../components/PixelButton";
import tagList from "../utils/tagConfig";

export default function Filters({ open, onClose, onApply, onReset, initialState }) {
  // Estado interno del modal
  const [level, setLevel] = useState(1);
  const [time, setTime] = useState(1);
  const [platforms, setPlatforms] = useState(() => new Set());
  const [tags, setTags] = useState(() => new Set());

  // --- Rehidratar desde initialState cuando se ABRE el modal ---
  useEffect(() => {
    if (!open) return;
    
    const {
      level: lv,
      time: tm,
      platforms: pf,
      tags: tg,
    } = initialState || {};

    setLevel(Number(lv) || 1);
    setTime(Number(tm) || 1);
    setPlatforms(new Set(Array.isArray(pf) ? pf : []));
    setTags(new Set(Array.isArray(tg) ? tg : []));
  }, [open, initialState]);

  const levels = useMemo( () => [ { id: 1, label: "DESEO" }, { id: 2, label: "CUERPO" }, { id: 3, label: "RASTRO" } ], [] );
  const times = useMemo( () => [ { id: 1, line1: "ÚLTIMAS", line2: "4 SEMANAS" }, { id: 2, line1: "ÚLTIMOS", line2: "6 MESES" }, { id: 3, line1: "ÚLTIMO", line2: "AÑO" } ], [] );
  const platformItems = useMemo(() => Array.from({ length: 8 }, (_, i) => ({ id: i + 1 })), []);

  const allTags = useMemo(() => {
    const typeOrder = ['consciencia', 'dispositivo', 'state', 'meta', 'topic', 'genre', 'lang', 'other'];
    return tagList
      .filter((tag, index, self) => self.findIndex(t => t.name === tag.name) === index)
      .sort((a, b) => {
        const aIdx = typeOrder.indexOf(a.type);
        const bIdx = typeOrder.indexOf(b.type);
        return aIdx !== bIdx ? aIdx - bIdx : a.name.localeCompare(b.name);
      });
  }, []);

    const activeCount = 1 + 1 + platforms.size + tags.size;

  const togglePlatform = (id) => setPlatforms((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleTag = (name) => setTags((prev) => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; });
  
  const handleReset = () => { onReset?.(); };
  const handleApply = () => { onApply?.({ level, time, platforms: Array.from(platforms), tags: Array.from(tags) }); onClose?.(); };
  
  const modalRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  const onOverlayClick = (e) => { if (modalRef.current && !modalRef.current.contains(e.target)) onClose?.(); };

  if (!open) return null;

  return (
    <div className="filters-overlay" onMouseDown={onOverlayClick}>
      <section ref={modalRef} className="filters-modal">
        <header className="filters-header">
          <h2 className="filters-title">FILTROS <span className="filters-count">{activeCount}</span></h2>
          <div className="filters-actions">
            <PixelButton className="btn-reset cursor-target" onClick={handleReset}>RESETEAR<Icon icon="pixelarticons:trash" width="16" height="16" /></PixelButton>
            <button className="btn-icon cursor-target" onClick={onClose} aria-label="Cerrar"><Icon icon="pixelarticons:close" width="22" height="22" /></button>
          </div>
        </header>
        <hr className="filters-sep" />
        <div className="filters-row filters-row--top">
          <div className="filters-col">
            <h3 className="filters-subtitle">NIVEL DE CONCIENCIA</h3>
            <div className="filters-stepper">
              {levels.flatMap((it, i) => {
                const btn = (
                  <div className="filters-step" key={`lvl-${it.id}`}>
                    <button className={`step-dot cursor-target ${level === it.id ? "is-active" : ""}`} onClick={() => setLevel(it.id)} aria-pressed={level === it.id}>{it.id}</button>
                    <div className="step-label">{it.label}</div>
                  </div>
                );
                const track = i < levels.length - 1 ? <div className="step-track" key={`lvl-track-${it.id}`} /> : null;
                return track ? [btn, track] : [btn];
              })}
            </div>
          </div>
          <div className="filters-col filters-col--time">
            <h3 className="filters-subtitle">TIEMPO</h3>
            <div className="filters-stepper">
              {times.flatMap((it, i) => {
                const step = (
                  <div className="filters-step" key={`tm-${it.id}`}>
                    <button className={`time-dot cursor-target ${time === it.id ? "is-active" : ""}`} onClick={() => setTime(it.id)} aria-pressed={time === it.id} />
                    <div className={`step-caption ${time === it.id ? "is-active" : ""}`}>
                      <span>{it.line1}</span><br /><span>{it.line2}</span>
                    </div>
                  </div>
                );
                const track = i < times.length - 1 ? <div className="step-track" key={`tm-track-${it.id}`} /> : null;
                return track ? [step, track] : [step];
              })}
            </div>
          </div>
        </div>
        <hr className="filters-sep subtle" />
        <div className="filters-row filters-row--bottom">
          <div className="filters-col filters-col--platforms">
            <h3 className="filters-subtitle">PLATAFORMAS</h3>
            <div className="platform-grid">
              {platformItems.map((p) => {
                const active = platforms.has(p.id);
                return <button key={p.id} className={`plat-tile cursor-target ${active ? "is-active" : ""}`} onClick={() => togglePlatform(p.id)} aria-pressed={active} title={`Plataforma ${p.id}`} />;
              })}
            </div>
          </div>
          <div className="filters-col filters-col--tags">
            <div className="filters-subtitle">ETIQUETAS</div>
            <div className="tags-wrap">
              {allTags.map(({ name, type }) => {
                const active = tags.has(name);
                return (
                  <button
                  key={name}
                  className={`tag cursor-target ${active ? "is-active" : ""}`}
                  data-type={type}
                  onClick={() => toggleTag(name)}
                  aria-pressed={active}
                  title={name}
                >
                  <span className="tag-label">{name}</span>
                  {active && <Icon icon="pixelarticons:close" width="12" height="12" />}
                </button>
                
                );
              })}
            </div>
          </div>
        </div>
        <div className="filters-footer">
          <PixelButton className="cursor-target" onClick={handleApply}>EXPLORAR<Icon icon="pixelarticons:search" width="18" height="18" /></PixelButton>
        </div>
      </section>
    </div>
  );
}