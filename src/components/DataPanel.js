import React from "react";
import "../styles/DataPanel.css"; // asegúrate de crearlo o incluirlo en tu estilo global

export default function DataPanel({ item, onClose }) {
  if (!item) return null;

  const {
    title,
    artists,
    platform = "SPOTIFY",
    rank,
    tags = [],
  } = item;

  return (
    <div className="data-panel">
      <button className="btn-close" onClick={onClose}>×</button>

      <h4 className="platform">{platform}</h4>
      <h2 className="title">"{title}"</h2>
      {artists && <div className="artists">{artists}</div>}
      {typeof rank === "number" && <div className="rank">#{rank}</div>}

      {tags.length > 0 && (
        <div className="tags">
          {tags.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
