// src/components/DataPanel.js
import React, { useMemo } from "react";
import { Icon } from "@iconify/react";
import "../styles/DataPanel.css";
import "../index.css";
import tagList from "../utils/tagConfig";

// Nombre legible por plataforma
const PLATFORM_ID_TO_NAME = {
  1: "Spotify",
  2: "YouTube",
  3: "TikTok",
  4: "Instagram",
  5: "iPhone",
  6: "WhatsApp",
  7: "Streaming",
  8: "Google",
};

// Clave MAYÚSCULA para mapear colores
const PLATFORM_ID_TO_KEY = {
  1: "SPOTIFY",
  2: "YOUTUBE",
  3: "TIKTOK",
  4: "INSTAGRAM",
  5: "IPHONE",
  6: "WHATSAPP",
  7: "STREAMING",
  8: "GOOGLE",
};

// Colores por plataforma (idénticos a DataDotGrid para consistencia)
const colorMapping = {
  SPOTIFY: "#39D353",
  YOUTUBE: "#FF5353",
  TIKTOK: "#A78BFA",
  INSTAGRAM: "#f87ad8",
  IPHONE: "#f2fb73",
  WHATSAPP: "#25d3bc",
  STREAMING: "#b457f7",
  GOOGLE: "#4285F4",
};
function lightenColor(hex, percent) {
  let num = parseInt(hex.replace("#", ""), 16);
  let r = (num >> 16) + Math.round((255 - (num >> 16)) * (percent / 100));
  let g = ((num >> 8) & 0x00ff) + Math.round((255 - ((num >> 8) & 0x00ff)) * (percent / 100));
  let b = (num & 0x0000ff) + Math.round((255 - (num & 0x0000ff)) * (percent / 100));

  return `rgb(${r},${g},${b})`;
}

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

const DynamicDetails = ({ details }) => {
  const excludedKeys = new Set([
    "subjective_notes",
    "sourceFile",
    "name",
    "coordinates",
    "dataType",
  ]);
  const detailKeys = Object.keys(details || {}).filter((key) => !excludedKeys.has(key));
  if (detailKeys.length === 0) return null;

  return (
    <div className="details-grid">
      {detailKeys.map((key) => {
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


export default function DataPanel({ item, allData = [], onClose, onSelect }) {
  // ✅ NUNCA condicionar hooks: usa valores “seguros”
  const safeItem = item ?? {};
  const {
    id: itemId,
    title = "",
    artists = "",
    platformId,
    rank,
    tags = [],
    details = {},
    url,
    date,
  } = safeItem;

  const platformName = PLATFORM_ID_TO_NAME[platformId] || "Desconocido";
  const platformKey = PLATFORM_ID_TO_KEY[platformId] || "UNKNOWN";
  const platformColor = colorMapping[platformKey] || "#cfe8ff";
  const finalUrl = url || details.url;
  const { dataType, subjective_notes } = details;

  // ✅ Hook SIEMPRE llamado
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

  // 👉 Ahora SÍ podemos salir si no hay item, pero DESPUÉS de los hooks
  if (!item) return null;

  return (
    <div className="data-panel-overlay" onClick={onClose}>
      <div className="data-panel" onClick={(e) => e.stopPropagation()}>
        <header className="panel-header">
          <h4 className="platform-name">{platformName}</h4>
          <button className="btn-close cursor-target" onClick={onClose} aria-label="Cerrar panel">
            <Icon icon="pixelarticons:close" width="24" height="24" />
          </button>
        </header>

        <div className="panel-body">
          <div className="main-info flex flex-col">
            <div className="flex flex-row items-baseline">
              {typeof rank === "number" && <div className="rank">#{rank}</div>}
              {artists && <p className="artists px-2">{artists}</p>}
            </div>
            <h2 className="title">"{title}"</h2>
          </div>

          {(date || dataType) && (
            <div className="meta-info">
              {dataType && <span>{dataType}</span>}
              {date && dataType && <span>•</span>}
              {date && (
                <span>
                  {new Date(date).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
            </div>
          )}

          <DynamicDetails details={details} />

          {subjective_notes && (
            <div
              className="notes-section subjetivo-font"
              style={{
                fontSize: "1.4rem",
                color: lightenColor(platformColor, 40),
         
                fontWeight: 500,
              }}
            >
              <p>{subjective_notes}</p>
            </div>
          )}

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
{recommendations.length > 0 && (
  <div className="recommendations">
    <h3 className="text-2xl mb-4">También puede interesarte:</h3>

    {/* usamos grid a 2 columnas con alturas iguales */}
    <div className="suggestion-grid">
      {recommendations.map((rec, idx) => {
        const recTags = rec.tags || [];
        const handleSelect = () => {
          onClose();
          setTimeout(() => onSelect(rec), 100);
        };
        const handleKeyDown = (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect();
          }
        };

        return (
          <div
            key={idx}
            className="suggestion-card cursor-target"
            role="button"
            tabIndex={0}
            onClick={handleSelect}
            onKeyDown={handleKeyDown}
          >
            {/* Cabecera: título / subtítulo / plataforma */}
            <div className="suggestion-header">
              <div className="suggestion-title">"{rec.title}"</div>
              {rec.artists && <div className="suggestion-sub">{rec.artists}</div>}
              <div className="suggestion-meta">
                {PLATFORM_ID_TO_NAME[rec.platformId] ?? "—"}
              </div>
            </div>

            {/* Tags de la recomendación */}
            {recTags.length > 0 && (
              <div className="suggestion-tags">
                {recTags.slice(0, 4).map((tag, i) => {
                  const tagType =
                    tagList.find((t) => t.name === tag)?.type || "topic";
                  return (
                    <span key={i} className="tag tag--sm" data-type={tagType}>
                      {tag}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
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
