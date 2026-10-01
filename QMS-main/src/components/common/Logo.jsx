import React from "react";

export default function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <div className="brand-mark">
        <span>C</span>
        <span>D</span>
        <span>A</span>
        <span>C</span>
      </div>
      {!compact && (
        <div>
          <strong>C-DAC</strong>
          <small>Quality Management System</small>
        </div>
      )}
    </div>
  );
}
