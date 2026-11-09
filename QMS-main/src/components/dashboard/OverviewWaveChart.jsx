import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

const DATASETS = {
  "This Year": {
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"],
    series1: [76, 92, 79, 91, 78, 93, 81, 88],
    series2: [58, 73, 61, 75, 62, 77, 64, 72],
    primaryMetric: "87.4%",
    primaryLabel: "Quality Performance Index"
  },
  "This Quarter": {
    months: ["Jun", "Jul", "Aug", "Sep"],
    series1: [84, 91, 86, 94],
    series2: [68, 75, 71, 79],
    primaryMetric: "90.2%",
    primaryLabel: "Q3 Cumulative Rating"
  },
  "This Month": {
    months: ["W1", "W2", "W3", "W4"],
    series1: [82, 88, 85, 93],
    series2: [66, 72, 70, 78],
    primaryMetric: "89.5%",
    primaryLabel: "Monthly Active Progress"
  }
};

export default function OverviewWaveChart({ title = "Quality Performance Index", metric = "87.4%" }) {
  const [selectedFilter, setSelectedFilter] = useState("This Year");
  const [hoverIndex, setHoverIndex] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const currentData = DATASETS[selectedFilter] || DATASETS["This Year"];
  const { months, series1, series2, primaryMetric, primaryLabel } = currentData;

  // Chart coordinate space
  const svgWidth = 680;
  const svgHeight = 230;
  const padLeft = 40;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 35;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const yMin = 50;
  const yMax = 100;
  const yTicks = [99, 90, 81, 72, 63, 54];

  // Convert data points to SVG coordinates
  const points1 = series1.map((val, idx) => {
    const x = padLeft + (idx / (months.length - 1)) * chartW;
    const y = padTop + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
    return { x, y, val };
  });

  const points2 = series2.map((val, idx) => {
    const x = padLeft + (idx / (months.length - 1)) * chartW;
    const y = padTop + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
    return { x, y, val };
  });

  // Smooth cubic Bezier spline path generator
  const createSmoothPath = (pts) => {
    if (!pts.length) return "";
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath1 = createSmoothPath(points1);
  const linePath2 = createSmoothPath(points2);

  const bottomY = padTop + chartH;
  const areaPath1 = `${linePath1} L ${points1[points1.length - 1].x.toFixed(1)} ${bottomY} L ${points1[0].x.toFixed(1)} ${bottomY} Z`;
  const areaPath2 = `${linePath2} L ${points2[points2.length - 1].x.toFixed(1)} ${bottomY} L ${points2[0].x.toFixed(1)} ${bottomY} Z`;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clientX - (padLeft / svgWidth) * rect.width) / ((chartW / svgWidth) * rect.width)));
    const idx = Math.round(ratio * (months.length - 1));
    if (idx >= 0 && idx < months.length) {
      setHoverIndex(idx);
    }
  };

  const activeIdx = hoverIndex !== null ? hoverIndex : points1.length - 1;
  const activePt1 = points1[activeIdx];
  const activePt2 = points2[activeIdx];

  return (
    <div className="overview-wave-chart-card">
      {/* Top Header */}
      <div className="wave-chart-header">
        <div className="wave-chart-title-group">
          <strong className="wave-chart-metric">{primaryMetric || metric}</strong>
          <span className="wave-chart-subtitle">{primaryLabel || title}</span>
        </div>

        {/* Legend */}
        <div className="wave-chart-legend">
          <div className="wave-legend-item">
            <span className="wave-legend-dot primary" />
            <span className="wave-legend-label">Process Completion</span>
          </div>
          <div className="wave-legend-item">
            <span className="wave-legend-dot secondary" />
            <span className="wave-legend-label">Audit Compliance</span>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="wave-filter-wrapper">
          <button
            type="button"
            className="wave-filter-btn"
            onClick={() => setFilterOpen((prev) => !prev)}
          >
            <span>{selectedFilter}</span>
            <ChevronDown size={14} className={filterOpen ? "rotated" : ""} />
          </button>

          {filterOpen && (
            <div className="wave-filter-dropdown">
              {Object.keys(DATASETS).map((filterKey) => (
                <button
                  type="button"
                  key={filterKey}
                  className={`wave-filter-option ${selectedFilter === filterKey ? "active" : ""}`}
                  onClick={() => {
                    setSelectedFilter(filterKey);
                    setFilterOpen(false);
                    setHoverIndex(null);
                  }}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SVG Wave Chart Area */}
      <div
        className="wave-chart-svg-container"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="wave-chart-svg"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Primary Wave Gradient (Royal Blue) */}
            <linearGradient id="primaryWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#384FB8" stopOpacity="0.28" />
              <stop offset="60%" stopColor="#384FB8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#384FB8" stopOpacity="0.0" />
            </linearGradient>

            {/* Secondary Wave Gradient (Cyan / Teal) */}
            <linearGradient id="secondaryWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.24" />
              <stop offset="70%" stopColor="#06B6D4" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines and Y-Ticks */}
          {yTicks.map((tickVal) => {
            const y = padTop + chartH - ((tickVal - yMin) / (yMax - yMin)) * chartH;
            return (
              <g key={tickVal} className="wave-grid-group">
                <text
                  x={padLeft - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="wave-y-tick"
                >
                  {tickVal}
                </text>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={padLeft + chartW}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              </g>
            );
          })}

          {/* Area Fills */}
          <path d={areaPath1} fill="url(#primaryWaveGrad)" />
          <path d={areaPath2} fill="url(#secondaryWaveGrad)" />

          {/* Smooth Wave Lines */}
          <path
            d={linePath1}
            fill="none"
            stroke="#384FB8"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d={linePath2}
            fill="none"
            stroke="#06B6D4"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Vertical Guide Line on Hover */}
          {hoverIndex !== null && activePt1 && (
            <line
              x1={activePt1.x}
              y1={padTop}
              x2={activePt1.x}
              y2={bottomY}
              stroke="#94A3B8"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
          )}

          {/* Data Points on Curves */}
          {points1.map((pt, idx) => (
            <circle
              key={`pt1-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === idx ? 5 : 3.5}
              fill="#ffffff"
              stroke="#384FB8"
              strokeWidth={hoverIndex === idx ? 3 : 2}
              style={{ transition: "all 0.15s ease" }}
            />
          ))}

          {points2.map((pt, idx) => (
            <circle
              key={`pt2-${idx}`}
              cx={pt.x}
              cy={pt.y}
              r={hoverIndex === idx ? 5 : 3}
              fill="#ffffff"
              stroke="#06B6D4"
              strokeWidth={hoverIndex === idx ? 3 : 2}
              style={{ transition: "all 0.15s ease" }}
            />
          ))}

          {/* X-Axis Month Labels */}
          {points1.map((pt, idx) => (
            <text
              key={`label-${idx}`}
              x={pt.x}
              y={bottomY + 18}
              textAnchor="middle"
              className={`wave-x-tick ${hoverIndex === idx ? "active" : ""}`}
            >
              {months[idx]}
            </text>
          ))}
        </svg>

        {/* Floating Tooltip Box */}
        {hoverIndex !== null && activePt1 && activePt2 && (
          <div
            className="wave-chart-tooltip"
            style={{
              left: `${(activePt1.x / svgWidth) * 100}%`,
              top: `${(Math.min(activePt1.y, activePt2.y) / svgHeight) * 100 - 18}%`
            }}
          >
            <strong className="tooltip-title">{months[activeIdx]} 2026</strong>
            <div className="tooltip-row primary">
              <span className="dot" />
              <span>Process:</span>
              <strong>{activePt1.val}%</strong>
            </div>
            <div className="tooltip-row secondary">
              <span className="dot" />
              <span>Audit:</span>
              <strong>{activePt2.val}%</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

