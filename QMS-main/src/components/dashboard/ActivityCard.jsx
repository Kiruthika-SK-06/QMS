import React from "react";
import { NavLink } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import SectionHeader from "../common/SectionHeader";
import { getActivitySummary } from "../../utils/activityUtils";

export default function ActivityCard() {
  const { activities } = useApp();

  return (
    <section className="panel">
      <SectionHeader
        title="Recent activity"
        action={<NavLink className="text-link" to="/activity">View timeline</NavLink>}
      />
      <div className="mini-activity">
        {activities.slice(0, 5).map((item) => {
          const { title, detail } = getActivitySummary(item);
          return (
            <div className="mini-activity-item" key={item.id || item.text}>
              <span className={`activity-dot ${item.tone || "blue"}`} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: "12.5px", fontWeight: "600", color: "#0f172a", display: "block" }}>
                  {title}
                </strong>
                {detail && (
                  <span
                    style={{
                      fontSize: "11.5px",
                      color: "#475569",
                      display: "block",
                      marginTop: "1px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}
                  >
                    {detail}
                  </span>
                )}
                <small style={{ fontSize: "10.5px", color: "var(--muted)", display: "block", marginTop: "3px" }}>
                  {item.actor ? `${item.actor} • ` : ""}{item.time}
                </small>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
