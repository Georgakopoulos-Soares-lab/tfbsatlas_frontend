// InfoTooltip.jsx
import React from 'react';
import "../../styles/InfoTooltip.css";

export function InfoTooltip({ message }) {
  return (
    <span title={message} className="info-tooltip">
      ?
    </span>
  );
}
