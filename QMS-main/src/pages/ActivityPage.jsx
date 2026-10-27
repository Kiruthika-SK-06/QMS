import React from "react";
import { useApp } from "../context/AppContext";
import PageIntro from "../components/common/PageIntro";
import { getActivitySummary } from "../utils/activityUtils";

export default function ActivityPage() {
  const { activities } = useApp();

  return (
    <>
      <PageIntro
        eyebrow="Audit trail"
        title="Activity"
        description="Chronological audit timeline of system activities."
      />
      <section className="panel">
        <div className="timeline">
          {activities.map((item) => {
            const { title, detail } = getActivitySummary(item);
            return (
              <div className="timeline-item" key={item.id || item.text}>
                <span className={`timeline-dot ${item.tone || "blue"}`} />
                <div>
                  <strong style={{ fontSize: "13.5px", fontWeight: "600", color: "#0f172a" }}>{title}</strong>
                  {detail && (
                    <p style={{ fontSize: "12.5px", color: "#334155", margin: "2px 0 4px 0" }}>
                      {detail}
                    </p>
                  )}
                  <small style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {item.actor ? `${item.actor} • ` : ""}{item.time}
                  </small>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
