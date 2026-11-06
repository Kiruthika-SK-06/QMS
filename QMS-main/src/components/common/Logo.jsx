import React from "react";

export default function Logo({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <img
        src="/cdac-logo.png"
        alt="Centre for Development of Advanced Computing Quality Management System"
        className="brand-logo-img"
      />
      {!compact && (
        <div className="brand-info">
          <strong>Centre for Development of Advanced Computing</strong>
          <small>Quality Management System</small>
        </div>
      )}
    </div>
  );
}
