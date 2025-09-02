// src/components/CustomTooltip.js
import React, { useState, useEffect, useRef } from "react";
import "../styles/Tooltip.css";

const CustomTooltip = ({ text, visible, targetRect }) => {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (visible && targetRect && tooltipRef.current) {
      const tooltipEl = tooltipRef.current;
      const { width: tooltipWidth, height: tooltipHeight } = tooltipEl.getBoundingClientRect();
      const offset = 10;

      let top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      let left = targetRect.right + offset;
      
      if (left + tooltipWidth > window.innerWidth) {
        left = targetRect.left - tooltipWidth - offset;
      }

      if (left < 0) {
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
        top = targetRect.top - tooltipHeight - offset;
      }
      
      if (top < 0) {
        top = targetRect.bottom + offset;
      }

      top = Math.max(8, Math.min(top, window.innerHeight - tooltipHeight - 8));
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));
      
      setPosition({ top, left });
    }
  }, [text, visible, targetRect]);

  if (!visible) {
    return null;
  }
  
  const style = {
    position: 'fixed',
    top: `${position.top}px`,
    left: `${position.left}px`,
  };

  return (
    <div ref={tooltipRef} className={`custom-tooltip ${visible ? 'visible' : ''}`} style={style}>
      {text}
    </div>
  );
};

export default CustomTooltip;