import React from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  trend,
  hint,
  progress = 75,
  direction = "up",
  color,
  onClick
}) {
  // Map tone to pure premium stay blue palette accents
  const toneColors = {
    blue: "#384FB8",
    teal: "#0284C7",
    cyan: "#0284C7",
    dark: "#0C1979",
    purple: "#384FB8",
    green: "#10B981",
    amber: "#F59E0B"
  };

  const ringColor = color || toneColors[tone] || "#384FB8";
  const size = 38;
  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;

  // Derive visual progress percentage if value is like "85%" or number
  let derivedProgress = progress;
  if (typeof value === "string" && value.includes("%")) {
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed)) derivedProgress = Math.min(100, Math.max(10, parsed));
  } else if (typeof value === "number") {
    derivedProgress = Math.min(100, Math.max(25, value * 15));
  }

  const strokeDashoffset = circumference - (derivedProgress / 100) * circumference;

  return (
    <div className={`stat-card gauge-card ${onClick ? "clickable" : ""}`} onClick={onClick}>
      {/* Left: Circular Progress Ring Gauge with Diagonal Arrow */}
      <div className="stat-gauge-wrap">
        <svg width={size} height={size} className="gauge-svg">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#EBEDFE"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            className="gauge-circle-stroke"
          />
        </svg>

        {/* Center Diagonal Arrow */}
        <div className="gauge-arrow-center" style={{ color: ringColor }}>
          {direction === "down" ? (
            <ArrowDownRight size={14} strokeWidth={2.4} />
          ) : (
            <ArrowUpRight size={14} strokeWidth={2.4} />
          )}
        </div>
      </div>

      {/* Right: Metrics Stack */}
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        {(trend || hint) && <small className="stat-hint">{trend || hint}</small>}
      </div>
    </div>
  );
}
