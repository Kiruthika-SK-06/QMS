import React from "react";

export default function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <img
        src="/cdac-logo.png"
        alt="C-DAC Quality Management System"
        className="brand-logo-img"
      />
      {!compact && (
        <div className="brand-info">
          <strong>C-DAC</strong>
          <small>Quality Management System</small>
        </div>
      )}
    </div>
  );
}
