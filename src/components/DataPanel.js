// src/components/DataPanel.js
import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import "../styles/DataPanel.css";
import "../index.css";

// --- IMPORTACIONES CENTRALIZADAS ---
import {
  tagList,
  platformConfig,
  TIME_ID_TO_BUCKET
} from "../utils/globalConfig";


/* ---------- Utilidades de color (específica de este componente) ---------- */
function lightenColor(hex, percent) {
  try {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    const lr = Math.min(255, Math.round(r + (255 - r) * (percent / 100)));
    const lg = Math.min(255, Math.round(g + (255 - g) * (percent / 100)));
    const lb = Math.min(255, Math.round(b + (255 - b) * (percent / 100)));
    return `rgb(${lr},${lg},${lb})`;
  } catch {
    return hex;
  }
}

/* ---------- Utilidades de fecha/período ---------- */
const TIMEBUCKET_TO_TEXT = {
  "4w": "Últimas 4 semanas",
  "6m": "Últimos 6 meses",
  "1y": "Último año",
};

function safeFormatDate(value) {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function getDisplayDateLike(item = {}) {
  const details = item.details || {};
  // 1) date (raíz o en details)
  const rawDate = item.date ?? details.date;
  const fmt = safeFormatDate(rawDate);
  if (fmt) return fmt;

  // 2) period (raíz o en details)
  const period = item.period ?? details.period;
  if (period) return String(period);

  // 3) timeBucket o time numérico
  let tb = item.timeBucket ?? details.timeBucket;
  if (!tb && (item.time ?? details.time) != null) {
    tb = TIME_ID_TO_BUCKET[Number(item.time ?? details.time)];
  }
  if (tb) return TIMEBUCKET_TO_TEXT[tb] || String(tb);

  return null;
}

// --- VALORES POR DEFECTO ---
const defaultPlatform = { name: "Desconocido", color: "#cfe8ff" };

/* ---------- Componente principal ---------- */
export default function DataPanel({ item, allData = [], onClose, onSelect }) {
  const safeItem = useMemo(() => item ?? {}, [item]);
  const {
    id: itemId,
    title = "",
    artists = "",
    platformId,
    rank,
    tags = [],
    details = {},
    url,
  } = safeItem;

  // --- LÓGICA DE PLATAFORMA SIMPLIFICADA ---
  const platformInfo = useMemo(
    () => platformConfig.find((p) => p.id === platformId) || defaultPlatform,
    [platformId]
  );

  const { name: platformName, color: platformColor } = platformInfo;
  const finalUrl = url || details.url;
  const { dataType, subjective_notes, pageExamples } = details; // CAMBIO: Extraemos pageExamples

  const displayDate = useMemo(() => getDisplayDateLike(safeItem), [safeItem]);
  
  const recommendations = useMemo(() => {
    const list = Array.isArray(allData) ? allData : [];
    const base = list.filter(
      (d) => d && typeof d.platformId === "number" && d.id !== itemId
    );

    const scored = [];
    for (const d of base) {
      let score = 0;
      if (platformId && d.platformId === platformId) score += 1;
      if (tags?.length && d.tags?.length) {
        const shared = tags.filter((t) => d.tags.includes(t)).length;
        score += shared;
      }
      if (score > 0 && !scored.some((x) => x.item?.id === d.id)) {
        scored.push({ item: d, score });
      }
    }
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map((x) => x.item);
  }, [allData, itemId, platformId, tags]);

  if (!item) return null;

  return (
    <div className="data-panel-overlay" onClick={onClose}>
      <div className="data-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className="panel-header">
          <h4 className="platform-name text-2xl" style={{ color: platformColor }}>
            {platformName}
          </h4>
          <button className="btn-close cursor-target" onClick={onClose} aria-label="Cerrar panel">
            <Icon icon="pixelarticons:close" width="24" height="24" />
          </button>
        </header>

        {/* Body */}
        <div className="panel-body">
          {/* Título / artista / rank */}
          <div className="main-info flex flex-col">
            <div className="flex flex-row items-baseline">
              {typeof rank === "number" && <div className="rank">#{rank}</div>}
              {artists && <p className="artists px-2">{artists}</p>}
            </div>
            <h2 className="title ">{title}</h2>
          </div>

          {/* Meta info (tipo y fecha/periodo) */}
          {(displayDate || dataType) && (
            <div className="meta-info">
              {dataType && <span>{dataType}</span>}
              {displayDate && dataType && <span> • </span>}
              {displayDate && <span>{displayDate}</span>}
            </div>
          )}

          {/* Detalles dinámicos */}
          <DynamicDetails details={details} />

          {/* CAMBIO: Sección específica para pageExamples */}
          {pageExamples && pageExamples.length > 0 && (
            <div className="page-examples-section">
              <div className="detail-label">Ejemplos</div>
              <ul className="page-examples-list">
                {pageExamples.map((example, index) => (
                  <li key={index}>
                    <a 
                      href={example.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="example-link cursor-target"
                    >
                      <span>{example.title}</span>
                      <Icon icon="pixelarticons:external-link" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Notas subjetivas con color aclarado por plataforma */}
          {subjective_notes && (
            <div
              className="notes-section subjetivo-font"
              style={{
                color: lightenColor(platformColor, 40),
                fontWeight: 500,
                fontSize: "1.4rem",
              }}
            >
              <p>{subjective_notes}</p>
            </div>
          )}

          {/* Tags del ítem */}
          {tags.length > 0 && (
            <div className="tags">
              {tags.map((tag, i) => {
                const tagType = tagList.find((t) => t.name === tag)?.type || "topic";
                return (
                  <span key={i} className="tag" data-type={tagType}>
                    {tag}
                  </span>
                );
              })}
            </div>
          )}

          {/* Enlace */}
          {finalUrl && (
            <a
              href={finalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary-link cursor-target flex flex-row items-center"
            >
              Ver Enlace <Icon icon="pixelarticons:external-link" />
            </a>
          )}

          {/* Recomendaciones */}
          {recommendations.length > 0 && (
            <div className="recommendations">
              <h4 className="text-2xl mb-2">También puede interesarte:</h4>
              <div
                className="suggestion-list"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {recommendations.map((rec, idx) => {
                  const recPlatform = platformConfig.find(p => p.id === rec.platformId) || defaultPlatform;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className="suggestion-with-tags cursor-target"
                      onClick={() => {
                        onClose();
                        setTimeout(() => onSelect?.(rec), 100);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        textAlign: "left",
                        padding: "12px",
                        background: "rgba(255,255,255,0.04)",
                        border: `2px solid ${recPlatform.color}75`,
                        minHeight: 116,
                      }}
                    >
                      <div>
                        <div className="suggestion-title" style={{ fontWeight: 700 }}>
                          {rec.title}
                        </div>
                        {rec.artists && (
                          <div className="suggestion-sub" style={{ opacity: 0.85 }}>
                            {rec.artists}
                          </div>
                        )}
                        <div
                          className="suggestion-meta"
                          style={{ color: recPlatform.color, marginTop: 2, fontSize: 13 }}
                        >
                          {recPlatform.name}
                        </div>
                      </div>

                      {(rec.tags?.length ?? 0) > 0 && (
                        <div
                          className="tags"
                          style={{
                            marginTop: 8,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                          }}
                        >
                          {rec.tags.slice(0, 4).map((tg, i2) => {
                            const ttype = tagList.find((t) => t.name === tg)?.type || "topic";
                            return (
                              <span
                                key={i2}
                                className="tag"
                                data-type={ttype}
                                style={{ transform: "scale(0.9)" }}
                              >
                                {tg}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Subcomponentes ---------- */
const DetailItem = ({ label, value }) => {
  if (value === null || value === undefined || value === "") return null;
  const displayValue =
    typeof value === "object" && value !== null ? (
      <pre>{JSON.stringify(value, null, 2)}</pre>
    ) : (
      String(value)
    );
  return (
    <div className="detail-item flex flex-row">
      <div className="detail-label">{label}</div>
      <div className="detail-value px-4">{displayValue}</div>
    </div>
  );
};

const DynamicDetails = ({ details = {} }) => {
  const excludedKeys = new Set([
    "subjective_notes",
    "sourceFile",
    "name",
    "coordinates",
    "dataType",
    "date",
    "period",
    "timeBucket",
    "time",
    "pageExamples", 
    "url",
  ]);
  const keys = Object.keys(details).filter((k) => !excludedKeys.has(k));
  if (keys.length === 0) return null;

  return (
    <div className="details-grid">
      {keys.map((key) => {
        const label = key
          .replace(/([A-Z])/g, " $1")
          .replace(/_/g, " ")
          .replace(/^\w/, (c) => c.toUpperCase());

        let value = details[key];

        if (
          (key === "sent_count" ||
            key === "received_count" ||
            key === "totalSteps" ||
            key === "averageDailySteps" ||
            key === "visitCount" ||
            key === "eventCount") &&
          typeof value === "number"
        ) {
          value = value.toLocaleString("es-ES");
        }

        if (key === "statistics" && typeof value === "object") {
          return (
            <React.Fragment key={key}>
              <DetailItem
                label="Mensajes enviados"
                value={value.messages?.sent_count?.toLocaleString("es-ES")}
              />
              <DetailItem
                label="Mensajes recibidos"
                value={value.messages?.received_count?.toLocaleString("es-ES")}
              />
              <DetailItem
                label="Llamadas salientes"
                value={value.calls?.outgoing_count?.toLocaleString("es-ES")}
              />
              <DetailItem
                label="Llamadas entrantes"
                value={value.calls?.incoming_count?.toLocaleString("es-ES")}
              />
              <DetailItem label="GB enviados" value={value.totalBytes?.sent} />
              <DetailItem label="GB recibidos" value={value.totalBytes?.received} />
            </React.Fragment>
          );
        }

        return <DetailItem key={key} label={label} value={value} />;
      })}
    </div>
  );
};